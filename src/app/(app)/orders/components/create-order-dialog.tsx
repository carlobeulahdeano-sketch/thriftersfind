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
import { Customer, Order, PaymentStatus, ShippingStatus, PaymentMethod, Batch, OrderRemark, Product } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check, Copy, Package, Trash2, Plus, PhilippinePeso, User, MapPin, Phone, CreditCard, Truck, Calendar, FileText, Printer, CheckCircle2, ShoppingCart, Zap, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectProductDialog } from "./select-product-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon } from "lucide-react";
import { createOrder } from "../actions";
import { useRouter } from "next/navigation";
import { createCustomer } from "../../customers/actions";
import { Station } from "../../stations/actions";
import { format } from "date-fns";

interface CreateOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  products: Product[];
  stations: Station[];
  batches: Batch[];
}

const paymentStatuses: PaymentStatus[] = ["Hold", "Paid", "Unpaid", "PAID PENDING"];
const shippingStatuses: ShippingStatus[] = ["Pending", "Ready", "Shipped", "Delivered", "Cancelled", "Claimed"];
const paymentMethods: PaymentMethod[] = ["COD", "GCash", "Bank Transfer"];
const remarksOptions: OrderRemark[] = ["PLUS Branch 1", "PLUS Branch 2", "PLUS Warehouse"];

export function CreateOrderDialog({
  isOpen,
  onClose,
  customers,
  products,
  stations,
  batches,
}: CreateOrderDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("Walk In Customer");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");

  const [selectedItems, setSelectedItems] = useState<{ product: Product; quantity: number | string; batchName?: string }[]>([]);

  const [shippingFee, setShippingFee] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Unpaid");
  const [shippingStatus, setShippingStatus] = useState<ShippingStatus>("Pending");
  const [batchId, setBatchId] = useState<string | null>(null);
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [remarks, setRemarks] = useState<OrderRemark>('');
  const [rushShip, setRushShip] = useState(false);
  const [isPickup, setIsPickup] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [isProductSelectOpen, setProductSelectOpen] = useState(false);

  useEffect(() => {
    const itemsTotal = selectedItems.reduce((sum, item) => sum + (item.product.retailPrice * (typeof item.quantity === 'string' ? 0 : item.quantity)), 0);
    const sf = parseFloat(shippingFee) || 0;
    setTotalAmount(itemsTotal + sf);
  }, [selectedItems, shippingFee]);

  useEffect(() => {
    if (customerName === "Walk In Customer") {
      setPaymentStatus("Paid");
      setShippingStatus("Delivered");
    }
  }, [customerName]);

  const resetForm = () => {
    setCustomerName("Walk In Customer");
    setContactNumber("");
    setAddress("");
    setSelectedItems([]);
    setShippingFee("0");
    setPaymentMethod("COD");
    setPaymentStatus("Unpaid");
    setShippingStatus("Pending");
    setBatchId(null);
    setTotalAmount(0);
    setCourierName("");
    setTrackingNumber("");
    setRemarks('');
    setRushShip(false);
    setIsPickup(false);
    setSelectedStationId(null);
    setLastCreatedOrder(null);
    setIsSubmitting(false);
  };

  const copyInvoice = () => {
    if (!lastCreatedOrder) return;

    const itemsList = lastCreatedOrder.items?.map((item: any) =>
      `${item.product.name} (x${item.quantity}) - ₱${(item.product.retailPrice * item.quantity).toFixed(2)}`
    ).join('\n') || '';

    const invoiceText = `
ORDER CONFIRMATION
Order ID: ${lastCreatedOrder.id.substring(0, 7)}
Date: ${format(new Date(lastCreatedOrder.createdAt || new Date()), 'MMM d, yyyy h:mm a')}

CUSTOMER DETAILS
Name: ${lastCreatedOrder.customerName}
Contact: ${lastCreatedOrder.contactNumber || 'N/A'}
Address: ${lastCreatedOrder.address || 'N/A'}

ITEMS
${itemsList}

PAYMENT & DELIVERY
Payment Method: ${lastCreatedOrder.paymentMethod}
Payment Status: ${lastCreatedOrder.paymentStatus}
Shipping Status: ${lastCreatedOrder.shippingStatus}
Courier: ${lastCreatedOrder.courierName || 'N/A'}
Tracking No: ${lastCreatedOrder.trackingNumber || 'N/A'}

SUMMARY
Subtotal: ₱${(lastCreatedOrder.totalAmount - lastCreatedOrder.shippingFee).toFixed(2)}
Shipping Fee: ₱${lastCreatedOrder.shippingFee.toFixed(2)}
Total Amount: ₱${lastCreatedOrder.totalAmount.toFixed(2)}
    `.trim();

    navigator.clipboard.writeText(invoiceText).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: "Invoice details have been copied securely.",
      });
    });
  };

  const handlePrintReceipt = async () => {
    if (!lastCreatedOrder) return;

    const element = document.getElementById('receipt-content');
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `receipt-${lastCreatedOrder.id.substring(0, 7)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    try {
      toast({
        title: "Generating PDF...",
        description: "Please wait while we prepare your receipt.",
      });
      // @ts-ignore
      const html2pdf = (await import('html2pdf.js')).default;
      const pdfBlobUrl = await html2pdf().set(opt).from(element).output('bloburl');
      window.open(pdfBlobUrl, '_blank');
    } catch (error) {
      console.error("PDF generation failed", error);
      toast({
        variant: "destructive",
        title: "PDF Error",
        description: "Failed to generate receipt PDF.",
      });
    }
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
      let finalCustomerEmail = existingCustomer?.email || `${customerName.split(' ').join('.').toLowerCase()}@example.com`;

      if (!existingCustomer) {
        toast({
          title: "Creating New Customer",
          description: `Adding ${customerName} to the database...`,
        });

        const newCustomer = await createCustomer({
          name: customerName,
          email: finalCustomerEmail,
          phone: contactNumber,
          avatar: "",
          address: {
            street: address.split(',')[0] || "",
            city: address.split(',')[1]?.trim() || "",
            state: address.split(',')[2]?.trim() || "",
            zip: "",
          },
          orderHistory: [],
          totalSpent: 0,
        });
        finalCustomerId = newCustomer.id;
      }

      const combinedItemName = selectedItems.map(item => `${item.product.name} (x${item.quantity})`).join(', ');

      const orderData: Omit<Order, 'id' | 'createdAt'> = {
        customerId: finalCustomerId!,
        customerName: customerName,
        customerEmail: finalCustomerEmail,
        contactNumber: contactNumber || (existingCustomer ? existingCustomer.phone : ''),
        address: address || (existingCustomer ? `${existingCustomer.address.street}, ${existingCustomer.address.city}`.trim() : ''),
        orderDate: new Date().toISOString().split('T')[0],
        itemName: combinedItemName,
        quantity: selectedItems.reduce((sum, item) => sum + (typeof item.quantity === 'string' ? 0 : item.quantity), 0),
        price: selectedItems[0]?.product.retailPrice || 0,
        shippingFee: parseFloat(shippingFee) || 0,
        totalAmount: totalAmount || 0,
        paymentMethod,
        paymentStatus: batchId === 'hold' ? 'Hold' : paymentStatus,
        shippingStatus,
        batchId: (batchId === 'hold' || batchId === 'none' || !batchId) ? null : batchId,
        courierName,
        trackingNumber,
        remarks,
        rushShip,
        createdBy: { uid: 'user-id', name: 'Current User' },
        items: selectedItems.map(item => ({
          product: item.product,
          quantity: typeof item.quantity === 'string' ? 0 : item.quantity
        })),
      };

      const result = await createOrder(orderData);
      setLastCreatedOrder(result);
      toast({
        title: "Order Created",
        description: `A new order has been successfully created.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Creating Order",
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
    setComboboxOpen(false);
  }

  const handleProductSelect = (newSelectedItems: { product: Product; quantity: number | string }[], selectedBatchId?: string | null) => {
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

    if (selectedBatchId) {
      setBatchId(selectedBatchId);
    }

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

  const subtotal = selectedItems.reduce((sum, item) => sum + (item.product.retailPrice * (typeof item.quantity === 'string' ? 0 : item.quantity)), 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-4xl max-h-[95vh] flex flex-col p-0 overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/30">
          {/* Header with gradient */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-90" />
            <div className="relative p-6 pb-8">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    {lastCreatedOrder ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <ShoppingCart className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <DialogTitle className="text-2xl font-bold text-white">
                    {lastCreatedOrder ? 'Order Created Successfully' : 'Create New Order'}
                  </DialogTitle>
                </div>
                {!lastCreatedOrder && (
                  <DialogDescription className="text-blue-100 text-base">
                    Fill in the details below to create a new order for your customer.
                  </DialogDescription>
                )}
              </DialogHeader>
            </div>
          </div>

          {lastCreatedOrder ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-8 py-12 px-6">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-20 animate-pulse" />
                <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-full shadow-2xl">
                  <CheckCircle2 className="h-16 w-16 text-white" />
                </div>
              </div>

              <div className="text-center space-y-3 max-w-md">
                <h3 className="text-2xl font-bold text-slate-900">
                  Order Confirmed!
                </h3>
                <p className="text-lg text-slate-600">
                  Order for <span className="font-semibold text-blue-600">{lastCreatedOrder.customerName}</span> has been created successfully.
                </p>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mt-4">
                  <p className="text-sm text-slate-600 mb-1">Order ID</p>
                  <p className="text-xl font-bold text-blue-600">{lastCreatedOrder.id.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <Button
                  onClick={handlePrintReceipt}
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg h-12"
                >
                  <Printer className="mr-2 h-5 w-5" />
                  Print Receipt
                </Button>
                <Button
                  onClick={copyInvoice}
                  variant="outline"
                  size="lg"
                  className="flex-1 border-2 hover:bg-slate-100 h-12"
                >
                  <Copy className="mr-2 h-5 w-5" />
                  Copy Invoice
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6 max-w-3xl mx-auto">
                {/* Customer Information Card */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b-2 border-blue-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Customer Information</h3>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customerName" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-500" />
                          Customer Name
                        </Label>
                        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={comboboxOpen}
                              className="w-full justify-between h-11 border-2 hover:border-blue-400"
                            >
                              {customerName || "Walk In Customer"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[200]" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Search or type new customer..."
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="flex flex-col items-center gap-2 py-2">
                                    <span>No customer found.</span>
                                  </div>
                                </CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    value="Walk In Customer"
                                    onSelect={() => {
                                      setCustomerName("Walk In Customer");
                                      setContactNumber("");
                                      setAddress("");
                                      setPaymentStatus("Paid");
                                      setShippingStatus("Delivered");
                                      setShippingFee("0");
                                      setRushShip(false);
                                      setIsPickup(false);
                                      setBatchId(null);
                                      setCourierName("");
                                      setTrackingNumber("");
                                      setComboboxOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        customerName.toLowerCase() === "walk in customer" ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    Walk In Customer
                                  </CommandItem>
                                  {customers
                                    .filter(c => c.name.toLowerCase() !== "walk in customer")
                                    .map((customer) => (
                                      <CommandItem
                                        key={customer.id}
                                        value={customer.name}
                                        onSelect={() => handleCustomerSelect(customer)}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            customerName.toLowerCase() === customer.name.toLowerCase() ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {customer.name}
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactNumber" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-green-500" />
                          Contact Number
                        </Label>
                        <Input
                          id="contactNumber"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          placeholder="09XX-XXX-XXXX"
                          disabled={customerName === "Walk In Customer"}
                          className="h-11 border-2 focus:border-green-400"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500" />
                        Address
                      </Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street, City, State"
                        disabled={customerName === "Walk In Customer"}
                        className="h-11 border-2 focus:border-red-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Item Purchases Card */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b-2 border-purple-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Package className="w-4 h-4 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Item Purchases</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductSelectOpen(true)}
                      className="border-2 hover:border-purple-400 hover:bg-purple-50"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>

                  <div className="p-6">
                    {selectedItems.length === 0 ? (
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center bg-slate-50/50">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                          <Package className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-base font-medium text-slate-700 mb-1">No items added yet</p>
                        <p className="text-sm text-muted-foreground mb-4">Start adding products to this order</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setProductSelectOpen(true)}
                          className="border-2 hover:border-purple-400"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Choose Products
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedItems.map((item) => (
                          <div
                            key={item.product.id}
                            className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-purple-50/30 border-2 border-slate-200 rounded-xl hover:border-purple-300 transition-all group"
                          >
                            <Avatar className="h-14 w-14 rounded-xl border-2 border-white shadow-sm">
                              <AvatarImage src={item.product.images?.[0] as string} alt={item.product.name} />
                              <AvatarFallback className="rounded-xl bg-gradient-to-br from-purple-100 to-pink-100">
                                <ImageIcon className="h-6 w-6 text-purple-600" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-base truncate text-slate-900">{item.product.name}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground">SKU: {item.product.sku}</span>
                                <Badge variant="secondary" className="text-xs font-semibold bg-purple-100 text-purple-700">
                                  ₱{item.product.retailPrice.toFixed(2)}
                                </Badge>
                                {item.batchName && (
                                  <Badge variant="outline" className="text-[10px] px-2 h-5">
                                    {item.batchName}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(item.product.id, e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className="w-20 h-10 text-center font-semibold border-2"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeItem(item.product.id)}
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Order Summary */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 mt-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Subtotal ({selectedItems.reduce((sum, item) => sum + (typeof item.quantity === 'string' ? 0 : item.quantity), 0)} items)</span>
                              <span className="font-semibold text-slate-900">₱{subtotal.toFixed(2)}</span>
                            </div>
                            {customerName !== "Walk In Customer" && (
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Shipping Fee</span>
                                <span className="font-semibold text-slate-900">₱{parseFloat(shippingFee || "0").toFixed(2)}</span>
                              </div>
                            )}
                            <div className="border-t-2 border-blue-300 pt-2 mt-2">
                              <div className="flex justify-between">
                                <span className="text-base font-semibold text-slate-900">Total Amount</span>
                                <span className="text-2xl font-bold text-blue-600">₱{totalAmount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery & Payment Card */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b-2 border-green-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <Truck className="w-4 h-4 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Delivery & Payment</h3>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    {customerName !== "Walk In Customer" && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="shippingFee" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <PhilippinePeso className="w-4 h-4 text-green-500" />
                            Shipping Fee
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                              ₱
                            </span>
                            <Input
                              id="shippingFee"
                              type="number"
                              value={shippingFee}
                              onChange={(e) => setShippingFee(e.target.value)}
                              placeholder="0.00"
                              className="pl-8 h-11 border-2 focus:border-green-400"
                              disabled={isPickup}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-orange-500" />
                            Rush Shipping
                          </Label>
                          <Select
                            value={rushShip ? "yes" : "no"}
                            onValueChange={(value: string) => setRushShip(value === "yes")}
                            disabled={customerName === "Walk In Customer"}
                          >
                            <SelectTrigger className="h-11 border-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no">Standard Shipping</SelectItem>
                              <SelectItem value="yes">Rush Shipping</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          Assign Batch
                        </Label>
                        <Select
                          value={batchId && batchId !== 'hold' && batchId !== 'none' ? batchId : ''}
                          onValueChange={(value: string) => setBatchId(value)}
                        >
                          <SelectTrigger className="h-11 border-2">
                            <SelectValue placeholder="Select batch" />
                          </SelectTrigger>
                          <SelectContent>
                            {batches && batches.filter(b => b.status === "Open").map(b => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.batchName} ({format(new Date(b.manufactureDate), 'MMM d')})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {customerName !== "Walk In Customer" && (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-purple-500" />
                            Pickup Station
                          </Label>
                          <Select
                            value={isPickup && selectedStationId ? selectedStationId : "delivery"}
                            onValueChange={(value: string) => {
                              if (value === "delivery") {
                                setIsPickup(false);
                                setSelectedStationId(null);
                                setCourierName("");
                              } else {
                                setIsPickup(true);
                                setShippingFee("0");
                                setSelectedStationId(value);
                              }
                            }}
                          >
                            <SelectTrigger className="h-11 border-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="delivery">Standard Delivery</SelectItem>
                              {stations.length > 0 && stations.map((station) => (
                                <SelectItem key={station.id} value={station.id}>
                                  Pickup at {station.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {customerName !== "Walk In Customer" && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="courierName" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Truck className="w-4 h-4 text-indigo-500" />
                            Courier Name
                          </Label>
                          <Input
                            id="courierName"
                            value={courierName}
                            onChange={(e) => setCourierName(e.target.value)}
                            placeholder="Lalamove, J&T, etc."
                            className="h-11 border-2 focus:border-indigo-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="trackingNumber" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-cyan-500" />
                            Tracking Number
                          </Label>
                          <Input
                            id="trackingNumber"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="TRACKING-123"
                            className="h-11 border-2 focus:border-cyan-400"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        Remarks
                      </Label>
                      <Select onValueChange={(value: OrderRemark) => setRemarks(value)} value={remarks}>
                        <SelectTrigger className="h-11 border-2">
                          <SelectValue placeholder="Select a remark (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {remarksOptions.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-violet-500" />
                        Delivery Batch
                      </Label>
                      <Select
                        onValueChange={(value: string) => setBatchId(value)}
                        value={batchId && batchId !== 'hold' ? 'none' : (batchId || '')}
                        disabled={customerName === "Walk In Customer"}
                      >
                        <SelectTrigger className="h-11 border-2">
                          <SelectValue placeholder="Select batch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hold">Hold for Next Batch</SelectItem>
                          <SelectItem value="none">Normal Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-yellow-500" />
                          Payment Method
                        </Label>
                        <Select
                          onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
                          value={paymentMethod}
                          disabled={customerName === "Walk In Customer"}
                        >
                          <SelectTrigger className="h-11 border-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Payment Status</Label>
                        <Select
                          onValueChange={(value: PaymentStatus) => setPaymentStatus(value)}
                          value={paymentStatus}
                          disabled={batchId === 'hold' || customerName === "Walk In Customer"}
                        >
                          <SelectTrigger className="h-11 border-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentStatuses.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {customerName !== "Walk In Customer" && (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-700">Shipping Status</Label>
                          <Select
                            onValueChange={(value: ShippingStatus) => setShippingStatus(value)}
                            value={shippingStatus}
                          >
                            <SelectTrigger className="h-11 border-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {shippingStatuses.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="p-6 border-t-2 bg-slate-50/50 mt-auto">
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-11 border-2 hover:bg-slate-100"
                disabled={isSubmitting}
              >
                {lastCreatedOrder ? 'Close' : 'Cancel'}
              </Button>
              {!lastCreatedOrder && (
                <Button
                  onClick={handleSave}
                  className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg font-semibold"
                  disabled={isSubmitting || selectedItems.length === 0}
                >
                  {isSubmitting ? "Creating..." : "Create Order"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SelectProductDialog
        isOpen={isProductSelectOpen}
        onClose={() => setProductSelectOpen(false)}
        onProductSelect={handleProductSelect}
        products={products}
      />

      {/* Hidden Receipt Content for PDF Generation */}
      {lastCreatedOrder && (
        <div className="hidden">
          <div id="receipt-content" style={{ padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h1 style={{ margin: '0', fontSize: '24px' }}>ThriftersFind</h1>
              <p style={{ margin: '5px 0', color: '#666' }}>Official Receipt</p>
            </div>

            <div style={{ marginBottom: '20px', fontSize: '14px' }}>
              <p><strong>Order ID:</strong> {lastCreatedOrder.id}</p>
              <p><strong>Date:</strong> {new Date(lastCreatedOrder.createdAt).toLocaleString()}</p>
              <p><strong>Customer:</strong> {lastCreatedOrder.customerName}</p>
              <p><strong>Address:</strong> {lastCreatedOrder.address || 'N/A'}</p>
              <p><strong>Contact:</strong> {lastCreatedOrder.contactNumber || 'N/A'}</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Item</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lastCreatedOrder.items?.map((item: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{item.product?.name || item.productName || 'Unknown Product'}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>₱{(item.product?.retailPrice || 0).toFixed(2)}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>₱{((item.product?.retailPrice || 0) * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: 'right', fontSize: '14px' }}>
              <p style={{ margin: '5px 0' }}>Shipping Fee: ₱{lastCreatedOrder.shippingFee.toFixed(2)}</p>
              <p style={{ margin: '10px 0', fontSize: '18px', fontWeight: 'bold' }}>Total Amount: ₱{lastCreatedOrder.totalAmount.toFixed(2)}</p>
            </div>

            <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
              <p>Thank you for your purchase!</p>
              <p>ThriftersFind Analytics Engine Generated Receipt</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}