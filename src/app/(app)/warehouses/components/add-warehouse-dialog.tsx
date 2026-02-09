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
import { createWarehouseProduct } from "@/app/(app)/warehouses/server-actions";
import { Package, MapPin, Calendar, Image as ImageIcon, PhilippinePeso, Hash, X, RefreshCw, Check, ChevronsUpDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
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
    const [openCombobox, setOpenCombobox] = useState(false);
    const [searchResults, setSearchResults] = useState<{ id: string; name: string; sku: string; images: string[] }[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (openCombobox) {
            searchProductsSimple("").then(setSearchResults);
        }
    }, [openCombobox]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery) {
                const results = await searchProductsSimple(searchQuery);
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
        setSelectedProduct(product);
        // We no longer have cost, retailPrice, or images in the simple product object
        // So we just set the selected product and close the combobox
        setOpenCombobox(false);
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
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">Add Warehouse Product</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to add a new product to your warehouse inventory.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="new">New Product</TabsTrigger>
                        <TabsTrigger value="existing">Existing Product</TabsTrigger>
                    </TabsList>

                    <TabsContent value="new" className="space-y-6">
                        {/* Basic Information Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Basic Information
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="productName" className="flex items-center gap-2">
                                        <Package className="w-4 h-4" />
                                        Product Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="productName"
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        placeholder="e.g. Vintage Shirt"
                                        className="w-full"
                                    />
                                </div>


                                <div className="space-y-2">
                                    <Label htmlFor="sku" className="flex items-center gap-2">
                                        <Hash className="w-4 h-4" />
                                        SKU <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            value={baseSku}
                                            readOnly
                                            className="bg-muted"
                                        />
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Variant Color"
                                                value={variantColor}
                                                onChange={(e) => setVariantColor(e.target.value)}
                                            />
                                            <Button
                                                type="button"
                                                onClick={regenerateSku}
                                                size="icon"
                                                variant="outline"
                                                className="w-10 shrink-0"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image" className="flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                    Product Image
                                </Label>

                                {!imagePreview ? (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors text-center cursor-pointer relative group">
                                        <Input
                                            id="image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-3 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
                                                <ImageIcon className="w-6 h-6 text-gray-500" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-600">
                                                Click to upload image
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                PNG, JPG up to 10MB
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-contain"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={handleRemoveImage}
                                            className="absolute top-2 right-2 h-8 w-8 shadow-sm"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                        <div className="absolute bottom-2 right-2 flex gap-2">
                                            <label htmlFor="change-image" className="cursor-pointer">
                                                <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 py-1">
                                                    Change
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
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Select Existing Product
                            </h3>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Package className="w-4 h-4" />
                                        Search Product <span className="text-red-500">*</span>
                                    </Label>
                                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openCombobox}
                                                className="w-full justify-between"
                                            >
                                                {selectedProduct
                                                    ? selectedProduct.name
                                                    : "Select product..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search product..." onValueChange={setSearchQuery} />
                                                <CommandList>
                                                    <CommandEmpty>No product found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {searchResults.map((product) => (
                                                            <CommandItem
                                                                key={product.id}
                                                                value={`${product.name} ${product.sku}`}
                                                                onSelect={() => handleSelectProduct(product)}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedProduct?.id === product.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span>{product.name}</span>
                                                                    <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                                                                </div>
                                                                {
                                                                    product.images && product.images.length > 0 && (
                                                                        <div className="ml-auto w-8 h-8 rounded overflow-hidden border border-gray-200">
                                                                            <img
                                                                                src={product.images[0]}
                                                                                alt={product.name}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </div>
                                                                    )
                                                                }
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {selectedProduct && (
                                    <div className="space-y-4 p-4 border rounded-md">
                                        {selectedProduct.images && selectedProduct.images.length > 0 && (
                                            <div className="flex justify-center mb-4">
                                                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                    <img
                                                        src={selectedProduct.images[0]}
                                                        alt={selectedProduct.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label htmlFor="existing-name">Product Name</Label>
                                            <Input
                                                id="existing-name"
                                                value={selectedProduct.name}
                                                readOnly
                                                className="bg-muted text-muted-foreground"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="existing-sku">SKU</Label>
                                            <Input
                                                id="existing-sku"
                                                value={selectedProduct.sku}
                                                readOnly
                                                className="bg-muted text-muted-foreground"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Common Fields */}
                    <div className="space-y-4 pt-4 border-t mt-4">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Inventory & Pricing Details
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="manufacture_date" className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Manufacture Date
                                </Label>
                                <Input
                                    id="manufacture_date"
                                    type="date"
                                    value={manufacture_date}
                                    onChange={(e) => setManufactureDate(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location" className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Location
                                </Label>
                                <Input
                                    id="location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. Aisle 1, Shelf B"
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quantity" className="flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Quantity
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="0"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="0"
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="alertStock" className="flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Stock Alert
                                </Label>
                                <Input
                                    id="alertStock"
                                    type="number"
                                    min="0"
                                    value={alertStock}
                                    onChange={(e) => setAlertStock(e.target.value)}
                                    placeholder="0"
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cost" className="flex items-center gap-2">
                                    <PhilippinePeso className="w-4 h-4" />
                                    Cost
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
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
                                        className="pl-7"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="retailPrice" className="flex items-center gap-2">
                                    <PhilippinePeso className="w-4 h-4" />
                                    Retail Price
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
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
                                        className="pl-7"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Tabs>

                <DialogFooter className="gap-2 sm:gap-0 mt-6">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Add Product"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}

export default AddWarehouseDialog;