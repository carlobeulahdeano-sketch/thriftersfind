
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, X } from "lucide-react";
import { updateProduct } from "../actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product, Batch } from "@/lib/types";

interface EditProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess?: () => void;
}

export function EditProductDialog({ isOpen, onClose, product, onSuccess }: EditProductDialogProps) {
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [cost, setCost] = useState("0.00");
  const [retailPrice, setRetailPrice] = useState("0.00");
  const [alertStock, setAlertStock] = useState("0");
  const [isLoading, setIsLoading] = useState(false);



  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setDescription(product.description);
      setQuantity(String(product.quantity || 0));
      setCost(String(product.cost));
      setRetailPrice(String(product.retailPrice || 0));
      setAlertStock(String(product.alertStock || 0));
      setExistingImages(product.images || []);

      setNewImages([]);
      setNewImagePreviews([]);
      setImagesToRemove([]);
    }
  }, [product]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setNewImages(prev => [...prev, ...filesArray]);

      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setNewImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageUrl: string) => {
    setExistingImages(prev => prev.filter(url => url !== imageUrl));
    setImagesToRemove(prev => [...prev, imageUrl]);
  };


  const handleSave = async () => {
    if (!product) return;

    if (!name || !sku || !cost || !retailPrice) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out Name, SKU, Cost and Retail Price.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Convert new uploaded files to data URLs
      const newImageDataUrls: string[] = [];

      for (const file of newImages) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newImageDataUrls.push(dataUrl);
      }

      // Combine remaining existing images with new images
      const finalImages = [...existingImages, ...newImageDataUrls];

      const productData = {
        name,
        sku,
        description,
        quantity: parseInt(quantity) || 0,
        alertStock: parseInt(alertStock) || 0,
        cost: parseFloat(cost) || 0,
        retailPrice: parseFloat(retailPrice) || 0,
        images: finalImages,
      };

      await updateProduct(product.id, productData);

      toast({
        title: "Product Updated",
        description: `Product "${name}" has been updated successfully.`,
      });

      onClose();
      onSuccess?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the details for this product.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Product Name</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sku">SKU</Label>
              <Input id="edit-sku" value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Quantity (QTY)</Label>
            <div className="grid gap-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-quantity" className="text-xs">Quantity</Label>
                <Input id="edit-quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-cost">Cost (PHP)</Label>
              <Input id="edit-cost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-retailPrice">Retail Price (PHP)</Label>
              <Input id="edit-retailPrice" type="number" value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-alertStock">Alert Stock</Label>
              <Input id="edit-alertStock" type="number" value={alertStock} onChange={(e) => setAlertStock(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Product Images</Label>
            <div className="grid grid-cols-3 gap-2">
              {existingImages.map((url, index) => (
                <div key={index} className="relative">
                  <img src={url} alt={`Existing ${index}`} className="w-full h-24 object-cover rounded-md" />
                  <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeExistingImage(url)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
              {newImagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img src={preview} alt={`New Preview ${index}`} className="w-full h-24 object-cover rounded-md" />
                  <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeNewImage(index)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
              <div className="border-2 border-dashed border-muted-foreground/50 rounded-md flex items-center justify-center h-24">
                <Input id="edit-images" type="file" multiple onChange={handleImageChange} className="hidden" />
                <Label htmlFor="edit-images" className="cursor-pointer text-center p-2">
                  <ImageIcon className="mx-auto h-6 w-6 text-muted-foreground" />
                  <span className="mt-1 block text-xs font-medium text-muted-foreground">Add images</span>
                </Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">The first image will be used as the primary display image.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
