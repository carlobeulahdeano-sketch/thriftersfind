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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Customer, PaymentMethod, Batch } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check, Package, Trash2, Plus, ShoppingCart, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPreOrder } from "../actions";
import { useRouter } from "next/navigation";
import { createCustomer } from "../../customers/actions";
import type { Station } from "../../stations/actions";
import { format } from "date-fns";
import { CreateBatchDialog } from "../../batches/components/create-batch-dialog";
// import { getProductNames } from "../../inventory/actions";
// import { AddProductDialog } from "../../inventory/components/add-product-dialog";
import { CreatePreOrderProductDialog } from "./create-pre-order-product-dialog";
import { SelectProductsDialog } from "./select-products-dialog";
import { Product } from "@/lib/types";

interface CreatePreOrderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    customers: Customer[];
    stations: Station[];
    batches?: Batch[];
}

const paymentMethods: PaymentMethod[] = ["COD", "GCash", "Bank Transfer"];

interface OrderItem {
    id: string; // temp id
    name: string;
    quantity: number | string;
    price: number | string;
    image?: string;
}

export function CreatePreOrderDialog({
    isOpen,
    onClose,
    customers,
    stations,
    batches,
}: CreatePreOrderDialogProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States
    const [customerName, setCustomerName] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [address, setAddress] = useState("");
    const [email, setEmail] = useState("");
    const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
    const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [batchId, setBatchId] = useState<string>("none");
    const [availableBatches, setAvailableBatches] = useState<Batch[]>(batches || []);

    useEffect(() => {
        if (batches) {
            setAvailableBatches(batches);
        }
    }, [batches]);

    // Multi-select state
    const [selectedProductNames, setSelectedProductNames] = useState<string[]>([]);

    // Payment Terms State
    const [paymentTerms, setPaymentTerms] = useState<"full" | "downpayment" | "topay">("full");
    const [depositAmount, setDepositAmount] = useState<number | string>(0);

    const [comboboxOpen, setComboboxOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    // const [itemComboboxOpen, setItemComboboxOpen] = useState(false);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isCreateBatchOpen, setCreateBatchOpen] = useState(false);
    const [addProductOpen, setAddProductOpen] = useState(false);
    const [isSelectProductsOpen, setIsSelectProductsOpen] = useState(false);

    // Legacy state removed: existingProductNames

    const handleProductCreated = (product: any) => {
        // Upon creation, add to list immediately
        const newItem: OrderItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: product.name,
            price: product.retailPrice || 0,
            quantity: 1,
            image: product.images?.[0]
        };
        setSelectedItems(prev => [...prev, newItem]);
        toast({ title: "Product Created", description: `${product.name} added to order.` });
        setAddProductOpen(false);
    };

    const handleBatchCreated = (batch: Batch) => {
        setAvailableBatches(prev => [batch, ...prev]);
        setBatchId(batch.id);
        setCreateBatchOpen(false);
    };

    const handleProductsSelected = (products: Product[]) => {
        const newItems: OrderItem[] = products.map(product => ({
            id: Math.random().toString(36).substr(2, 9),
            name: product.name,
            price: 0,
            quantity: 1,
            image: product.images?.[0]
        }));
        setSelectedItems(prev => [...prev, ...newItems]);
        toast({ title: "Items Added", description: `${products.length} items added to order.` });
    };

    // Removed useEffect for getProductNames since we use the modal now which fetches on open


    useEffect(() => {
        const itemsTotal = selectedItems.reduce((sum, item) => {
            const p = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price;
            const q = typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity;
            return sum + (p * q);
        }, 0);
        setTotalAmount(itemsTotal);
        if (paymentTerms === "full") {
            setDepositAmount(itemsTotal);
        } else if (paymentTerms === "topay") {
            setDepositAmount(0);
        }
    }, [selectedItems, paymentTerms]);

    const resetForm = () => {
        setCustomerName("");
        setContactNumber("");
        setAddress("");
        setSelectedItems([]);
        setPaymentMethod("COD");
        setTotalAmount(0);
        setEmail("");
        setOrderDate(new Date().toISOString().split('T')[0]);
        setPaymentTerms("full");
        setDepositAmount(0);
        setBatchId("none");
        setIsSubmitting(false);
        setSelectedProductNames([]);
        setSearchQuery("");
    };

    // handleAddItems removed as it's replaced by handleProductsSelected

    const handleUpdateItem = (id: string, field: 'price' | 'quantity', value: string) => {
        if (value === "") {
            setSelectedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: "" } : item));
            return;
        }
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            setSelectedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: numValue } : item));
        }
    };

    const handleSave = async () => {
        // Validate items have price
        if (selectedItems.some(i => {
            const p = typeof i.price === 'string' ? parseFloat(i.price) || 0 : i.price;
            return p <= 0;
        })) {
            toast({
                variant: "destructive",
                title: "Invalid Price",
                description: "All items must have a price greater than 0.",
            });
            return;
        }

        if (!customerName || selectedItems.length === 0) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please select a customer and at least one item.",
            });
            return;
        }

        if (paymentTerms === 'downpayment') {
            const deposit = typeof depositAmount === 'string' ? parseFloat(depositAmount) || 0 : depositAmount;
            if (deposit > totalAmount) {
                toast({
                    variant: "destructive",
                    title: "Invalid Downpayment",
                    description: "Downpayment cannot exceed the total amount.",
                });
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const existingCustomer = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
            let finalCustomerId = existingCustomer?.id;
            let finalCustomerEmail = email || existingCustomer?.email || `${customerName.split(' ').join('.').toLowerCase()}@example.com`;

            if (!existingCustomer) {
                const newCustomer = await createCustomer({
                    name: customerName,
                    email: finalCustomerEmail,
                    phone: contactNumber,
                    avatar: "",
                    address: {
                        street: address.split(',')[0]?.trim() || "",
                        city: address.split(',')[1]?.trim() || "",
                        state: address.split(',')[2]?.trim() || "",
                        zip: address.split(',')[3]?.trim() || "",
                    },
                    orderHistory: [],
                    totalSpent: 0,
                });
                finalCustomerId = newCustomer.id;
            }

            const itemsPayload = selectedItems.map(item => ({
                productName: item.name,
                quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity,
                pricePerUnit: typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price,
                images: item.image ? [item.image] : [],
            }));

            let finalDeposit = 0;
            if (paymentTerms === 'full') {
                finalDeposit = totalAmount;
            } else if (paymentTerms === 'topay') {
                finalDeposit = 0;
            } else {
                finalDeposit = typeof depositAmount === 'string' ? parseFloat(depositAmount) || 0 : depositAmount;
            }

            let finalPaymentStatus = 'Unpaid';
            if (paymentTerms === 'full') {
                finalPaymentStatus = 'Paid';
            } else if (paymentTerms === 'topay') {
                finalPaymentStatus = 'Unpaid';
            } else {
                finalPaymentStatus = finalDeposit > 0 ? 'Partial' : 'Unpaid';
            }

            await createPreOrder({
                customerName,
                contactNumber,
                address,
                orderDate,
                totalAmount,
                paymentMethod,
                paymentStatus: finalPaymentStatus,
                depositAmount: finalDeposit,
                customerId: finalCustomerId!,
                customerEmail: finalCustomerEmail,
                remarks: '',
                items: itemsPayload,
                batchId: batchId,
            });

            toast({
                title: "Pre-order Created",
                description: `Successfully added pre-order for ${customerName}.`,
            });
            handleClose();
            router.refresh();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error Creating Pre-order",
                description: error instanceof Error ? error.message : "Something went wrong.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    }

    const handleCustomerSelect = (customer: Customer) => {
        setCustomerName(customer.name);
        setContactNumber(customer.phone);
        setAddress([customer.address.street, customer.address.city, customer.address.state].filter(Boolean).join(', '));
        setEmail(customer.email || "");
        setSearchQuery("");
        setComboboxOpen(false);
    }

    const removeItem = (id: string) => {
        setSelectedItems(prev => prev.filter(item => item.id !== id));
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    {/* Gradient Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4 flex items-center gap-3 text-white">
                        <ShoppingCart className="h-6 w-6" />
                        <div>
                            <DialogTitle className="text-white text-lg font-semibold">Create New Order</DialogTitle>
                            <DialogDescription className="text-blue-100 text-sm">
                                Add a new pre-order to the system
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

                        {/* Customer Selection */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">1. Customer Details</Label>
                            <Tabs defaultValue="existing" onValueChange={() => {
                                setCustomerName("");
                                setContactNumber("");
                                setAddress("");
                                setEmail("");
                            }}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="existing">Existing Customer</TabsTrigger>
                                    <TabsTrigger value="new">New Customer</TabsTrigger>
                                </TabsList>

                                <TabsContent value="existing" className="space-y-3 pt-4">
                                    <div className="grid gap-4">
                                        <Popover open={comboboxOpen} onOpenChange={(open) => {
                                            setComboboxOpen(open);
                                            if (!open) setSearchQuery("");
                                        }} modal={false}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" aria-expanded={comboboxOpen} className="w-full justify-between h-10">
                                                    {customerName || "Select customer..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[200]" align="start">
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Search customer..."
                                                        value={searchQuery}
                                                        onValueChange={setSearchQuery}
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>No customer found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {customers.map((customer) => (
                                                                <CommandItem
                                                                    key={customer.id}
                                                                    value={customer.name}
                                                                    onSelect={() => handleCustomerSelect(customer)}
                                                                >
                                                                    <Check className={cn("mr-2 h-4 w-4", customerName.toLowerCase() === customer.name.toLowerCase() ? "opacity-100" : "opacity-0")} />
                                                                    {customer.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>

                                        <div className="grid grid-cols-2 gap-3">
                                            <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="Phone Number" />
                                            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="new" className="space-y-3 pt-4">
                                    <div className="grid gap-3">
                                        <div className="grid gap-2">
                                            <Label>Full Name</Label>
                                            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter full name" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Email</Label>
                                            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email address" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Phone Number</Label>
                                            <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="Enter phone number" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Address</Label>
                                            <Textarea
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="Street, City, State, Zip Code"
                                            />
                                            <p className="text-xs text-muted-foreground">Format: Street, City, State, Zip</p>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Items Selection */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">2. Order Items</Label>

                            {/* Items Selection Actions */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 justify-start h-12 border-dashed"
                                    onClick={() => setIsSelectProductsOpen(true)}
                                >
                                    <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Select Items from Inventory...</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-12 w-12 border-dashed px-0"
                                    onClick={() => setAddProductOpen(true)}
                                    title="Create New Product"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Items Table with Inline Editing */}
                            {selectedItems.length === 0 ? (
                                <div className="text-center text-sm text-muted-foreground py-8 border rounded-lg bg-muted/10">
                                    No items added yet.
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                    {selectedItems.map((item, index) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-card border rounded-md shadow-sm">
                                            <div className="col-span-1 flex justify-center">
                                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs overflow-hidden">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span>{index + 1}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-span-5">
                                                <div className="font-medium text-sm truncate" title={item.name}>{item.name}</div>
                                            </div>
                                            <div className="col-span-3">
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">₱</span>
                                                    <Input
                                                        type="number"
                                                        className="h-8 pl-5 text-sm"
                                                        value={item.price}
                                                        onChange={(e) => handleUpdateItem(item.id, 'price', e.target.value)}
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <Input
                                                    type="number"
                                                    className="h-8 text-sm text-center px-1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                                                    placeholder="1"
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeItem(item.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Payment & Date */}
                        <div className="space-y-4 border-t pt-4">
                            <div className="grid gap-3">
                                <Label className="text-base font-semibold">Payment Terms</Label>
                                <RadioGroup
                                    value={paymentTerms}
                                    onValueChange={(v: "full" | "downpayment" | "topay") => setPaymentTerms(v)}
                                    className="flex items-center gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="full" id="r-full" />
                                        <Label htmlFor="r-full">Pay Full</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="downpayment" id="r-down" />
                                        <Label htmlFor="r-down">Downpayment</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="topay" id="r-topay" />
                                        <Label htmlFor="r-topay">To Pay</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Payment Method</Label>
                                    <Select onValueChange={(v: PaymentMethod) => setPaymentMethod(v)} value={paymentMethod}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Estimated Total</Label>
                                    <div className="h-10 px-3 flex items-center bg-muted font-bold rounded-md">
                                        ₱{totalAmount.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {paymentTerms === 'downpayment' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Downpayment Amount</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-muted-foreground">₱</span>
                                            <Input
                                                type="number"
                                                className="pl-7 font-semibold"
                                                value={depositAmount}
                                                onChange={(e) => setDepositAmount(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>To Pay (Remaining)</Label>
                                        <div className="h-10 px-3 flex items-center bg-destructive/10 text-destructive font-bold rounded-md border border-destructive/20">
                                            ₱{(totalAmount - (typeof depositAmount === 'string' ? parseFloat(depositAmount) || 0 : depositAmount)).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-end gap-2">
                                <div className="grid gap-2 flex-1">
                                    <Label>Delivery Batch</Label>
                                    <Select value={batchId} onValueChange={(v: string) => {
                                        if (v === "none") {
                                            setBatchId(v);
                                            return;
                                        }

                                        const selectedBatch = availableBatches.find(b => b.id === v);
                                        // Debug log
                                        console.log("Selected batch:", selectedBatch);

                                        const status = selectedBatch?.status?.trim().toLowerCase();
                                        if (selectedBatch && status !== 'open') {
                                            toast({
                                                variant: "destructive",
                                                title: `Batch is ${selectedBatch.status}`,
                                                description: "This batch is closed and cannot be selected.",
                                            });
                                            return;
                                        }
                                        setBatchId(v);
                                    }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select delivery batch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Normal Delivery</SelectItem>
                                            {availableBatches.map((batch) => (
                                                <SelectItem key={batch.id} value={batch.id}>
                                                    {batch.batchName} ({batch.status}) - {format(new Date(batch.manufactureDate), 'MMM d')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCreateBatchOpen(true)}
                                    title="Create New Batch"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t bg-muted/20">
                        <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSubmitting} className="min-w-[120px]">
                            {isSubmitting ? "Creating..." : "Confirm Pre-order"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CreateBatchDialog
                isOpen={isCreateBatchOpen}
                onClose={() => setCreateBatchOpen(false)}
                onSuccess={handleBatchCreated}
            />

            <CreatePreOrderProductDialog
                isOpen={addProductOpen}
                onClose={() => setAddProductOpen(false)}
                onSuccess={handleProductCreated}
            />

            <SelectProductsDialog
                isOpen={isSelectProductsOpen}
                onClose={() => setIsSelectProductsOpen(false)}
                onSelect={handleProductsSelected}
            />
        </>
    );
}
