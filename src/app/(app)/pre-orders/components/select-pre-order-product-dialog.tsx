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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image as ImageIcon, Search, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PreOrderProduct } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SelectPreOrderProductDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onProductSelect: (selectedItems: { product: PreOrderProduct, quantity: number | string }[]) => void;
    products: PreOrderProduct[];
}

export function SelectPreOrderProductDialog({ isOpen, onClose, onProductSelect, products: allProducts }: SelectPreOrderProductDialogProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProducts, setSelectedProducts] = useState<{ product: PreOrderProduct, quantity: number | string }[]>([]);

    const filteredProducts = allProducts.filter(
        (product) =>
        (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleProductClick = (product: PreOrderProduct) => {
        setSelectedProducts(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.filter(item => item.product.id !== product.id);
            } else {
                return [...prev, { product, quantity: 1 }];
            }
        });
    };

    const updateQuantity = (productId: string | number, quantity: number | string) => {
        setSelectedProducts(prev => prev.map(item =>
            item.product.id === productId ? { ...item, quantity: quantity === "" ? "" : Math.max(0, parseInt(quantity.toString()) || 0) } : item
        ));
    };

    const removeProduct = (productId: string | number) => {
        setSelectedProducts(prev => prev.filter(item => item.product.id !== productId));
    };

    const handleAddToOrder = () => {
        if (selectedProducts.length > 0) {
            onProductSelect(selectedProducts);
            handleClose();
        }
    };

    const handleClose = () => {
        setSelectedProducts([]);
        setSearchTerm("");
        onClose();
    };

    // Helper to handle images safely since PreOrderProduct might have different structure or JSON type
    const getProductImage = (product: PreOrderProduct) => {
        if (Array.isArray(product.images) && product.images.length > 0) {
            return product.images[0];
        }
        return undefined;
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select Pre-Order Product</DialogTitle>
                    <DialogDescription>
                        Choose a product from the pre-order inventory.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                    {/* Left Panel: Product List */}
                    <div className="flex flex-col gap-4 h-full">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search products by name or SKU..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="flex-1 border rounded-md">
                            <div className="grid gap-2 p-2">
                                {filteredProducts.length === 0 && <p className="text-center text-muted-foreground p-4">No products found.</p>}
                                {filteredProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className={cn(
                                            "flex items-center gap-4 p-2 rounded-md hover:bg-accent cursor-pointer",
                                            selectedProducts.some(item => item.product.id === product.id) && "bg-accent"
                                        )}
                                        onClick={() => handleProductClick(product)}
                                    >
                                        <Avatar className="h-12 w-12 rounded-md">
                                            <AvatarImage src={getProductImage(product)} alt={product.name} />
                                            <AvatarFallback className="rounded-md bg-muted">
                                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 grid gap-1">
                                            <p className="font-medium">{product.name}</p>
                                            <span className="text-sm text-muted-foreground">
                                                SKU: <Badge variant="outline">{product.sku}</Badge>
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">₱{product.retailPrice ? product.retailPrice.toFixed(2) : "0.00"}</p>
                                            <p className="text-sm text-muted-foreground">Qty: {product.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Right Panel: Selected Products */}
                    <div className="flex flex-col border rounded-md h-full">
                        {selectedProducts.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                                <ShoppingCart className="h-16 w-16 mb-4" />
                                <h3 className="text-lg font-medium">No Products Selected</h3>
                                <p className="text-sm">Select products from the left to add to order.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <ScrollArea className="flex-1">
                                    <div className="p-6">
                                        <h3 className="text-lg font-medium mb-4">Selected Products ({selectedProducts.length})</h3>
                                        <div className="space-y-2">
                                            {selectedProducts.map((item) => (
                                                <div key={item.product.id} className="flex items-center gap-3 p-2 border rounded-lg">
                                                    <Avatar className="h-12 w-12 rounded-md">
                                                        <AvatarImage src={getProductImage(item.product)} alt={item.product.name} />
                                                        <AvatarFallback className="rounded-md bg-muted">
                                                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 max-w-48">
                                                        <p className="font-medium truncate">{item.product.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">SKU: {item.product.sku}</p>
                                                        <p className="text-xs font-medium">₱{item.product.retailPrice ? item.product.retailPrice.toFixed(2) : "0.00"}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={item.quantity}
                                                            onChange={(e) => updateQuantity(item.product.id, e.target.value)}
                                                            onFocus={(e) => e.target.select()}
                                                            className="w-16"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => removeProduct(item.product.id)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </ScrollArea>
                                <div className="p-6 border-t mt-auto">
                                    <Button className="w-full" onClick={handleAddToOrder}>
                                        Add to Order ({selectedProducts.length} products)
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleAddToOrder} disabled={selectedProducts.length === 0}>
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
