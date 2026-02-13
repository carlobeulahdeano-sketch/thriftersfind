"use client";

import { useState } from "react";
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
import type { Product } from "@/lib/types";
import { Image as ImageIcon, X, RefreshCw, PhilippinePeso } from "lucide-react";
import { createProduct } from "../actions";

import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (product?: any) => void;
  simpleMode?: boolean;
}

export function AddProductDialog({ isOpen, onClose, onSuccess, simpleMode = false }: AddProductDialogProps) {
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [variantColor, setVariantColor] = useState("");
  const [description, setDescription] = useState("");
  const [baseSku, setBaseSku] = useState(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)) + "-" + Math.floor(Math.random() * 100).toString().padStart(2, '0'));
  const [quantity, setQuantity] = useState("0");
  const [cost, setCost] = useState("0.00");
  const [retailPrice, setRetailPrice] = useState("0.00");
  const [alertStock, setAlertStock] = useState("0");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Restore helper functions
  const sku = baseSku + (variantColor ? "-" + variantColor : "");

  const regenerateSku = () => {
    setBaseSku(String.fromCharCode(65 + Math.floor(Math.random() * 26)) + "-" + Math.floor(Math.random() * 100).toString().padStart(2, '0'));
  };

  const resetForm = () => {
    setName("");
    setVariantColor("");
    setBaseSku(String.fromCharCode(65 + Math.floor(Math.random() * 26)) + "-" + Math.floor(Math.random() * 100).toString().padStart(2, '0'));
    setDescription("");
    setQuantity("0");
    setCost("0.00");
    setRetailPrice("0.00");
    setAlertStock("0");
    setImages([]);
    setImagePreviews([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(prev => [...prev, ...filesArray]);

      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const missingFields = [];
    if (!name) missingFields.push("Product Name");

    if (!simpleMode) {
      if (!description) missingFields.push("Description");
      if (!cost || parseFloat(cost) <= 0) missingFields.push("Cost");
      if (!quantity && quantity !== "0") missingFields.push("Quantity");
      if (!alertStock && alertStock !== "0") missingFields.push("Alert Stock");
      if (images.length === 0) missingFields.push("Product Images");
    }
    if (!retailPrice || parseFloat(retailPrice) <= 0) missingFields.push("Retail Price");

    if (missingFields.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: `Please fill in the following fields: ${missingFields.join(", ")}`,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Convert uploaded files to data URLs (if any)
      const imageDataUrls: string[] = [];

      for (const file of images) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        imageDataUrls.push(dataUrl);
      }

      const productData = {
        name,
        sku: simpleMode ? (name.toUpperCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 1000)) : sku,
        description: description || (simpleMode ? "Auto-created from Pre-order" : ""),
        quantity: parseInt(quantity) || 0,
        alertStock: parseInt(alertStock) || 0,
        cost: parseFloat(cost) || 0,
        retailPrice: parseFloat(retailPrice) || 0,
        images: imageDataUrls,
      };

      const newProduct = await createProduct(productData);

      toast({
        title: "Product Added",
        description: `Product "${name}" has been added to the inventory.`,
      });

      resetForm();
      onClose();
      onSuccess?.(newProduct);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        {/* Gradient Header */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-t-lg flex items-center px-6">
          <div className="flex items-center gap-3 text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <div>
              <DialogTitle className="text-white text-lg font-semibold">Add New Product</DialogTitle>
              <DialogDescription className="text-teal-100 text-sm">
                Enter the details for the new product to add it to your inventory.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content with top padding for header */}
        <div className="pt-12 max-h-[75vh] overflow-y-auto pr-2">
          {/* Product Information Section */}
          <div className="bg-teal-50/50 dark:bg-teal-950/20 rounded-lg p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-semibold text-sm">Product Information</h3>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Product Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white dark:bg-gray-950"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sku" className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    SKU
                  </Label>
                  <div className="flex gap-2">
                    <Input value={baseSku} readOnly className="bg-white dark:bg-gray-950" />
                    <Input
                      placeholder="Variant Color"
                      value={variantColor}
                      onChange={(e) => setVariantColor(e.target.value)}
                      className="bg-white dark:bg-gray-950"
                    />
                    <Button type="button" onClick={regenerateSku} size="icon" variant="outline" className="shrink-0">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description" className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-white dark:bg-gray-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity" className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="bg-white dark:bg-gray-950"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="alertStock" className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Alert Stock
                  </Label>
                  <Input
                    id="alertStock"
                    type="number"
                    value={alertStock}
                    onChange={(e) => setAlertStock(e.target.value)}
                    className="bg-white dark:bg-gray-950"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-teal-50/50 dark:bg-teal-950/20 rounded-lg p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <PhilippinePeso className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-sm">Pricing</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cost" className="flex items-center gap-2 text-sm">
                  <PhilippinePeso className="w-4 h-4 text-teal-600" />
                  Cost
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    ₱
                  </span>
                  <Input
                    id="cost"
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="pl-7 bg-white dark:bg-gray-950"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="retailPrice" className="flex items-center gap-2 text-sm">
                  <PhilippinePeso className="w-4 h-4 text-teal-600" />
                  Retail Price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    ₱
                  </span>
                  <Input
                    id="retailPrice"
                    type="number"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    className="pl-7 bg-white dark:bg-gray-950"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Product Images Section */}
          <div className="bg-teal-50/50 dark:bg-teal-950/20 rounded-lg p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-sm">Product Images</h3>
            </div>

            <div className="grid gap-2">
              <div className="border-2 border-dashed border-teal-300 dark:border-teal-700 rounded-md p-6 text-center bg-white dark:bg-gray-950">
                <Input
                  id="images"
                  type="file"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Label htmlFor="images" className="cursor-pointer">
                  <ImageIcon className="mx-auto h-12 w-12 text-teal-500" />
                  <span className="mt-2 block text-sm font-medium text-teal-600 dark:text-teal-400">Click to upload images</span>
                </Label>
              </div>
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img src={preview} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded-md border-2 border-teal-200 dark:border-teal-800" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">The first image will be used as the primary display image.</p>
            </div>
          </div>

          {/* Footer Buttons */}
          <DialogFooter className="gap-2 sticky bottom-0 bg-background pt-4 pb-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            >
              {isLoading ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
