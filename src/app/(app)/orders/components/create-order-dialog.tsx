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
import { ChevronsUpDown, Check, Copy, Package, Trash2, Plus, PhilippinePeso } from "lucide-react";
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
  batches: Batch[]; // Added batches prop
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

  // Multiple Items State
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

      // Combine item names for the single-item record in mock/legacy schema
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
        price: selectedItems[0]?.product.retailPrice || 0, // Mocking price as first item's price
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
        createdBy: { uid: 'user-id', name: 'Current User' }, // Replace with real user info if available
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold border-b pb-4">{lastCreatedOrder ? 'Order Created Successfully' : 'Create New Order'}</DialogTitle>
            {!lastCreatedOrder && <DialogDescription className="pt-2">
              Fill in the details below to create a new order.
            </DialogDescription>}
          </DialogHeader>

          {lastCreatedOrder ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 py-12 px-6">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
                <Check className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Order for {lastCreatedOrder.customerName} has been created.</p>
                <div className="flex flex-col gap-2 w-full">
                  <Button onClick={handlePrintReceipt} size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Package className="mr-2 h-4 w-4" />
                    Print Receipt
                  </Button>
                  <Button onClick={copyInvoice} variant="outline" size="lg" className="w-full">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Invoice Details
                  </Button>

                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground pb-2 border-b">Customer Information</h3>
                  <div className="grid gap-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="customerName">Customer Name</Label>
                        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={comboboxOpen}
                              className="w-full justify-between"
                            >
                              {customerName || "Walk In Customer"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Search or type new customer..."
                                onValueChange={(value) => {
                                  if (value) {
                                    setCustomerName(value);
                                  }
                                }}
                              />
                              <CommandList>
                                <CommandEmpty>No customer found. Type name to create.</CommandEmpty>
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
                                  {customers.filter(c => c.name.toLowerCase() !== "walk in customer").map((customer) => (
                                    <CommandItem
                                      key={customer.id}
                                      value={`${customer.name}-${customer.id}`}
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
                      <div className="grid gap-2">
                        <Label htmlFor="contactNumber">Contact No.</Label>
                        <Input
                          id="contactNumber"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          placeholder="09XX-XXX-XXXX"
                          disabled={customerName === "Walk In Customer"}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street, City, State"
                        disabled={customerName === "Walk In Customer"}
                      />
                    </div>
                  </div>
                </div>

                {/* Item Purchases Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Item Purchases</h3>
                    <Button variant="outline" size="sm" onClick={() => setProductSelectOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>

                  {selectedItems.length === 0 ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/50">
                      <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No items added to this order yet.</p>
                      <Button variant="link" className="text-xs" onClick={() => setProductSelectOpen(true)}>Choose from products</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedItems.map((item) => (
                        <div key={item.product.id} className="flex items-center gap-4 p-3 bg-card border rounded-lg shadow-sm">
                          <Avatar className="h-12 w-12 rounded-md">
                            <AvatarImage src={item.product.images?.[0] as string} alt={item.product.name} />
                            <AvatarFallback className="rounded-md bg-muted">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{item.product.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">SKU: {item.product.sku}</span>
                              <span className="text-xs font-medium text-primary">₱{item.product.retailPrice.toFixed(2)}</span>
                              {item.batchName && (
                                <Badge variant="secondary" className="text-[10px] px-1 h-5 ml-1">
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
                              className="w-16 h-8 text-center"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeItem(item.product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Details Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground pb-2 border-b">Delivery & Payment</h3>
                  <div className="grid gap-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      {customerName !== "Walk In Customer" && (
                        <div className="grid gap-2">
                          <Label htmlFor="shippingFee" className="flex items-center gap-2">
                            <PhilippinePeso className="h-4 w-4" />
                            Shipping Fee
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                              ₱
                            </span>
                            <Input
                              id="shippingFee"
                              type="number"
                              value={shippingFee}
                              onChange={(e) => setShippingFee(e.target.value)}
                              placeholder="0.00"
                              className="pl-7"
                              disabled={isPickup}
                            />
                          </div>
                        </div>
                      )}
                      <div className={cn("grid gap-2", customerName === "Walk In Customer" && "col-span-2")}>
                        <Label>Total Amount</Label>
                        <div className="font-bold text-xl text-primary">₱{totalAmount.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="rushShip-create">Rush Ship</Label>
                        <Select
                          value={rushShip ? "yes" : "no"}
                          onValueChange={(value) => setRushShip(value === "yes")}
                          disabled={customerName === "Walk In Customer"}
                        >
                          <SelectTrigger id="rushShip-create">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">Standard Shipping</SelectItem>
                            <SelectItem value="yes">Rush Shipping</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Assign Batch</Label>
                        <Select
                          value={batchId && batchId !== 'hold' && batchId !== 'none' ? batchId : ''}
                          onValueChange={(value) => setBatchId(value)}
                        >
                          <SelectTrigger>
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
                    </div>

                    {customerName !== "Walk In Customer" && (
                      <div className="grid gap-2">
                        <Label htmlFor="pickup-station">Pickup Options</Label>
                        <Select
                          value={isPickup && selectedStationId ? selectedStationId : "delivery"}
                          onValueChange={(value) => {
                            if (value === "delivery") {
                              setIsPickup(false);
                              setSelectedStationId(null);
                              setCourierName(""); // Reset courier name if switching back to delivery
                            } else {
                              setIsPickup(true);
                              setShippingFee("0");
                              setSelectedStationId(value);
                            }
                          }}
                        >
                          <SelectTrigger id="pickup-station">
                            <SelectValue placeholder="Select delivery method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="delivery">Standard Delivery</SelectItem>
                            {stations.length > 0 && <div className="border-t my-1" />}
                            {stations.map((station) => (
                              <SelectItem key={station.id} value={station.id}>
                                Pickup at {station.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {customerName !== "Walk In Customer" && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="courierName">Courier Name</Label>
                          <Input
                            id="courierName"
                            value={courierName}
                            onChange={(e) => setCourierName(e.target.value)}
                            placeholder="Lalamove, J&T, etc."
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="trackingNumber">Tracking Number</Label>
                          <Input
                            id="trackingNumber"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="TRACKING-123"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="remarks-create">Remarks</Label>
                      <Select onValueChange={(value: OrderRemark) => setRemarks(value)} value={remarks}>
                        <SelectTrigger>
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

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="batchId">Delivery Batch</Label>
                        <Select
                          onValueChange={(value) => setBatchId(value)}
                          value={batchId && batchId !== 'hold' ? 'none' : (batchId || '')}
                          disabled={customerName === "Walk In Customer"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select batch" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hold">Hold for Next Batch</SelectItem>
                            <SelectItem value="none">Normal Delivery</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select
                          onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
                          value={paymentMethod}
                          disabled={customerName === "Walk In Customer"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
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
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 pb-4">
                      <div className={cn("grid gap-2", customerName === "Walk In Customer" && "col-span-2")}>
                        <Label htmlFor="paymentStatus">Payment Status</Label>
                        <Select
                          onValueChange={(value: PaymentStatus) => setPaymentStatus(value)}
                          value={paymentStatus}
                          disabled={batchId === 'hold' || customerName === "Walk In Customer"}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
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
                        <div className="grid gap-2">
                          <Label htmlFor="shippingStatus">Shipping Status</Label>
                          <Select
                            onValueChange={(value: ShippingStatus) => setShippingStatus(value)}
                            value={shippingStatus}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
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

          <DialogFooter className="p-6 border-t mt-auto">
            <Button variant="outline" onClick={handleClose} className="flex-1" disabled={isSubmitting}>
              {lastCreatedOrder ? 'Close' : 'Cancel'}
            </Button>
            {!lastCreatedOrder && <Button onClick={handleSave} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Order"}
            </Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog >
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
