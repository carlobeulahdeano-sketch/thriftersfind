
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
import { useToast } from "@/hooks/use-toast";
import { createWarehouseProduct } from "../actions";
import { PhilippinePeso } from "lucide-react";

interface AddWarehouseProductDialogProps {
    warehouseId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddWarehouseProductDialog({ warehouseId, isOpen, onClose, onSuccess }: AddWarehouseProductDialogProps) {
    const { toast } = useToast();

    const [productName, setProductName] = useState("");
    const [sku, setSku] = useState("");
    const [quantity, setQuantity] = useState("");
    const [manufacturer, setManufacturer] = useState("");
    const [location, setLocation] = useState("");
    const [cost, setCost] = useState("");
    const [retailPrice, setRetailPrice] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setProductName("");
        setSku("");
        setQuantity("");
        setManufacturer("");
        setLocation("");
        setCost("");
        setRetailPrice("");
    };

    const handleSave = async () => {
        if (!productName || !sku || !quantity || !cost) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please fill out all required fields.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createWarehouseProduct({
                warehouseId,
                productName,
                sku,
                quantity: parseInt(quantity),
                manufacturer: manufacturer || null,
                location: location || null,
                cost: parseFloat(cost),
                retailPrice: retailPrice ? parseFloat(retailPrice) : null,
            });

            if (result.success) {
                toast({
                    title: "Product Added",
                    description: `Product "${productName}" has been added to warehouse.`,
                });
                resetForm();
                onClose();
                onSuccess();
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to add product.",
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Product to Warehouse</DialogTitle>
                    <DialogDescription>
                        Add a new product to warehouse storage.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid gap-2">
                        <Label htmlFor="productName">
                            Product Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="productName"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="e.g. Nike Air Max"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="sku">
                            SKU <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="sku"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            placeholder="e.g. NAM-001"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="quantity">
                            Quantity <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="0"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="e.g. 100"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="manufacturer">Manufacturer</Label>
                        <Input
                            id="manufacturer"
                            value={manufacturer}
                            onChange={(e) => setManufacturer(e.target.value)}
                            placeholder="e.g. Nike Inc."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="location">Location in Warehouse</Label>
                        <Input
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Aisle 3, Shelf B"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cost" className="flex items-center gap-2">
                            <PhilippinePeso className="w-4 h-4" />
                            Cost <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                ₱
                            </span>
                            <Input
                                id="cost"
                                type="number"
                                step="0.01"
                                min="0"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                placeholder="0.00"
                                className="pl-7"
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="retailPrice" className="flex items-center gap-2">
                            <PhilippinePeso className="w-4 h-4" />
                            Retail Price
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                ₱
                            </span>
                            <Input
                                id="retailPrice"
                                type="number"
                                step="0.01"
                                min="0"
                                value={retailPrice}
                                onChange={(e) => setRetailPrice(e.target.value)}
                                placeholder="0.00"
                                className="pl-7"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? "Adding..." : "Add Product"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
