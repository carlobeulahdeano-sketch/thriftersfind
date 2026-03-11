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
import type { Product } from "@/lib/types";
import { updateProduct } from "../actions";

interface AddQuantityDialogProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onSuccess?: () => void;
}

export function AddQuantityDialog({ isOpen, onClose, product, onSuccess }: AddQuantityDialogProps) {
    const { toast } = useToast();
    const [quantityToAdd, setQuantityToAdd] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setQuantityToAdd("");
        }
    }, [isOpen]);

    const handleSave = async () => {
        if (!product) return;

        const qty = parseInt(quantityToAdd);

        if (isNaN(qty) || qty <= 0) {
            toast({
                variant: "destructive",
                title: "Invalid Quantity",
                description: "Please enter a valid positive number.",
            });
            return;
        }

        setIsLoading(true);

        try {
            const newTotalQuantity = (product.quantity || 0) + qty;

            await updateProduct(String(product.id), {
                quantity: newTotalQuantity
            });

            toast({
                title: "Stock Added",
                description: `Successfully added ${qty} to "${product.name}". New total: ${newTotalQuantity}`,
            });

            onClose();
            onSuccess?.();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add stock. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Stock</DialogTitle>
                    <DialogDescription>
                        Add quantity to <strong>{product?.name}</strong>. Current stock: {product?.quantity || 0}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="quantity-to-add">Quantity to Add</Label>
                        <Input
                            id="quantity-to-add"
                            type="number"
                            min="1"
                            value={quantityToAdd}
                            onChange={(e) => setQuantityToAdd(e.target.value)}
                            placeholder="Enter amount to add..."
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSave();
                                }
                            }}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? "Adding..." : "Add Stock"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
