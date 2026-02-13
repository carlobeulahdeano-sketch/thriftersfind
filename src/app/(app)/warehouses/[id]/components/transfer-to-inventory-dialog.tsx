
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { transferToInventory } from "../actions";
import { WarehouseProduct } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface TransferToInventoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    product: WarehouseProduct | null;
    onSuccess: () => void;
}

export function TransferToInventoryDialog({ isOpen, onClose, product, onSuccess }: TransferToInventoryDialogProps) {
    const { toast } = useToast();

    const [destination, setDestination] = useState<"quantity" | "warehouse">("quantity");
    const [quantity, setQuantity] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTransfer = async () => {
        if (!product) return;

        const transferQty = parseInt(quantity);
        if (!quantity || transferQty <= 0 || transferQty > product.quantity) {
            toast({
                variant: "destructive",
                title: "Invalid Quantity",
                description: `Please enter a valid quantity between 1 and ${product.quantity}.`,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await transferToInventory(product.id, destination, transferQty);

            if (result.success) {
                toast({
                    title: "Transfer Successful",
                    description: `${transferQty} units of "${product.productName}" transferred to ${destination === "quantity" ? "Main Inventory" : "Warehouse"}.`,
                });
                setQuantity("");
                onClose();
                onSuccess();
            } else {
                toast({
                    variant: "destructive",
                    title: "Transfer Failed",
                    description: result.error || "Failed to transfer product.",
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

    if (!product) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Transfer to Inventory</DialogTitle>
                    <DialogDescription>
                        Transfer product from warehouse to inventory.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <div className="text-sm font-medium text-muted-foreground">Product</div>
                        <div className="text-base font-semibold">{product.productName}</div>
                        <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                    </div>

                    <div className="grid gap-2">
                        <div className="text-sm font-medium text-muted-foreground">Available Quantity</div>
                        <Badge variant="secondary" className="w-fit">
                            {product.quantity} units
                        </Badge>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="destination">
                            Destination <span className="text-red-500">*</span>
                        </Label>
                        <Select value={destination} onValueChange={(value: any) => setDestination(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select destination" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="quantity">Main Inventory</SelectItem>
                                <SelectItem value="warehouse">Warehouse Inventory</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Select where to transfer the product in your inventory system.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="quantity">
                            Quantity to Transfer <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            max={product.quantity}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder={`Max: ${product.quantity}`}
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter the number of units to transfer (1-{product.quantity}).
                        </p>
                    </div>

                    {product.location && (
                        <div className="grid gap-2">
                            <div className="text-sm font-medium text-muted-foreground">Current Location</div>
                            <div className="text-sm">{product.location}</div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleTransfer} disabled={isSubmitting}>
                        {isSubmitting ? "Transferring..." : "Transfer to Inventory"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
