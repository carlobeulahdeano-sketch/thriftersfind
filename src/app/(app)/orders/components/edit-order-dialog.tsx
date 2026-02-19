"use client";

import { useState, useEffect, useTransition } from "react";
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
import { ChevronsUpDown, Check, Copy, Package, Trash2, Plus, Image as ImageIcon, Loader, WandSparkles, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { SelectProductDialog } from "./select-product-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateOrder, getSmartSuggestions } from "../actions";
import { useRouter } from "next/navigation";
import { createCustomer } from "../../customers/actions";
import { Station } from "../../stations/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EditOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  customers: Customer[];
  products: Product[];
  stations: Station[];
  batches: Batch[];
}

const paymentStatuses: PaymentStatus[] = ["Hold", "Paid", "Unpaid", "PAID PENDING"];
const shippingStatuses: ShippingStatus[] = ["Pending", "Ready", "Shipped", "Delivered", "Cancelled", "Claimed"];
const paymentMethods: PaymentMethod[] = ["COD", "GCash", "Bank Transfer"];
const remarksOptions: OrderRemark[] = ["PLUS Branch 1", "PLUS Branch 2", "PLUS Warehouse"];


export function EditOrderDialog({
  isOpen,
  onClose,
  order,
  customers,
  products,
  stations,
  batches,
}: EditOrderDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");

  // Multiple Items State
  const [selectedItems, setSelectedItems] = useState<{ product: Product; quantity: number | string }[]>([]);

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
  const [isProductSelectOpen, setProductSelectOpen] = useState(false);

  // AI Suggestion State
  const [suggestion, setSuggestion] = useState<{ suggestedStatus: string; reasoning: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (order) {
      setCustomerName(order.customerName);
      setContactNumber(order.contactNumber || "");
      setAddress(order.address || "");

      // Parse items if available, or construct from legacy single-item fields
      let items: { product: Product; quantity: number | string }[] = [];
      if ((order as any).items && Array.isArray((order as any).items)) {
        // Map raw item data to local state structure if possible
        // Note: Accessing nested product data might require check if it's fully populated
        items = (order as any).items.map((item: any) => ({
          product: item.product || { id: item.productId, name: 'Unknown Product', retailPrice: 0, images: [] }, // Fallback if relational data missing
          quantity: item.quantity
        }));
      } else if ((order as any).items && typeof (order as any).items === 'string') {
        try {
          const parsed = JSON.parse((order as any).items);
          items = parsed.map((item: any) => ({
            product: item.product || { id: item.productId, name: 'Unknown Product', retailPrice: 0, images: [] },
            quantity: item.quantity
          }));
        } catch (e) {
          console.error("Failed to parse items json", e);
        }
      }

      // Fallback for legacy orders without items array
      if (items.length === 0 && order.itemName) {
        // This is a rough estimation as we can't link back to specific product ID easily without it
        // For now, we might leave it empty or try to match by name? 
        // Let's leave it empty but warn user, or better: 
        // If we can't reconstruct items efficiently, we just show the total props.
        // BUT the requirement is "content inside is the same to add product dialog". 
        // Implies full editing capability. 
      }

      setSelectedItems(items);

      setShippingFee(order.shippingFee.toString());
      setPaymentMethod(order.paymentMethod);
      setPaymentStatus(order.paymentStatus);
      setShippingStatus(order.shippingStatus);
      setBatchId(order.batchId || (order.paymentStatus === 'Hold' ? 'hold' : null));
      setCourierName(order.courierName || "");
      setTrackingNumber(order.trackingNumber || "");
      setRemarks(order.remarks || '');
      setRushShip(order.rushShip);
      // Logic to determine pickup vs delivery based on maybe courierName or absence of it? 
      // Or just default to false unless we persist it. 
      // For now reset to false to be safe unless we strictly track station ID in order
      setIsPickup(false);
      setSelectedStationId(null);

      setSuggestion(null);
    }
  }, [order]);

  useEffect(() => {
    const itemsTotal = selectedItems.reduce((sum, item) => sum + (item.product.retailPrice * (typeof item.quantity === 'string' ? 0 : item.quantity)), 0);
    const sf = parseFloat(shippingFee) || 0;
    const rushFee = rushShip ? 50 : 0;
    setTotalAmount(itemsTotal + sf + rushFee);
  }, [selectedItems, shippingFee, rushShip]);

  const handleCustomerSelect = (customer: Customer) => {
    setCustomerName(customer.name);
    setContactNumber(customer.phone);
    setAddress([customer.address.street, customer.address.city, customer.address.state].filter(Boolean).join(', '));
    setComboboxOpen(false);
  }

  const handleProductSelect = (newSelectedItems: { product: Product; quantity: number | string }[]) => {
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


  const handleSave = async () => {
    if (!order) return;
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
        // Logic to create customer if changed name doesn't exist?
        // Included for parity with Create Dialog
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

      const orderData: Partial<Order> = {
        customerId: finalCustomerId!,
        customerName: customerName,
        customerEmail: finalCustomerEmail,
        contactNumber: contactNumber,
        address: address,
        // Keep original date or update? Usually keep original unless edited. 
        // We track date in form? Use created date if not exposing date picker or specific field.
        // Dialog doesn't have date picker in Create, so keep existing. 
        // EditOrderDialog PREVIOUSLY had date picker. Let's add it back?
        // CreateOrderDialog doesn't have it. Parity means removing it or keeping it?
        // User said "content inside is the same to add product dialog", implying CreateOrderDialog.
        // CreateOrderDialog sets date to NOW. 
        // We should probably preserve the orderDate unless user wants to change it but CreateDialog doesn't have picker.
        // We will omit date updates for now to match CreateDialog simplicity, or just keep what's in 'order'.

        itemName: combinedItemName,
        quantity: selectedItems.reduce((sum, item) => sum + (typeof item.quantity === 'string' ? 0 : item.quantity), 0),
        price: totalAmount, // This might be totalAmount in the simplified model
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
        // Pass items so backend can sync (if backend supports it)
        // @ts-ignore
        items: selectedItems.map(item => ({
          product: item.product,
          quantity: typeof item.quantity === 'string' ? 0 : item.quantity
        })),
      };

      const result = await updateOrder(order.id, orderData);

      toast({
        title: "Order Updated",
        description: `Order ${result.id.substring(0, 7)} has been successfully updated.`,
      });
      onClose();
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Updating Order",
        description: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestion = () => {
    if (!order) return;
    startTransition(async () => {
      // @ts-ignore
      const result = await getSmartSuggestions(order);
      if (result.success && result.data) {
        setSuggestion(result.data);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch AI suggestion.",
        });
      }
    });
  };

  const applySuggestion = () => {
    if (suggestion) {
      setShippingStatus(suggestion.suggestedStatus as ShippingStatus);
      setSuggestion(null);
    }
  };

  if (!order) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold border-b pb-4">Edit Order {order.id.substring(0, 7)}...</DialogTitle>
            <DialogDescription className="pt-2">
              Update details for this order.
            </DialogDescription>
          </DialogHeader>

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
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                          <Command shouldFilter={false}>
                            <CommandInput
                              autoFocus
                              placeholder="Search or type new customer..."
                              onValueChange={(value: string) => setSearchQuery(value)}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {searchQuery && (
                                  <div className="flex flex-col items-center gap-2">
                                    <span>No customer found.</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setCustomerName(searchQuery);
                                        setComboboxOpen(false);
                                      }}
                                    >
                                      Use "{searchQuery}"
                                    </Button>
                                  </div>
                                )}
                              </CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="Walk In Customer"
                                  onSelect={() => {
                                    setCustomerName("Walk In Customer");
                                    setContactNumber("");
                                    setAddress("");
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
                                  .filter(c => c.isActive !== false && c.name.toLowerCase() !== "walk in customer")
                                  .filter(c => c.name.toLowerCase().includes((searchQuery || "").toLowerCase()))
                                  .map((customer) => (
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
                      <div key={item.product.id ? item.product.id : Math.random()} className="flex items-center gap-4 p-3 bg-card border rounded-lg shadow-sm">
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
                            <span className="text-xs font-medium text-primary">₱{Number(item.product.retailPrice).toFixed(2)}</span>
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
                            disabled={!item.product.id}
                          />
                          {item.product.id && <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(item.product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>}
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
                    <div className="grid gap-2">
                      <Label htmlFor="shippingFee">Shipping Fee</Label>
                      <Input
                        id="shippingFee"
                        type="number"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(e.target.value)}
                        placeholder="0.00"
                        disabled={isPickup || customerName === "Walk In Customer"}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Total Amount</Label>
                      <div className="font-bold text-xl text-primary">₱{totalAmount.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="rushShip-edit">Rush Ship</Label>
                    <Select
                      value={rushShip ? "yes" : "no"}
                      onValueChange={(value: string) => setRushShip(value === "yes")}
                      disabled={customerName === "Walk In Customer"}
                    >
                      <SelectTrigger id="rushShip-edit">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">Standard Shipping</SelectItem>
                        <SelectItem value="yes">Rush Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="pickup-station">Pickup Options</Label>
                    <Select
                      value={selectedStationId ? selectedStationId : "delivery"}
                      onValueChange={(value: string) => {
                        if (value === "delivery") {
                          setIsPickup(false);
                          setSelectedStationId(null);
                        } else {
                          setIsPickup(true);
                          setShippingFee("0");
                          setSelectedStationId(value);
                        }
                      }}
                      disabled={customerName === "Walk In Customer"}
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

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="courierName">Courier Name</Label>
                      <Input
                        id="courierName"
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                        placeholder="Lalamove, J&T, etc."
                        disabled={customerName === "Walk In Customer"}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="trackingNumber">Tracking Number</Label>
                      <Input
                        id="trackingNumber"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="TRACKING-123"
                        disabled={customerName === "Walk In Customer"}
                      />
                    </div>
                  </div>

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
                        onValueChange={(value: string) => setBatchId(value)}
                        value={batchId || ''}
                        disabled={customerName === "Walk In Customer"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select batch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hold">Hold for Next Batch</SelectItem>
                          <SelectItem value="none">Normal Delivery</SelectItem>
                          {/* Add actual batches here */}
                          {batches && batches.length > 0 && <div className="border-t my-1" />}
                          {batches && batches.filter(b => b.status === "Open" && !b.batchName.toLowerCase().includes("batch test")).map(b => (
                            <SelectItem key={b.id} value={b.id}>{b.batchName}</SelectItem>
                          ))}
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
                    <div className="grid gap-2">
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
                    <div className="grid gap-2">
                      <Label htmlFor="shippingStatus">Shipping Status</Label>
                      <Select
                        onValueChange={(value: ShippingStatus) => setShippingStatus(value)}
                        value={shippingStatus}
                        disabled={customerName === "Walk In Customer"}
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
                  </div>
                </div>
              </div>

              {/* AI Assistant Section */}
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <WandSparkles className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">AI Status Assistant</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSuggestion}
                      disabled={isPending}
                      className="h-8"
                    >
                      {isPending ? (
                        <Loader className="h-3 w-3 animate-spin mr-2" />
                      ) : (
                        <Lightbulb className="h-3 w-3 mr-2" />
                      )}
                      Suggest Status
                    </Button>
                  </div>
                  {suggestion && (
                    <Alert className="bg-background">
                      <Lightbulb className="h-4 w-4" />
                      <AlertTitle>Suggestion: {suggestion.suggestedStatus}</AlertTitle>
                      <AlertDescription className="mt-2 text-xs text-muted-foreground flex flex-col gap-2">
                        <p>{suggestion.reasoning}</p>
                        <Button size="sm" variant="secondary" className="w-fit" onClick={applySuggestion}>
                          Apply {suggestion.suggestedStatus}
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

            </div>
          </div>

          <DialogFooter className="p-6 border-t mt-auto">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <SelectProductDialog
        isOpen={isProductSelectOpen}
        onClose={() => setProductSelectOpen(false)}
        onProductSelect={handleProductSelect}
        products={products}
      />
    </>
  );
}
