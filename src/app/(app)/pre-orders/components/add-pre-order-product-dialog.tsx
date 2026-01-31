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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, X, RefreshCw, Check, ChevronsUpDown, Search } from "lucide-react";
import { createPreOrderProduct } from "../actions";
import { searchProducts } from "../../inventory/actions";
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
import { cn } from "@/lib/utils";

interface AddPreOrderProductDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AddPreOrderProductDialog({ isOpen, onClose, onSuccess }: AddPreOrderProductDialogProps) {
    const { toast } = useToast();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    // Auto-generate SKU
    const [sku, setSku] = useState(() => "PRE-" + Math.random().toString(36).substring(2, 8).toUpperCase());
    const [quantity, setQuantity] = useState("0");
    const [cost, setCost] = useState("0.00");
    const [retailPrice, setRetailPrice] = useState("0.00");
    const [alertStock, setAlertStock] = useState("0");
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Inventory Linking State
    const [openCombobox, setOpenCombobox] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [linkedProductId, setLinkedProductId] = useState<string | null>(null);
    const [linkedProductName, setLinkedProductName] = useState<string>("");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchValue.trim()) {
                const results = await searchProducts(searchValue);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchValue]);

    const regenerateSku = () => {
        setSku("PRE-" + Math.random().toString(36).substring(2, 8).toUpperCase());
    };

    const resetForm = () => {
        setName("");
        regenerateSku();
        setDescription("");
        setQuantity("0");
        setCost("0.00");
        setRetailPrice("0.00");
        setAlertStock("0");
        setImages([]);
        setImagePreviews([]);
        setLinkedProductId(null);
        setLinkedProductName("");
        setSearchValue("");
        setSearchResults([]);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setImages(prev => [...prev, ...filesArray]);

            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        const missingFields = [];
        if (!name) missingFields.push("Product Name");
        if (!description) missingFields.push("Description");
        if (!cost || parseFloat(cost) <= 0) missingFields.push("Cost");

        // Retail Price is optional/can be 0 if not set, but let's check basic validity if entered
        // if (!retailPrice) missingFields.push("Retail Price"); 

        if (images.length === 0) missingFields.push("Product Images");

        if (missingFields.length > 0) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: `Please fill in the following fields: ${missingFields.join(", ")}`,
            });
            return;
        }

        setIsLoading(true);

        try {
            // Convert uploaded files to data URLs
            const imageDataUrls: string[] = [];

            for (const file of images) {
                const dataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                imageDataUrls.push(dataUrl);
            }

            const productData = {
                name,
                sku,
                description,
                quantity: parseInt(quantity) || 0,
                alertStock: parseInt(alertStock) || 0,
                cost: parseFloat(cost) || 0,
                retailPrice: parseFloat(retailPrice) || 0,
                images: imageDataUrls,
                inventoryProductId: linkedProductId || undefined,
            };

            await createPreOrderProduct(productData);

            toast({
                title: "Product Added",
                description: `Product "${name}" has been added to the pre-order inventory.`,
            });

            resetForm();
            onClose();
            onSuccess?.();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add product. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add Pre-Order Product</DialogTitle>
                    <DialogDescription>
                        Enter the details for the new pre-order product.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">

                    {/* Link Inventory Item Section */}
                    <div className="grid gap-2">
                        <Label>Link Inventory Item (Optional)</Label>
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    className="w-full justify-between"
                                >
                                    {linkedProductName ? linkedProductName : "Search inventory..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                                <Command shouldFilter={false}>
                                    <CommandInput
                                        placeholder="Search product name or SKU..."
                                        value={searchValue}
                                        onValueChange={setSearchValue}
                                    />
                                    <CommandList>
                                        <CommandEmpty>No products found.</CommandEmpty>
                                        <CommandGroup>
                                            {searchResults.map((product) => (
                                                <CommandItem
                                                    key={product.id}
                                                    value={product.name}
                                                    onSelect={() => {
                                                        setLinkedProductId(product.id === linkedProductId ? null : product.id);
                                                        setLinkedProductName(product.id === linkedProductId ? "" : product.name);
                                                        // Autofill name if selecting
                                                        if (product.id !== linkedProductId) {
                                                            setName(product.name);
                                                            // Optional: autofill description if empty
                                                            if (!description && product.description) setDescription(product.description);
                                                        }
                                                        setOpenCombobox(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            linkedProductId === product.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span>{product.name}</span>
                                                        <span className="text-xs text-muted-foreground">SKU: {product.sku} | Stock: {product.totalStock}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <p className="text-[0.8rem] text-muted-foreground">
                            Linking to an inventory item will autofill the name.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Product Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="sku">SKU</Label>
                            <div className="flex gap-2">
                                <Input value={sku} onChange={(e) => setSku(e.target.value)} />
                                <Button type="button" onClick={regenerateSku} size="icon" variant="outline" className="w-10">
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="alertStock">Alert Stock level</Label>
                            <Input id="alertStock" type="number" value={alertStock} onChange={(e) => setAlertStock(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="cost">Cost (PHP)</Label>
                            <Input id="cost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="retailPrice">Retail Price (PHP)</Label>
                            <Input id="retailPrice" type="number" value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="images">Product Images</Label>
                        <div className="border-2 border-dashed border-muted-foreground/50 rounded-md p-4 text-center">
                            <Input
                                id="images"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                            <Label htmlFor="images" className="cursor-pointer">
                                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                                <span className="mt-2 block text-sm font-medium text-muted-foreground">Click to upload images</span>
                            </Label>
                        </div>
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative">
                                        <img src={preview} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded-md" />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6"
                                            onClick={() => removeImage(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">The first image will be used as the primary display image.</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? "Adding..." : "Add Product"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
