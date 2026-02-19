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
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image as ImageIcon, Search, Package, X, Plus, Minus, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { bulkAddStock } from "../actions";

interface BulkAddStockDialogProps {
    isOpen: boolean;
    onClose: () => void;
    products: Product[];
    onSuccess?: () => void;
}

export function BulkAddStockDialog({ isOpen, onClose, products: allProducts, onSuccess }: BulkAddStockDialogProps) {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProducts, setSelectedProducts] = useState<{ product: Product, quantityToAdd: number | string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const filteredProducts = allProducts.filter(
        (product) => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.sku.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        }
    );

    const handleProductClick = (product: Product) => {
        setSelectedProducts(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.filter(item => item.product.id !== product.id);
            } else {
                return [...prev, { product, quantityToAdd: 1 }];
            }
        });
    };

    const updateQuantity = (productId: string, quantity: number | string) => {
        setSelectedProducts(prev => prev.map(item =>
            item.product.id === productId ? { ...item, quantityToAdd: quantity === "" ? "" : Math.max(0, parseInt(quantity.toString()) || 0) } : item
        ));
    };

    const incrementQuantity = (productId: string) => {
        setSelectedProducts(prev => prev.map(item =>
            item.product.id === productId ? { ...item, quantityToAdd: (typeof item.quantityToAdd === 'string' ? 0 : item.quantityToAdd) + 1 } : item
        ));
    };

    const decrementQuantity = (productId: string) => {
        setSelectedProducts(prev => prev.map(item =>
            item.product.id === productId ? { ...item, quantityToAdd: Math.max(0, (typeof item.quantityToAdd === 'string' ? 0 : item.quantityToAdd) - 1) } : item
        ));
    };

    const removeProduct = (productId: string) => {
        setSelectedProducts(prev => prev.filter(item => item.product.id !== productId));
    };

    const handleApply = async () => {
        if (selectedProducts.length === 0) return;

        const updates = selectedProducts.map(item => ({
            productId: item.product.id,
            quantityToAdd: typeof item.quantityToAdd === 'string' ? (parseInt(item.quantityToAdd) || 0) : item.quantityToAdd
        })).filter(u => u.quantityToAdd > 0);

        if (updates.length === 0) {
            toast({
                variant: "destructive",
                title: "Invalid Quantities",
                description: "Please enter valid quantities for the selected products.",
            });
            return;
        }

        setIsLoading(true);
        try {
            await bulkAddStock(updates);
            toast({
                title: "Stock Added",
                description: `Successfully added stock to ${updates.length} products.`,
            });
            onSuccess?.();
            handleClose();
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

    const clearSelected = () => {
        setSelectedProducts([]);
    };

    const handleClose = () => {
        setSelectedProducts([]);
        setSearchTerm("");
        onClose();
    };

    const totalAddedItems = selectedProducts.reduce((sum, item) => sum + (typeof item.quantityToAdd === 'string' ? 0 : item.quantityToAdd), 0);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 overflow-hidden bg-gradient-to-br from-slate-50 to-purple-50/30">
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-90" />
                    <div className="relative p-6 pb-8">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                <DialogTitle className="text-2xl font-bold text-white">
                                    Bulk Add Stock
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-purple-100 text-base">
                                Select multiple products to add stock quantities in bulk.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pb-6 overflow-hidden min-h-0">
                    <div className="flex flex-col gap-4 h-full min-h-0 bg-white dark:bg-zinc-950 rounded-xl shadow-sm border-2 border-slate-200 dark:border-zinc-800 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 border-b-2 border-purple-200 dark:border-purple-900/50">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search products by name or SKU..."
                                    className="pl-10 h-11 border-2 focus:border-purple-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="mt-3 text-sm text-slate-600 dark:text-zinc-400 font-medium">
                                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                            </div>
                        </div>

                        <ScrollArea className="flex-1 px-4">
                            <div className="grid gap-2 pb-4">
                                {filteredProducts?.map((product) => {
                                    const isSelected = selectedProducts.some(item => item.product.id === product.id);
                                    return (
                                        <div
                                            key={product.id}
                                            className={cn(
                                                "relative flex items-center gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer border-2",
                                                isSelected
                                                    ? "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-300 dark:border-purple-700 shadow-md"
                                                    : "bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-sm"
                                            )}
                                            onClick={() => handleProductClick(product)}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}

                                            <Avatar className="h-16 w-16 rounded-xl border-2 border-white shadow-sm">
                                                <AvatarImage src={product.images?.[0]} alt={product.name} />
                                                <AvatarFallback className="rounded-xl bg-gradient-to-br from-purple-100 to-pink-100">
                                                    <ImageIcon className="h-7 w-7 text-purple-600" />
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-base text-slate-900 dark:text-zinc-100 truncate">{product.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs dark:bg-zinc-800 dark:text-zinc-300">
                                                        SKU: {product.sku}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        Current Stock: {product.totalStock || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="flex flex-col rounded-xl shadow-sm border-2 border-slate-200 dark:border-zinc-800 h-full min-h-0 overflow-hidden bg-white dark:bg-zinc-950">
                        {selectedProducts.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-purple-50/30">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-10" />
                                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                                        <Package className="h-12 w-12 text-purple-600" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No Products Selected</h3>
                                <p className="text-sm text-muted-foreground text-center max-w-xs">
                                    Click on products from the left panel to add them to your bulk list
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full min-h-0">
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 border-b-2 border-purple-200 dark:border-purple-900/50 flex-shrink-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                                                Products to Update
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-zinc-400 mt-0.5">
                                                {selectedProducts.length} {selectedProducts.length === 1 ? 'item' : 'items'} • +{totalAddedItems} total stock
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearSelected}
                                            className="h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-2 border-transparent hover:border-red-200"
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            Clear All
                                        </Button>
                                    </div>
                                </div>

                                <ScrollArea className="flex-1 min-h-0 bg-gradient-to-br from-slate-50/50 to-purple-50/20 dark:from-zinc-900/50 dark:to-purple-900/10">
                                    <div className="p-4 space-y-3">
                                        {selectedProducts.map((item) => (
                                            <div
                                                key={item.product.id}
                                                className="bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <Avatar className="h-16 w-16 rounded-xl border-2 border-purple-100 shadow-sm">
                                                        <AvatarImage src={item.product.images?.[0]} alt={item.product.name} />
                                                        <AvatarFallback className="rounded-xl bg-gradient-to-br from-purple-100 to-pink-100">
                                                            <ImageIcon className="h-7 w-7 text-purple-600" />
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-slate-900 dark:text-zinc-100 truncate mb-1">
                                                            {item.product.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Badge variant="outline" className="text-[10px] py-0 px-2 h-5 dark:bg-zinc-800 dark:text-zinc-300">
                                                                {item.product.sku}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                Current: {item.product.totalStock || 0}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg border-2 border-slate-200 dark:border-zinc-700">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        decrementQuantity(item.product.id);
                                                                    }}
                                                                    className="h-9 w-9 p-0 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-l-md"
                                                                >
                                                                    <Minus className="h-4 w-4" />
                                                                </Button>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    value={item.quantityToAdd}
                                                                    onChange={(e) => updateQuantity(item.product.id, e.target.value)}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="w-16 h-9 border-0 bg-transparent text-center font-semibold focus-visible:ring-0 text-sm"
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        incrementQuantity(item.product.id);
                                                                    }}
                                                                    className="h-9 w-9 p-0 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-r-md"
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                            </div>

                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeProduct(item.product.id);
                                                                }}
                                                                className="h-9 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-2 border-transparent hover:border-red-200"
                                                            >
                                                                <X className="w-3 h-3 mr-1" />
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 pb-6">
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1 h-11 border-2 hover:bg-slate-100"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApply}
                            disabled={selectedProducts.length === 0 || isLoading}
                            className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg font-semibold disabled:opacity-50"
                        >
                            {isLoading ? "Updating..." : `Add Stock to ${selectedProducts.length} Items`}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
