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
import { Search, Check, ImageIcon } from "lucide-react";
import { getProducts } from "../../inventory/actions";
import { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface SelectProductsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (products: Product[]) => void;
}

export function SelectProductsDialog({ isOpen, onClose, onSelect }: SelectProductsDialogProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadProducts();
            setSearchQuery("");
            setSelectedProductIds(new Set());
        }
    }, [isOpen]);

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredProducts(products);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            setFilteredProducts(products.filter(p =>
                p.name.toLowerCase().includes(lowerQuery) ||
                p.sku.toLowerCase().includes(lowerQuery)
            ));
        }
    }, [searchQuery, products]);

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const data = await getProducts();
            setProducts(data);
            setFilteredProducts(data);
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelection = (productId: string) => {
        const newSet = new Set(selectedProductIds);
        if (newSet.has(productId)) {
            newSet.delete(productId);
        } else {
            newSet.add(productId);
        }
        setSelectedProductIds(newSet);
    };

    const handleConfirm = () => {
        const selected = products.filter(p => selectedProductIds.has(p.id));
        onSelect(selected);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Select Products</DialogTitle>
                    <DialogDescription>
                        Choose products from the inventory to add to your order.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-4 border-b bg-muted/20">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 bg-background"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {filteredProducts.map((product) => {
                                const isSelected = selectedProductIds.has(product.id);
                                return (
                                    <div
                                        key={product.id}
                                        className={cn(
                                            "group relative border rounded-lg cursor-pointer overflow-hidden transition-all hover:shadow-md",
                                            isSelected ? "ring-2 ring-primary border-primary bg-primary/5" : "bg-card hover:border-primary/50"
                                        )}
                                        onClick={() => toggleSelection(product.id)}
                                    >
                                        <div className="aspect-square bg-muted relative">
                                            {product.images && product.images.length > 0 ? (
                                                <img
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                    <ImageIcon className="h-10 w-10 opacity-20" />
                                                </div>
                                            )}
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                                                        <Check className="h-6 w-6" />
                                                    </div>
                                                </div>
                                            )}
                                            {product.totalStock <= 0 && (
                                                <div className="absolute top-2 right-2">
                                                    <Badge variant="destructive" className="text-[10px] px-1.5 h-5">Out of Stock</Badge>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <h4 className="font-semibold text-sm truncate" title={product.name}>
                                                {product.name}
                                            </h4>
                                            <div className="mt-1"></div>
                                        </div>
                                    </div>
                                );
                            })}

                            {!isLoading && filteredProducts.length === 0 && (
                                <div className="col-span-full text-center py-12 text-muted-foreground">
                                    No products found matching "{searchQuery}"
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter className="p-4 border-t bg-muted/20 flex justify-between items-center w-full sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                        {selectedProductIds.size} products selected
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleConfirm} disabled={selectedProductIds.size === 0}>
                            Add Selected Items
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
