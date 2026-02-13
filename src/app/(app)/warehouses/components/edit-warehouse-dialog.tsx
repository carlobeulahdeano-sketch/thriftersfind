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
import { useToast } from "@/hooks/use-toast";
import { updateWarehouseProduct } from "../actions";
import { Package, MapPin, Calendar, Image as ImageIcon, PhilippinePeso, Hash, X, RefreshCw } from "lucide-react";
import type { WarehouseProduct } from "@/lib/types";

interface EditWarehouseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product: WarehouseProduct;
}

export function EditWarehouseDialog({ isOpen, onClose, onSuccess, product }: EditWarehouseDialogProps) {
    const { toast } = useToast();

    const [productName, setProductName] = useState(product.productName);
    const [sku, setSku] = useState(product.sku);
    const [manufacture_date, setManufactureDate] = useState(
        product.manufacture_date ? new Date(product.manufacture_date).toISOString().split('T')[0] : ""
    );
    const [imagePreview, setImagePreview] = useState<string | null>(product.image || null);
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [location, setLocation] = useState(product.location || "");
    const [quantity, setQuantity] = useState(product.quantity.toString());
    const [cost, setCost] = useState(product.cost.toString());

    const [retailPrice, setRetailPrice] = useState(product.retailPrice?.toString() || "");
    const [alertStock, setAlertStock] = useState(product.alertStock?.toString() || "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (product) {
            setProductName(product.productName);
            setSku(product.sku);
            setManufactureDate(product.manufacture_date ? new Date(product.manufacture_date).toISOString().split('T')[0] : "");
            setImagePreview(product.image || null);
            setLocation(product.location || "");
            setQuantity(product.quantity.toString());
            setCost(product.cost.toString());

            setRetailPrice(product.retailPrice?.toString() || "");
            setAlertStock(product.alertStock?.toString() || "");
        }
    }, [product]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setNewImageFile(null);
        setImagePreview(null);
    };

    const handleSave = async () => {
        if (!productName || !sku) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Product Name and SKU are required.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            let imageDataUrl = product.image;

            if (newImageFile) {
                imageDataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(newImageFile);
                });
            } else if (imagePreview === null) {
                imageDataUrl = null;
            }

            const result = await updateWarehouseProduct(product.id, {
                productName,
                sku,
                manufacture_date: manufacture_date || null,
                image: imageDataUrl,
                location: location || null,
                quantity: quantity ? parseInt(quantity) : 0,
                cost: cost ? parseFloat(cost) : 0,

                retailPrice: retailPrice ? parseFloat(retailPrice) : null,
                alertStock: alertStock ? parseInt(alertStock) : 0,
            });

            if (result.success) {
                toast({
                    title: "Product Updated",
                    description: `Product "${productName}" has been updated successfully.`,
                });
                onClose();
                onSuccess();
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to update product.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">Edit Warehouse Product</DialogTitle>
                    <DialogDescription>
                        Update the details for this warehouse product.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Basic Information Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Basic Information
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-productName" className="flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Product Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="edit-productName"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    placeholder="e.g. Vintage Shirt"
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-sku" className="flex items-center gap-2">
                                    <Hash className="w-4 h-4" />
                                    SKU <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="edit-sku"
                                    value={sku}
                                    onChange={(e) => setSku(e.target.value)}
                                    placeholder="SKU"
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-image" className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Product Image
                            </Label>

                            {!imagePreview ? (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors text-center cursor-pointer relative group">
                                    <Input
                                        id="edit-image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-3 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
                                            <ImageIcon className="w-6 h-6 text-gray-500" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-600">
                                            Click to upload image
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            PNG, JPG up to 10MB
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                    />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={handleRemoveImage}
                                        className="absolute top-2 right-2 h-8 w-8 shadow-sm"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                    <div className="absolute bottom-2 right-2 flex gap-2">
                                        <label htmlFor="edit-change-image" className="cursor-pointer">
                                            <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 py-1">
                                                Change
                                            </div>
                                            <Input
                                                id="edit-change-image"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Inventory Details Section */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Inventory Details
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-manufacture_date" className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Manufacture Date
                                </Label>
                                <Input
                                    id="edit-manufacture_date"
                                    type="date"
                                    value={manufacture_date}
                                    onChange={(e) => setManufactureDate(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-location" className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Location
                                </Label>
                                <Input
                                    id="edit-location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. Aisle 1, Shelf B"
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-quantity" className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Quantity
                            </Label>

                            <Input
                                id="edit-quantity"
                                type="number"
                                min="0"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="0"
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-alertStock" className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Stock Alert
                            </Label>
                            <Input
                                id="edit-alertStock"
                                type="number"
                                min="0"
                                value={alertStock}
                                onChange={(e) => setAlertStock(e.target.value)}
                                placeholder="0"
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Pricing Section */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Pricing
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-cost" className="flex items-center gap-2">
                                    <PhilippinePeso className="w-4 h-4" />
                                    Cost
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        ₱
                                    </span>
                                    <Input
                                        id="edit-cost"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={cost}
                                        onChange={(e) => setCost(e.target.value)}
                                        placeholder="0.00"
                                        className="pl-7"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-retailPrice" className="flex items-center gap-2">
                                    <PhilippinePeso className="w-4 h-4" />
                                    Retail Price
                                    <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        ₱
                                    </span>
                                    <Input
                                        id="edit-retailPrice"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={retailPrice}
                                        onChange={(e) => setRetailPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="pl-7"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? "Updating..." : "Update Product"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default EditWarehouseDialog;
