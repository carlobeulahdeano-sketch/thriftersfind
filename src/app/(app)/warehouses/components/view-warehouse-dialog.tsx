"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Package, PhilippinePeso } from "lucide-react";
import type { WarehouseProduct } from "@/lib/types";

interface ViewWarehouseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    product: WarehouseProduct | null;
}

export function ViewWarehouseDialog({ isOpen, onClose, product }: ViewWarehouseDialogProps) {
    if (!product) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Product Details</DialogTitle>
                    <DialogDescription>
                        View detailed information about the warehouse product.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Image Display */}
                    <div className="flex justify-center mb-4">
                        <div className="h-40 w-40 overflow-hidden rounded-xl border-2 border-white/10 bg-muted/50 shadow-inner group">
                            {product.image ? (
                                <img
                                    src={product.image}
                                    alt={product.productName}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <Package className="h-16 w-16 text-muted-foreground/30" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-muted-foreground">Product Name</Label>
                            <p className="font-medium">{product.productName}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">SKU</Label>
                            <p className="font-medium">{product.sku}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-muted-foreground">Manufacture Date</Label>
                            <p className="font-medium">
                                {product.manufacture_date ? new Date(product.manufacture_date).toLocaleDateString() : "—"}
                            </p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Location</Label>
                            <p className="font-medium">{product.location || "—"}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-muted-foreground">Quantity</Label>
                            <p className="font-medium">{product.quantity}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Cost</Label>
                            <p className="font-medium">₱{product.cost.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-muted-foreground">Retail Price</Label>
                            <p className="font-medium">
                                {product.retailPrice ? `₱${product.retailPrice.toFixed(2)}` : "—"}
                            </p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Created At</Label>
                            <p className="font-medium">
                                {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "—"}
                            </p>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
