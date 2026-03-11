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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getBatches } from "../../batches/actions";
import { getCategories } from "../../inventory/category-actions";
import { useEffect } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image as ImageIcon, Search, ShoppingCart, Package, X, Plus, Minus, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SelectProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProductSelect: (selectedItems: { product: Product, quantity: number }[], selectedBatchId?: string | null) => void;
  products: Product[];
}

export function SelectProductDialog({ isOpen, onClose, onProductSelect, products: allProducts }: SelectProductDialogProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<{ product: Product, quantity: number | string }[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [batchData, categoryData] = await Promise.all([
          getBatches(),
          getCategories()
        ]);

        if (batchData && Array.isArray(batchData.batches)) {
          setBatches(batchData.batches);
        } else {
          setBatches([]);
        }

        if (categoryData && Array.isArray(categoryData)) {
          setCategories(categoryData);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    }
    loadData();
  }, []);

  const isLoading = false;

  const filteredProducts = allProducts.filter(
    (product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    }
  );

  const getTotalQuantity = (product: Product) => {
    return product.quantity || 0;
  }

  const handleProductClick = (product: Product) => {
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

  const incrementQuantity = (productId: string | number) => {
    setSelectedProducts(prev => prev.map(item =>
      item.product.id === productId ? { ...item, quantity: (typeof item.quantity === 'string' ? 0 : item.quantity) + 1 } : item
    ));
  };

  const decrementQuantity = (productId: string | number) => {
    setSelectedProducts(prev => prev.map(item =>
      item.product.id === productId ? { ...item, quantity: Math.max(0, (typeof item.quantity === 'string' ? 0 : item.quantity) - 1) } : item
    ));
  };

  const removeProduct = (productId: string | number) => {
    setSelectedProducts(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleAddToOrder = () => {
    if (selectedProducts.length > 0) {
      const sanitizedProducts = selectedProducts.map(item => ({
        product: item.product,
        quantity: typeof item.quantity === 'string' ? (parseInt(item.quantity) || 0) : item.quantity
      }));
      onProductSelect(sanitizedProducts, selectedBatch !== "all" ? selectedBatch : null);
      handleClose();
    }
  };

  const clearSelected = () => {
    setSelectedProducts([]);
  };

  const handleClose = () => {
    setSelectedProducts([]);
    setSearchTerm("");
    setSelectedBatch("all");
    setSelectedCategory("all");
    onClose();
  };

  const totalItems = selectedProducts.reduce((sum, item) => sum + (typeof item.quantity === 'string' ? 0 : item.quantity), 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 overflow-hidden bg-gradient-to-br from-slate-50 to-purple-50/30 dark:from-slate-950 dark:to-purple-950/20">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-90" />
          <div className="relative p-6 pb-8">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <DialogTitle className="text-2xl font-bold text-white">
                  Select Products
                </DialogTitle>
              </div>
              <DialogDescription className="text-purple-100 text-base">
                Browse and add products to your order with quantities.
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pb-6 overflow-hidden min-h-0">
          {/* Left Panel: Product List */}
          <div className="flex flex-col gap-4 h-full min-h-0 bg-white dark:bg-slate-900 rounded-xl shadow-sm border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Search and Filter Bar */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 p-4 border-b-2 border-purple-200 dark:border-purple-900/30">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search products by name or SKU..."
                    className="pl-10 h-11 border-2 dark:border-slate-700 bg-white dark:bg-slate-950 focus:border-purple-400 dark:focus:border-purple-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[150px] h-11 border-2">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedBatch} onValueChange={(v: string) => {
                  if (v === "all") {
                    setSelectedBatch(v);
                    return;
                  }

                  const batch = batches.find(b => b.id === v);
                  const status = batch?.status?.trim().toLowerCase();

                  if (batch && status !== 'open') {
                    toast({
                      variant: "destructive",
                      title: `Batch is ${batch.status}`,
                      description: "This batch is closed and cannot be selected.",
                    });
                    return;
                  }
                  setSelectedBatch(v);
                }}>
                  <SelectTrigger className="w-full sm:w-[200px] h-11 border-2">
                    <SelectValue placeholder="Apply to Batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">None / Normal</SelectItem>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.batchName} ({batch.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Results Count */}
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
                </span>
                {selectedBatch !== "all" && (
                  <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                    Batch: {batches.find(b => b.id === selectedBatch)?.batchName}
                  </Badge>
                )}
              </div>
            </div>

            {/* Product List */}
            <ScrollArea className="flex-1 px-4">
              <div className="grid gap-2 pb-4">
                {isLoading && (
                  <div className="flex items-center justify-center p-12">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3 animate-pulse">
                        <Package className="w-6 h-6 text-purple-600" />
                      </div>
                      <p className="text-sm text-muted-foreground">Loading products...</p>
                    </div>
                  </div>
                )}

                {!isLoading && filteredProducts?.length === 0 && (
                  <div className="flex items-center justify-center p-12">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-base font-medium text-slate-700 dark:text-slate-300 mb-1">No products found</p>
                      <p className="text-sm text-muted-foreground dark:text-slate-400">Try adjusting your search terms</p>
                    </div>
                  </div>
                )}

                {filteredProducts?.map((product) => {
                  const isSelected = selectedProducts.some(item => item.product.id === product.id);
                  return (
                    <div
                      key={product.id}
                      className={cn(
                        "relative flex items-center gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer border-2 dark:shadow-none",
                        isSelected
                          ? "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-300 dark:border-purple-700 shadow-md"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-sm"
                      )}
                      onClick={() => handleProductClick(product)}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}

                      <Avatar className="h-16 w-16 rounded-xl border-2 border-white dark:border-slate-800 shadow-sm">
                        <AvatarImage src={product.images?.[0]} alt={product.name} />
                        <AvatarFallback className="rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50">
                          <ImageIcon className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-slate-900 dark:text-slate-100 truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs bg-white dark:bg-slate-800 dark:text-slate-300">
                            SKU: {product.sku}
                          </Badge>
                          <span className="text-xs text-muted-foreground dark:text-slate-400">
                            Stock: {getTotalQuantity(product)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-lg text-purple-600 dark:text-purple-400">₱{product.retailPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel: Selected Products */}
          <div className="flex flex-col rounded-xl shadow-sm border-2 border-slate-200 dark:border-slate-800 h-full min-h-0 overflow-hidden bg-white dark:bg-slate-900">
            {selectedProducts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-purple-50/30 dark:from-slate-900 dark:to-purple-900/10">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-10" />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 flex items-center justify-center">
                    <ShoppingCart className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No Products Selected</h3>
                <p className="text-sm text-muted-foreground dark:text-slate-400 text-center max-w-xs">
                  Click on products from the left panel to add them to your order
                </p>
              </div>
            ) : (
              <div className="flex flex-col h-full min-h-0">
                {/* Selected Header */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 border-b-2 border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-900/30 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        Selected Products
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                        {selectedProducts.length} {selectedProducts.length === 1 ? 'item' : 'items'} • {totalItems} total quantity
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

                {/* Selected Products List */}
                <ScrollArea className="flex-1 min-h-0 bg-gradient-to-br from-slate-50/50 to-purple-50/20 dark:from-slate-950/50 dark:to-purple-950/20">
                  <div className="p-4 space-y-3">
                    {selectedProducts.map((item) => (
                      <div
                        key={item.product.id}
                        className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-16 w-16 rounded-xl border-2 border-purple-100 dark:border-purple-900 shadow-sm">
                            <AvatarImage src={item.product.images?.[0]} alt={item.product.name} />
                            <AvatarFallback className="rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50">
                              <ImageIcon className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate mb-1">
                              {item.product.name}
                            </p>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline" className="text-[10px] py-0 px-2 h-5 bg-slate-50 dark:bg-slate-800 dark:text-slate-300">
                                {item.product.sku}
                              </Badge>
                              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                ₱{item.product.retailPrice.toFixed(2)}
                              </span>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    decrementQuantity(item.product.id);
                                  }}
                                  className="h-9 w-9 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-l-md text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.product.id, e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-16 h-9 border-0 bg-transparent text-center font-semibold focus-visible:ring-0 text-sm text-slate-900 dark:text-slate-100"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    incrementQuantity(item.product.id);
                                  }}
                                  className="h-9 w-9 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-r-md text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
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
                                className="h-9 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/50 border-2 border-transparent hover:border-red-200 dark:hover:border-red-900"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Item Subtotal */}
                        <div className="mt-3 pt-3 border-t-2 border-slate-100 dark:border-slate-800 flex justify-between items-center">
                          <span className="text-xs text-slate-600 dark:text-slate-400">Item Subtotal</span>
                          <span className="text-base font-bold text-purple-600 dark:text-purple-400">
                            ₱{(item.product.retailPrice * (typeof item.quantity === 'string' ? 0 : item.quantity)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-11 border-2 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToOrder}
              disabled={selectedProducts.length === 0}
              className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg font-semibold disabled:opacity-50"
            >
              Save Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}