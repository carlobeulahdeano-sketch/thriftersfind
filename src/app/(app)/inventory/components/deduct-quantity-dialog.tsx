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

interface DeductQuantityDialogProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    onSuccess?: () => void;
}

export function DeductQuantityDialog({ isOpen, onClose, product, onSuccess }: DeductQuantityDialogProps) {
    const { toast } = useToast();
    const [quantityToDeduct, setQuantityToDeduct] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setQuantityToDeduct("");
        }
    }, [isOpen]);

    const handleSave = async () => {
        if (!product) return;

        const qty = parseInt(quantityToDeduct);

        if (isNaN(qty) || qty <= 0) {
            toast({
                variant: "destructive",
                title: "Invalid Quantity",
                description: "Please enter a valid positive number.",
            });
            return;
        }

        if (qty > (product.quantity || 0)) {
            toast({
                variant: "destructive",
                title: "Insufficient Stock",
                description: `Cannot deduct ${qty} from ${product.quantity || 0} units.`,
            });
            return;
        }

        setIsLoading(true);

        try {
            const newTotalQuantity = (product.quantity || 0) - qty;

            await updateProduct(product.id, {
                quantity: newTotalQuantity
            });

            toast({
                title: "Stock Deducted",
                description: `Successfully deducted ${qty} from "${product.name}". New total: ${newTotalQuantity}`,
            });

            onClose();
            onSuccess?.();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to deduct stock. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Deduct Stock</DialogTitle>
                    <DialogDescription>
                        Deduct quantity from <strong>{product?.name}</strong>. Current stock: {product?.quantity || 0}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="quantity-to-deduct">Quantity to Deduct</Label>
                        <Input
                            id="quantity-to-deduct"
                            type="number"
                            min="1"
                            max={product?.quantity || 0}
                            value={quantityToDeduct}
                            onChange={(e) => setQuantityToDeduct(e.target.value)}
                            placeholder="Enter amount to deduct..."
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
                    <Button variant="destructive" onClick={handleSave} disabled={isLoading}>
                        {isLoading ? "Deducting..." : "Deduct Stock"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
