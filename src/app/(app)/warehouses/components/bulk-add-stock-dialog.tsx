"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { bulkAddWarehouseStock } from "../actions";
import { WarehouseProduct } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Check, Trash2, Loader2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface BulkAddStockDialogProps {
    isOpen: boolean;
    onClose: () => void;
    products: WarehouseProduct[];
    onSuccess: () => void;
}

export function BulkAddStockDialog({
    isOpen,
    onClose,
    products: availableProducts,
    onSuccess,
}: BulkAddStockDialogProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [quantities, setQuantities] = React.useState<Record<string, number>>({});

    // Internal selection state
    const [selectedProducts, setSelectedProducts] = React.useState<WarehouseProduct[]>([]);
    const [searchQuery, setSearchQuery] = React.useState("");

    // Reset state when dialog opens
    React.useEffect(() => {
        if (isOpen) {
            setSelectedProducts([]);
            setQuantities({});
            setSearchQuery("");
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleQuantityChange = (id: string, value: string) => {
        const parsed = parseInt(value, 10);
        setQuantities((prev) => ({
            ...prev,
            [id]: isNaN(parsed) ? 0 : parsed,
        }));
    };

    const toggleProductSelection = (product: WarehouseProduct) => {
        const isSelected = selectedProducts.some((p) => p.id === product.id);

        if (isSelected) {
            setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id));
            setQuantities((prev) => {
                const newQuantities = { ...prev };
                delete newQuantities[product.id];
                return newQuantities;
            });
        } else {
            setSelectedProducts((prev) => [...prev, product]);
            setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
        }
    };

    const removeProduct = (id: string | number) => {
        setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
        setQuantities((prev) => {
            const newQuantities = { ...prev };
            delete newQuantities[id];
            return newQuantities;
        });
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);

            // Filter out items with 0 or negative quantities
            const itemsToUpdate = selectedProducts
                .map((p) => ({
                    id: p.id,
                    quantityToAdd: quantities[p.id] || 0,
                }))
                .filter((item) => item.quantityToAdd > 0);

            if (itemsToUpdate.length === 0) {
                toast({
                    variant: "destructive",
                    title: "No valid quantities",
                    description: "Please enter a quantity greater than 0 for at least one product.",
                });
                setIsLoading(false);
                return;
            }

            const result = await bulkAddWarehouseStock(itemsToUpdate.map(i => ({...i, id: String(i.id)})));

            if (!result.success) {
                throw new Error(result.error || "Failed to add stock");
            }

            toast({
                title: "Stock Added",
                description: `Successfully added stock to ${itemsToUpdate.length} product(s).`,
            });

            onSuccess();
            onClose();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to update stock. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden border-border/50 bg-background text-foreground">
                {/* Full-bleed Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white flex items-start gap-4 flex-col justify-center relative">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-md backdrop-blur-sm">
                            <Package className="h-6 w-6 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-bold tracking-tight text-white">Bulk Add Stock</DialogTitle>
                    </div>
                    <DialogDescription className="text-white/90 text-sm">
                        Select multiple products to add stock quantities in bulk.
                    </DialogDescription>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 h-[600px] max-h-[70vh]">
                    {/* LEFT COLUMN: Search & Select */}
                    <div className="flex flex-col bg-background border-r border-border/50">
                        <div className="p-4 flex-1 overflow-hidden flex flex-col">
                            <Command shouldFilter={false} className="bg-transparent h-full flex flex-col overflow-hidden">
                                <div className="border border-border/50 rounded-lg bg-card focus-within:ring-1 focus-within:ring-purple-500/50 focus-within:border-purple-500/50 transition-all flex items-center px-3 mb-4">
                                    <CommandInput
                                        placeholder="Search products by name or SKU..."
                                        value={searchQuery}
                                        onValueChange={setSearchQuery}
                                        className="border-0 focus:ring-0 shadow-none bg-transparent flex-1 h-12 outline-none w-full"
                                    />
                                </div>
                                <div className="text-xs text-muted-foreground mb-2 px-1">
                                    {availableProducts.filter(p => !searchQuery || p.productName.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())).length} products found
                                </div>
                                <CommandList className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                                        No products available.
                                    </CommandEmpty>
                                    <CommandGroup>
                                        {availableProducts
                                            .filter(p => {
                                                if (!searchQuery) return true;
                                                const q = searchQuery.toLowerCase();
                                                return p.productName.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
                                            })
                                            .slice(0, 50)
                                            .map((product) => {
                                                const isSelected = selectedProducts.some((p) => p.id === product.id);
                                                return (
                                                    <CommandItem
                                                        key={product.id}
                                                        onSelect={() => toggleProductSelection(product)}
                                                        className={cn(
                                                            "flex items-center gap-4 p-3 mb-2 rounded-xl border cursor-pointer border-border/40 transition-all",
                                                            isSelected ? "bg-purple-500/10 border-purple-500/30" : "bg-card hover:bg-muted/50"
                                                        )}
                                                    >
                                                        <div className="h-12 w-12 rounded-lg bg-muted/80 flex items-center justify-center overflow-hidden shrink-0 border border-white/5">
                                                            {product.image ? (
                                                                <img src={product.image} alt={product.productName} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <Package className="h-6 w-6 text-muted-foreground/50" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col flex-1 overflow-hidden">
                                                            <span className="font-semibold truncate text-foreground">{product.productName}</span>
                                                            <div className="flex gap-3 text-xs text-muted-foreground mt-1 items-center">
                                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-sm font-normal bg-foreground/5">SKU: {product.sku}</Badge>
                                                                <span>Current Stock: {product.quantity}</span>
                                                            </div>
                                                        </div>
                                                        <div className="shrink-0">
                                                            <div className={cn(
                                                                "h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                                                                isSelected ? "bg-purple-500 border-purple-500 text-white" : "border-muted-foreground/30 text-transparent"
                                                            )}>
                                                                <Check className="h-3 w-3" />
                                                            </div>
                                                        </div>
                                                    </CommandItem>
                                                );
                                            })
                                        }
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </div>
                        {/* Left Column Footer */}
                        <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-sm">
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                disabled={isLoading}
                                className="w-full bg-card hover:bg-muted font-semibold h-12 rounded-xl"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Selected Products & Quantities */}
                    <div className="flex flex-col bg-muted/20 relative">
                        {selectedProducts.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-background via-muted/30 to-muted/50 rounded-br-lg">
                                <div className="h-24 w-24 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center mb-6 shadow-sm border border-purple-200 dark:border-purple-500/30">
                                    <Package className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">No Products Selected</h3>
                                <p className="text-sm text-muted-foreground max-w-[250px]">
                                    Click on products from the left panel to add them to your bulk list.
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-hidden flex flex-col p-4 bg-background/30">
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/50">
                                    <Label className="text-base font-semibold">Ready to Restock</Label>
                                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20">{selectedProducts.length} Selected</Badge>
                                </div>
                                <ScrollArea className="flex-1 pr-4 -mr-4">
                                    <div className="space-y-3 pb-4">
                                        {selectedProducts.map((product) => (
                                            <div key={product.id} className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border/50 shadow-sm transition-all hover:border-purple-500/30 relative group">
                                                <div className="h-10 w-10 rounded-md bg-muted/80 flex items-center justify-center overflow-hidden shrink-0">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.productName} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Package className="h-5 w-5 text-muted-foreground/50" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col flex-1 overflow-hidden">
                                                    <span className="font-semibold text-sm truncate" title={product.productName}>
                                                        {product.productName}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground mt-0.5">
                                                        Cur: {product.quantity}
                                                    </span>
                                                </div>
                                                <div className="w-24 shrink-0 flex items-center gap-2">
                                                    <span className="text-xs font-medium text-muted-foreground">+</span>
                                                    <Input
                                                        id={`quantity-${product.id}`}
                                                        type="number"
                                                        min="0"
                                                        value={quantities[product.id] === 0 ? "" : quantities[product.id] || ""}
                                                        onChange={(e) => handleQuantityChange(String(product.id), e.target.value)}
                                                        disabled={isLoading}
                                                        placeholder="Qty"
                                                        className="text-center h-9 font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/5 focus-visible:ring-purple-500"
                                                    />
                                                </div>
                                                <button
                                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-destructive shadow-sm"
                                                    onClick={() => removeProduct(product.id)}
                                                    disabled={isLoading}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                        {/* Right Column Footer */}
                        <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-sm z-10">
                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading || selectedProducts.length === 0}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold h-12 rounded-xl shadow-md border-0 transition-all focus:ring-2 focus:ring-purple-500/50"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Stock to {selectedProducts.length} Item{selectedProducts.length !== 1 ? 's' : ''}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
