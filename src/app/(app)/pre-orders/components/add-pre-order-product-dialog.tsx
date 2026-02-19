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
import { Image as ImageIcon, X, RefreshCw, Check, Search } from "lucide-react";
import { createPreOrderProduct } from "../actions";
import { searchProducts } from "../../inventory/actions";
import { cn } from "@/lib/utils";

interface AddPreOrderProductDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AddPreOrderProductDialog({ isOpen, onClose, onSuccess }: AddPreOrderProductDialogProps) {
    const { toast } = useToast();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    // Auto-generate SKU
    const [sku, setSku] = useState(() => "PRE-" + Math.random().toString(36).substring(2, 8).toUpperCase());
    const [quantity, setQuantity] = useState("0");
    const [cost, setCost] = useState("0.00");
    const [retailPrice, setRetailPrice] = useState("0.00");
    const [alertStock, setAlertStock] = useState("0");
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Inventory Linking State
    const [openCombobox, setOpenCombobox] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [linkedProductId, setLinkedProductId] = useState<string | null>(null);
    const [linkedProductName, setLinkedProductName] = useState<string>("");
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchValue.trim()) {
                const results = await searchProducts(searchValue);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchValue]);

    const regenerateSku = () => {
        setSku("PRE-" + Math.random().toString(36).substring(2, 8).toUpperCase());
    };

    const resetForm = () => {
        setName("");
        regenerateSku();
        setDescription("");
        setQuantity("0");
        setCost("0.00");
        setRetailPrice("0.00");
        setAlertStock("0");
        setImages([]);
        setImagePreviews([]);
        setLinkedProductId(null);
        setLinkedProductName("");
        setSelectedProduct(null);
        setSearchValue("");
        setSearchResults([]);
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
        if (!description) missingFields.push("Description");
        if (!cost || parseFloat(cost) <= 0) missingFields.push("Cost");

        // Retail Price is optional/can be 0 if not set, but let's check basic validity if entered
        // if (!retailPrice) missingFields.push("Retail Price"); 

        if (images.length === 0) missingFields.push("Product Images");

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
            // Convert uploaded files to data URLs
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
                sku,
                description,
                quantity: parseInt(quantity) || 0,
                alertStock: parseInt(alertStock) || 0,
                cost: parseFloat(cost) || 0,
                retailPrice: parseFloat(retailPrice) || 0,
                images: imageDataUrls,
                inventoryProductId: linkedProductId || undefined,
            };

            await createPreOrderProduct(productData);

            toast({
                title: "Product Added",
                description: `Product "${name}" has been added to the pre-order inventory.`,
            });

            resetForm();
            onClose();
            onSuccess?.();
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
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add Pre-Order Product</DialogTitle>
                    <DialogDescription>
                        Enter the details for the new pre-order product.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">

                    {/* Link Inventory Item Section - Redesigned */}
                    <div className="space-y-3">
                        <Label>Select Existing Product</Label>

                        {!linkedProductId ? (
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                                <Input
                                    placeholder="Search product by name or SKU..."
                                    className="pl-9 h-10"
                                    value={searchValue}
                                    onChange={(e) => {
                                        setSearchValue(e.target.value);
                                        if (e.target.value && !openCombobox) setOpenCombobox(true);
                                    }}
                                    onFocus={() => setOpenCombobox(true)}
                                />
                                {openCombobox && searchValue.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[300px] overflow-y-auto rounded-lg border bg-popover shadow-xl animate-in fade-in-0 zoom-in-95">
                                        {searchResults.length === 0 ? (
                                            <div className="p-4 text-sm text-center text-muted-foreground">
                                                No products found.
                                            </div>
                                        ) : (
                                            <div className="p-1 space-y-1">
                                                {searchResults.map((product) => (
                                                    <div
                                                        key={product.id}
                                                        className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors group"
                                                        onClick={() => {
                                                            setLinkedProductId(product.id);
                                                            setLinkedProductName(product.name);
                                                            setSelectedProduct(product);

                                                            // Autofill
                                                            setName(product.name);
                                                            if (!description && product.description) setDescription(product.description);

                                                            setOpenCombobox(false);
                                                            setSearchValue("");
                                                        }}
                                                    >
                                                        <div className="h-10 w-10 rounded-md bg-muted border overflow-hidden shrink-0">
                                                            {product.images?.[0] ? (
                                                                <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <ImageIcon className="h-5 w-5 m-auto mt-2 text-muted-foreground/50" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{product.name}</p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <span className="font-mono bg-muted px-1 rounded">{product.sku}</span>
                                                                <span>•</span>
                                                                <span>{product.totalStock} in stock</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Overlay to close */}
                                {openCombobox && (
                                    <div
                                        className="fixed inset-0 z-40 bg-transparent"
                                        onClick={() => setOpenCombobox(false)}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 p-3 border border-primary/20 bg-primary/5 rounded-lg shadow-sm animate-in fade-in zoom-in-95 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                                <div className="h-12 w-12 rounded-md bg-background border shadow-sm overflow-hidden shrink-0 z-10">
                                    {selectedProduct?.images?.[0] ? (
                                        <img src={selectedProduct.images[0]} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-muted"><ImageIcon className="h-6 w-6" /></div>
                                    )}
                                </div>
                                <div className="flex-1 z-10 min-w-0">
                                    <h4 className="font-semibold text-sm text-foreground truncate">{linkedProductName}</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                        <Check className="h-3 w-3 text-green-500" />
                                        <span>Linked to inventory</span>
                                        {selectedProduct && <span className="opacity-50">| SKU: {selectedProduct.sku}</span>}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="z-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                        setLinkedProductId(null);
                                        setLinkedProductName("");
                                        setSelectedProduct(null);
                                    }}
                                >
                                    Change
                                </Button>
                            </div>
                        )}
                        <p className="text-[0.8rem] text-muted-foreground">
                            Selecting an existing product will autofill details and link stock history.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Product Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="sku">SKU</Label>
                            <div className="flex gap-2">
                                <Input value={sku} onChange={(e) => setSku(e.target.value)} />
                                <Button type="button" onClick={regenerateSku} size="icon" variant="outline" className="w-10">
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="alertStock">Alert Stock level</Label>
                            <Input id="alertStock" type="number" value={alertStock} onChange={(e) => setAlertStock(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="cost">Cost (PHP)</Label>
                            <Input id="cost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="retailPrice">Retail Price (PHP)</Label>
                            <Input id="retailPrice" type="number" value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="images">Product Images</Label>
                        <div className="border-2 border-dashed border-muted-foreground/50 rounded-md p-4 text-center">
                            <Input
                                id="images"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                            <Label htmlFor="images" className="cursor-pointer">
                                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                                <span className="mt-2 block text-sm font-medium text-muted-foreground">Click to upload images</span>
                            </Label>
                        </div>
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative">
                                        <img src={preview} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded-md" />
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
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? "Adding..." : "Add Product"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
