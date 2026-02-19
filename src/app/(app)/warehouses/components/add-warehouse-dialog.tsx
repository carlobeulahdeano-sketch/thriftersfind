"use client";

import { useState, useEffect, useRef } from "react";
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
import { createWarehouseProduct } from "@/app/(app)/warehouses/server-actions";
import { Package, MapPin, Calendar, Image as ImageIcon, PhilippinePeso, Hash, X, RefreshCw, Check, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


import { searchProducts, searchProductsSimple } from "@/app/(app)/inventory/actions";
import { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AddWarehouseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddWarehouseDialog({ isOpen, onClose, onSuccess }: AddWarehouseDialogProps) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("new");

    // NEW PRODUCT STATES
    const [productName, setProductName] = useState("");
    const [baseSku, setBaseSku] = useState(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)) + "-" + Math.floor(Math.random() * 100).toString().padStart(2, '0'));
    const [variantColor, setVariantColor] = useState("");
    const [manufacture_date, setManufactureDate] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [location, setLocation] = useState("");
    const [quantity, setQuantity] = useState("");
    const [alertStock, setAlertStock] = useState("");
    const [cost, setCost] = useState("");
    const [retailPrice, setRetailPrice] = useState("");

    // EXISTING PRODUCT STATES
    const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string; sku: string; images: string[] } | null>(null);
    const [searchResults, setSearchResults] = useState<{ id: string; name: string; sku: string; images: string[] }[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);



    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery) {
                const results = await searchProductsSimple(searchQuery);
                setSearchResults(results);
            } else {
                // Load initial products if query is empty
                const results = await searchProductsSimple("");
                setSearchResults(results);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const regenerateSku = () => {
        setBaseSku(String.fromCharCode(65 + Math.floor(Math.random() * 26)) + "-" + Math.floor(Math.random() * 100).toString().padStart(2, '0'));
    };

    const resetForm = () => {
        setProductName("");
        regenerateSku();
        setVariantColor("");
        setManufactureDate("");
        setImageFile(null);
        setImagePreview(null);
        setLocation("");
        setQuantity("");
        setAlertStock("");
        setCost("");
        setRetailPrice("");
        setSelectedProduct(null);
        setSearchQuery("");
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSelectProduct = (product: { id: string; name: string; sku: string; images: string[] }) => {
        if (selectedProduct?.id === product.id) {
            setSelectedProduct(null);
        } else {
            setSelectedProduct(product);
        }
    };

    const handleSave = async () => {
        let generatedSku = "";

        if (activeTab === "new") {
            generatedSku = baseSku + (variantColor ? "-" + variantColor : "");
            if (!productName || !generatedSku) {
                toast({
                    variant: "destructive",
                    title: "Missing Information",
                    description: "Product Name and SKU are required.",
                });
                return;
            }
        } else {
            // Existing product
            if (!selectedProduct) {
                toast({
                    variant: "destructive",
                    title: "Missing Information",
                    description: "Please select a product.",
                });
                return;
            }
            generatedSku = selectedProduct.sku;
        }

        setIsSubmitting(true);
        try {
            let imageDataUrl = null;

            if (activeTab === "new" && imageFile) {
                imageDataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(imageFile);
                });
            } else if (activeTab === "existing") {
                // Use selected product image if available
                if (selectedProduct?.images && selectedProduct.images.length > 0) {
                    imageDataUrl = selectedProduct.images[0];
                }
            }

            const result = await createWarehouseProduct({
                productName: activeTab === "new" ? productName : selectedProduct!.name,
                sku: generatedSku,
                manufacture_date: manufacture_date || null,
                image: imageDataUrl,
                location: location || null,
                quantity: quantity ? parseInt(quantity) : 0,
                alertStock: alertStock ? parseInt(alertStock) : 0,
                cost: cost ? parseFloat(cost) : 0,
                retailPrice: retailPrice ? parseFloat(retailPrice) : null,
                productId: activeTab === "existing" ? selectedProduct!.id : undefined
            });

            if (result.success) {
                toast({
                    title: "Product Created",
                    description: `Product "${activeTab === "new" ? productName : selectedProduct!.name}" has been created successfully.`,
                });
                resetForm();
                onClose();
                onSuccess();
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to create product.",
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-hidden p-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
                {/* Enhanced Gradient Header */}
                <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 px-8 py-6 overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative flex items-center gap-4 text-white">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                            <Package className="h-7 w-7" />
                        </div>
                        <div>
                            <DialogTitle className="text-white text-2xl font-bold tracking-tight">Add Warehouse Product</DialogTitle>
                            <DialogDescription className="text-blue-100 text-sm mt-1 font-medium">
                                Fill in the details below to add a new product to your warehouse inventory
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(95vh-200px)] px-8 py-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6 p-1.5 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50 h-12 rounded-xl shadow-sm">
                            <TabsTrigger
                                value="new"
                                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 font-semibold transition-all duration-200"
                            >
                                New Product
                            </TabsTrigger>
                            <TabsTrigger
                                value="existing"
                                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-600 font-semibold transition-all duration-200"
                            >
                                Existing Product
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="new" className="space-y-6">
                            {/* Basic Information Section */}
                            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-6 space-y-5 border border-blue-200/50 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">Basic Information</h3>
                                </div>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="productName" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            <Package className="w-4 h-4 text-blue-600" />
                                            Product Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="productName"
                                            value={productName}
                                            onChange={(e) => setProductName(e.target.value)}
                                            placeholder="e.g. Vintage Shirt"
                                            className="w-full bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-lg shadow-sm transition-all duration-200 h-11"
                                        />
                                    </div>


                                    <div className="space-y-2.5">
                                        <Label htmlFor="sku" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            <Hash className="w-4 h-4 text-blue-600" />
                                            SKU <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                value={baseSku}
                                                readOnly
                                                className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 font-mono font-semibold text-center rounded-lg h-11"
                                            />
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Variant Color"
                                                    value={variantColor}
                                                    onChange={(e) => setVariantColor(e.target.value)}
                                                    className="bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-lg shadow-sm transition-all duration-200 h-11"
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={regenerateSku}
                                                    size="icon"
                                                    variant="outline"
                                                    className="w-11 h-11 shrink-0 border-2 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-500 transition-all duration-200 rounded-lg"
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <Label htmlFor="image" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        <ImageIcon className="w-4 h-4 text-blue-600" />
                                        Product Image
                                    </Label>

                                    {!imagePreview ? (
                                        <div className="relative border-3 border-dashed border-blue-300 dark:border-blue-700 rounded-2xl p-8 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30 transition-all duration-300 text-center cursor-pointer group overflow-hidden">
                                            {/* Animated background gradient */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                            <Input
                                                id="image"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="relative flex flex-col items-center gap-3">
                                                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                                                    <ImageIcon className="w-8 h-8 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-base font-semibold text-blue-600 dark:text-blue-400 mb-1">
                                                        Click to upload image
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        PNG, JPG up to 10MB
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative w-full h-56 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-950 rounded-2xl overflow-hidden border-2 border-blue-300 dark:border-blue-700 shadow-md hover:shadow-lg transition-shadow duration-200">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-contain p-2"
                                            />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={handleRemoveImage}
                                                className="absolute top-3 right-3 h-9 w-9 shadow-lg hover:scale-110 transition-transform duration-200 rounded-xl"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                            <div className="absolute bottom-3 right-3 flex gap-2">
                                                <label htmlFor="change-image" className="cursor-pointer">
                                                    <div className="inline-flex items-center justify-center rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 h-9 px-4 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200">
                                                        Change Image
                                                    </div>
                                                    <Input
                                                        id="change-image"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="existing" className="space-y-6">
                            <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl p-6 space-y-5 border border-purple-200/50 dark:border-purple-800/50 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-sm">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">Select Existing Product</h3>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column: Search & Selection */}
                                    <div className="space-y-4">
                                        <div className="space-y-2.5">
                                            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                <Package className="w-4 h-4 text-purple-600" />
                                                Search Product <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                                                <Input
                                                    placeholder="Search product by name or SKU..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="pl-10 w-full bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 rounded-lg shadow-sm transition-all duration-200 h-11"
                                                />
                                            </div>
                                        </div>

                                        {selectedProduct && (
                                            <div className="space-y-4 p-4 border-2 border-purple-300 dark:border-purple-700 rounded-xl bg-white/50 dark:bg-gray-900/50 shadow-sm animate-in fade-in zoom-in duration-300">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 shadow-sm">
                                                        {selectedProduct.images?.[0] ? (
                                                            <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="h-full w-full object-contain p-1" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold bg-gray-50 dark:bg-gray-900">
                                                                {selectedProduct.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate">{selectedProduct.name}</h4>
                                                        <p className="text-sm text-purple-600 dark:text-purple-400 font-mono">{selectedProduct.sku}</p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end">
                                                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> Selected
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column: Results List */}
                                    <div className="space-y-2.5 flex flex-col h-full min-h-[300px]">
                                        <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            <Check className="w-4 h-4 text-purple-600" />
                                            Existing Available Products
                                        </Label>
                                        <div className="flex-1 bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-inner flex flex-col">
                                            {searchResults.length > 0 ? (
                                                <div className="overflow-y-auto max-h-[300px] p-2 space-y-2">
                                                    {searchResults.map((product) => (
                                                        <div
                                                            key={product.id}
                                                            onClick={() => handleSelectProduct(product)}
                                                            className={cn(
                                                                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border",
                                                                selectedProduct?.id === product.id
                                                                    ? "bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 ring-1 ring-purple-300 dark:ring-purple-700"
                                                                    : "hover:bg-gray-50 dark:hover:bg-gray-900 border-transparent hover:border-gray-200 dark:hover:border-gray-800"
                                                            )}
                                                        >
                                                            <div className="h-10 w-10 shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                                                {product.images?.[0] ? (
                                                                    <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs font-bold">
                                                                        {product.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{product.sku}</p>
                                                            </div>
                                                            {selectedProduct?.id === product.id && (
                                                                <div className="h-5 w-5 bg-purple-600 rounded-full flex items-center justify-center">
                                                                    <Check className="h-3 w-3 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                                                    <Search className="h-8 w-8 mb-2 opacity-20" />
                                                    <p className="text-sm">
                                                        {searchQuery ? "No products found matching your search." : "Type in the search box to find products."}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Common Fields */}
                    <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl p-6 space-y-5 mt-6 border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-sm">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">Inventory & Pricing Details</h3>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2.5">
                                <Label htmlFor="manufacture_date" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <Calendar className="w-4 h-4 text-emerald-600" />
                                    Manufacture Date
                                </Label>
                                <Input
                                    id="manufacture_date"
                                    type="date"
                                    value={manufacture_date}
                                    onChange={(e) => setManufactureDate(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-lg shadow-sm transition-all duration-200 h-11"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label htmlFor="location" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <MapPin className="w-4 h-4 text-emerald-600" />
                                    Location
                                </Label>
                                <Input
                                    id="location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. Aisle 1, Shelf B"
                                    className="w-full bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-lg shadow-sm transition-all duration-200 h-11"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label htmlFor="quantity" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <Package className="w-4 h-4 text-emerald-600" />
                                    Quantity
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="0"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-lg shadow-sm transition-all duration-200 h-11"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label htmlFor="alertStock" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Stock Alert
                                </Label>
                                <Input
                                    id="alertStock"
                                    type="number"
                                    min="0"
                                    value={alertStock}
                                    onChange={(e) => setAlertStock(e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-lg shadow-sm transition-all duration-200 h-11"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label htmlFor="cost" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <PhilippinePeso className="w-4 h-4 text-emerald-600" />
                                    Cost
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                                        ₱
                                    </span>
                                    <Input
                                        id="cost"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={cost}
                                        onChange={(e) => setCost(e.target.value)}
                                        placeholder="0.00"
                                        className="pl-8 bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-lg shadow-sm transition-all duration-200 h-11"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <Label htmlFor="retailPrice" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <PhilippinePeso className="w-4 h-4 text-emerald-600" />
                                    Retail Price
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                                        ₱
                                    </span>
                                    <Input
                                        id="retailPrice"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={retailPrice}
                                        onChange={(e) => setRetailPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="pl-8 bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-lg shadow-sm transition-all duration-200 h-11"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-3 sm:gap-3 px-8 py-5 border-t-2 border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="h-11 px-6 border-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-semibold transition-all duration-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="h-11 px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-700 hover:via-purple-700 hover:to-pink-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Creating...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Add Product
                            </span>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default AddWarehouseDialog;