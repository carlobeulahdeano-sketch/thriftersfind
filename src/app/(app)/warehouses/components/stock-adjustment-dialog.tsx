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
import { adjustWarehouseStock } from "@/app/(app)/warehouses/actions";
import { WarehouseProduct } from "@/lib/types";

interface StockAdjustmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    product: WarehouseProduct;
    mode: "add" | "deduct";
    onSuccess: () => void;
}

export function StockAdjustmentDialog({
    isOpen,
    onClose,
    product,
    mode,
    onSuccess,
}: StockAdjustmentDialogProps) {
    const { toast } = useToast();
    const [quantity, setQuantity] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async () => {
        if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
            toast({
                variant: "destructive",
                title: "Invalid Quantity",
                description: "Please enter a valid positive quantity.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const qty = parseInt(quantity);
            const adjustment = qty * (mode === "add" ? 1 : -1);

            // Check for negative stock if deducting
            if (mode === "deduct" && product.quantity < qty) {
                toast({
                    variant: "destructive",
                    title: "Insufficient Stock",
                    description: `Cannot deduct ${qty}. Current stock is ${product.quantity}.`,
                });
                setIsSubmitting(false);
                return;
            }

            const result = await adjustWarehouseStock(product.id, adjustment);

            if (result.success) {
                toast({
                    title: `Stock ${mode === "add" ? "Added" : "Deducted"}`,
                    description: `Successfully ${mode === "add" ? "added" : "deducted"} ${quantity} units ${mode === "add" ? "to" : "from"} ${product.productName}.`,
                });
                setQuantity("");
                onClose();
                onSuccess();
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to adjust stock.",
                });
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{mode === "add" ? "Add Stock" : "Deduct Stock"}</DialogTitle>
                    <DialogDescription>
                        {mode === "add"
                            ? `Add units to ${product.productName}. Current stock: ${product.quantity}`
                            : `Deduct units from ${product.productName}. Current stock: ${product.quantity}`
                        }
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">
                            Quantity
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="quantity"
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="Enter quantity"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSave();
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting} variant={mode === 'deduct' ? "destructive" : "default"}>
                        {isSubmitting ? "Saving..." : mode === "add" ? "Add Stock" : "Deduct Stock"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
