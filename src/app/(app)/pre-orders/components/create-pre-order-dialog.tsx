
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
import { Customer, PaymentMethod, Batch, PreOrderProduct } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check, Package, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SelectPreOrderProductDialog } from "./select-pre-order-product-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image as ImageIcon } from "lucide-react";
import { createPreOrder } from "../actions";
import { useRouter } from "next/navigation";
import { createCustomer } from "../../customers/actions";
import { Station } from "../../stations/actions";
import { format } from "date-fns";

interface CreatePreOrderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    customers: Customer[];
    products: PreOrderProduct[];
    stations: Station[];
    batches?: Batch[];
}

const paymentMethods: PaymentMethod[] = ["COD", "GCash", "Bank Transfer"];

export function CreatePreOrderDialog({
    isOpen,
    onClose,
    customers,
    products,
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
    const [selectedItems, setSelectedItems] = useState<{ product: PreOrderProduct; quantity: number | string }[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
    const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [batchId, setBatchId] = useState<string>("none");

    // Payment Terms State
    const [paymentTerms, setPaymentTerms] = useState<"full" | "downpayment">("full");
    const [depositAmount, setDepositAmount] = useState<number | string>(0);

    const [comboboxOpen, setComboboxOpen] = useState(false);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isProductSelectOpen, setProductSelectOpen] = useState(false);

    useEffect(() => {
        const itemsTotal = selectedItems.reduce((sum, item) => sum + ((item.product.retailPrice || 0) * (typeof item.quantity === 'string' ? 0 : item.quantity)), 0);
        setTotalAmount(itemsTotal);
        if (paymentTerms === "full") {
            setDepositAmount(itemsTotal);
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
        setPaymentTerms("full");
        setDepositAmount(0);
        setBatchId("none");
        setIsSubmitting(false);
    };

    const handleSave = async () => {
        if (!customerName || selectedItems.length === 0) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please select a customer and at least one item.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const existingCustomer = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
            let finalCustomerId = existingCustomer?.id;
            let finalCustomerEmail = email || existingCustomer?.email || `${customerName.split(' ').join('.').toLowerCase()}@example.com`;

            if (!existingCustomer) {
                // Auto-create customer if not exists
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
                productId: item.product.id, // mapped to preOrderProductId in action
                productName: item.product.name,
                quantity: typeof item.quantity === 'string' ? 0 : item.quantity,
                pricePerUnit: item.product.retailPrice || 0,
            }));

            // Determine final deposit amount based on terms
            const finalDeposit = paymentTerms === 'full'
                ? totalAmount
                : (typeof depositAmount === 'string' ? parseFloat(depositAmount) || 0 : depositAmount);
            const finalPaymentStatus = paymentTerms === 'full'
                ? 'Paid'
                : (finalDeposit > 0 ? 'Partial' : 'Unpaid'); // Or handle 'Unpaid' if 0 deposit

            await createPreOrder({
                customerName,
                contactNumber,
                address,
                orderDate,
                totalAmount,
                paymentMethod,
                paymentStatus: finalPaymentStatus, // Updated logic
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
        setComboboxOpen(false);
    }

    const handleProductSelect = (newSelectedItems: { product: PreOrderProduct; quantity: number | string }[]) => {
        setSelectedItems(prev => {
            const updated = [...prev];
            newSelectedItems.forEach(newItem => {
                const existingIndex = updated.findIndex(item => item.product.id === newItem.product.id);
                if (existingIndex > -1) {
                    const currentQty = typeof updated[existingIndex].quantity === 'string' ? 0 : updated[existingIndex].quantity;
                    const newQty = typeof newItem.quantity === 'string' ? 0 : newItem.quantity;
                    updated[existingIndex].quantity = currentQty + newQty;
                } else {
                    updated.push(newItem);
                }
            });
            return updated;
        });
        setProductSelectOpen(false);
    };

    const removeItem = (productId: string) => {
        setSelectedItems(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateItemQuantity = (productId: string, quantity: string) => {
        setSelectedItems(prev => prev.map(item =>
            item.product.id === productId ? { ...item, quantity: quantity === "" ? "" : Math.max(0, parseInt(quantity) || 0) } : item
        ));
    };

    // Helper to safely get image
    const getProductImage = (product: PreOrderProduct) => {
        if (Array.isArray(product.images) && product.images.length > 0) {
            return product.images[0];
        }
        return undefined;
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2 border-b">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Package className="h-5 w-5 text-indigo-500" />
                            Create Pre-order
                        </DialogTitle>
                        <DialogDescription>
                            Add a new pre-order.
                        </DialogDescription>
                    </DialogHeader>

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
                                        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" aria-expanded={comboboxOpen} className="w-full justify-between h-10">
                                                    {customerName || "Select customer..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search customer..." value={customerName} onValueChange={setCustomerName} />
                                                    <CommandList>
                                                        <CommandEmpty>No customer found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {customers.map((customer) => (
                                                                <CommandItem key={customer.id} value={customer.name} onSelect={() => handleCustomerSelect(customer)}>
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
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">2. Order Items</Label>
                                <Button variant="secondary" size="sm" onClick={() => setProductSelectOpen(true)} className="h-8">
                                    <Plus className="mr-2 h-3.5 w-3.5" /> Add Items
                                </Button>
                            </div>

                            {selectedItems.length === 0 ? (
                                <div className="border border-dashed rounded-md p-6 text-center text-sm text-muted-foreground bg-muted/30">
                                    No items selected. Click "Add Items" to browse inventory.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {selectedItems.map((item) => (
                                        <div key={item.product.id} className="flex items-center gap-3 p-2 bg-card border rounded-md">
                                            <Avatar className="h-10 w-10 border">
                                                <AvatarImage src={getProductImage(item.product)} />
                                                <AvatarFallback><ImageIcon className="h-4 w-4" /></AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">{item.product.name}</div>
                                                <div className="text-secondary-foreground text-xs">₱{item.product.retailPrice} each</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    className="w-16 h-8 text-center"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItemQuantity(item.product.id, e.target.value)}
                                                />
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.product.id)}>
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
                                    onValueChange={(v: "full" | "downpayment") => setPaymentTerms(v)}
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

                            <div className="grid gap-2">
                                <Label>Delivery Batch</Label>
                                <Select value={batchId} onValueChange={(v) => setBatchId(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select delivery batch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Normal Delivery</SelectItem>
                                        {batches?.map((batch) => (
                                            <SelectItem key={batch.id} value={batch.id}>
                                                {batch.batchName} ({format(new Date(batch.manufactureDate), 'MMM d')})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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

            <SelectPreOrderProductDialog
                isOpen={isProductSelectOpen}
                onClose={() => setProductSelectOpen(false)}
                onProductSelect={handleProductSelect}
                products={products} // Passed from page (PreOrderProduct[])
            />
        </>
    );
}
