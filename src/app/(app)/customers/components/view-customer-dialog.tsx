"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Customer, YearlyOrderSummary } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { useMemo, useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCustomerOrdersByYear } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  DollarSign,
  Calendar,
  Package,
  TrendingUp,
  CreditCard,
  Truck,
  Filter,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { toggleCustomerStatus } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ViewCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onCustomerUpdated?: () => void;
}

export function ViewCustomerDialog({
  isOpen,
  onClose,
  customer,
  onCustomerUpdated,
}: ViewCustomerDialogProps) {
  const { toast } = useToast();
  const router = useRouter();

  const fullAddress = useMemo(() => {
    if (!customer?.address) return 'N/A';
    const { street, city, state, zip } = customer.address;
    return [street, city, state, zip].filter(val => val && val !== 'N/A').join(', ');
  }, [customer]);

  const [isOrderHistoryModalOpen, setIsOrderHistoryModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [yearlyOrders, setYearlyOrders] = useState<YearlyOrderSummary[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const availableYears = useMemo(() => {
    if (!customer?.orderHistory) return [];
    const years = [...new Set(customer.orderHistory.map(order => order.year))];
    return years.sort((a, b) => b - a);
  }, [customer]);

  useEffect(() => {
    if (isOrderHistoryModalOpen && customer) {
      setIsLoadingOrders(true);
      const yearFilter = selectedYear === "all" ? undefined : parseInt(selectedYear);
      getCustomerOrdersByYear(customer.id, yearFilter)
        .then(data => {
          setYearlyOrders(data);
        })
        .finally(() => {
          setIsLoadingOrders(false);
        });
    }
  }, [isOrderHistoryModalOpen, customer, selectedYear]);

  const handleToggleStatus = async () => {
    if (!customer) return;
    const newStatus = !customer.isActive;

    const success = await toggleCustomerStatus(customer.id, newStatus);

    if (success) {
      toast({
        title: `Customer marked as ${newStatus ? 'active' : 'inactive'}`,
      });
      if (onCustomerUpdated) {
        onCustomerUpdated();
      } else {
        router.refresh();
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update customer status",
      });
    }
  };

  if (!customer) return null;

  const totalOrders = customer.orderHistory?.reduce((sum, item) => sum + item.orderCount, 0) || 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-white">
          {/* Enhanced Header - ThriftersFind Blue */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#4A90E2] via-[#5B9FED] to-[#4A90E2]" />
            <div className="relative p-6">
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 ring-4 ring-white shadow-xl">
                    <AvatarImage src={customer.avatar || `https://ui-avatars.com/api/?name=${customer.name}&background=random`} />
                    <AvatarFallback className="text-2xl bg-white text-[#4A90E2]">
                      {customer.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-bold text-white mb-1">
                      {customer.name}
                    </DialogTitle>
                    <DialogDescription className="text-blue-100 text-base">
                      Customer Profile & Information
                    </DialogDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2 pr-2">
                    <Badge
                      variant={customer.isActive !== false ? "outline" : "secondary"}
                      className={customer.isActive !== false
                        ? "bg-green-500 text-white border-green-400"
                        : "bg-red-500 text-white border-red-400"
                      }
                    >
                      {customer.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full border border-white/30">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Status</span>
                      <Switch
                        checked={customer.isActive !== false}
                        onCheckedChange={handleToggleStatus}
                        className="scale-75 data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-red-400"
                      />
                    </div>
                  </div>
                </div>
              </DialogHeader>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 px-6 -mt-4">
            <div className="bg-gradient-to-br from-blue-50 to-[#E3F2FD] rounded-xl p-4 border-2 border-[#4A90E2]/30 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#4A90E2] flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-[#4A90E2] font-medium">Total Spent</p>
                  <p className="text-xl font-bold text-[#2C5F8D]">₱{customer.totalSpent?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-[#E3F2FD] rounded-xl p-4 border-2 border-[#4A90E2]/30 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#5B9FED] flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-[#4A90E2] font-medium">Total Orders</p>
                  <p className="text-xl font-bold text-[#2C5F8D]">{totalOrders}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="px-6 py-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
              Contact Information
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-[#4A90E2]/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#4A90E2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 font-medium">Email Address</p>
                  <p className="text-sm text-slate-900 truncate">{customer.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 font-medium">Phone Number</p>
                  <p className="text-sm text-slate-900">{customer.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 font-medium">Address</p>
                  <p className="text-sm text-slate-900">{fullAddress}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order History Section */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Purchase History
                </h3>
                <p className="text-xs text-slate-500 mt-1">View all orders and transactions</p>
              </div>
              <Button
                onClick={() => {
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                  setIsOrderHistoryModalOpen(true);
                }}
                className="bg-gradient-to-r from-[#4A90E2] to-[#5B9FED] hover:from-[#3A7FC2] hover:to-[#4A90E2] text-white shadow-lg"
              >
                <Package className="w-4 h-4 mr-2" />
                View History
              </Button>
            </div>
          </div>

          <DialogFooter className="px-6 pb-6">
            <Button onClick={onClose} variant="outline" className="w-full h-11 border-2">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order History Modal */}
      <Dialog open={isOrderHistoryModalOpen} onOpenChange={setIsOrderHistoryModalOpen}>
        <DialogContent className="sm:max-w-6xl h-[85vh] flex flex-col p-0 overflow-hidden bg-white">
          {/* Enhanced Header - ThriftersFind Blue */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#4A90E2] via-[#5B9FED] to-[#4A90E2]" />
            <div className="relative p-6">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-white">
                      Order History - {customer.name}
                    </DialogTitle>
                    <DialogDescription className="text-blue-100 text-base mt-1">
                      Complete purchase history grouped by year
                    </DialogDescription>
                  </div>
                </div>

                {/* Year Filter */}
                <div className="flex items-center gap-3 mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-white" />
                    <label className="text-sm font-medium text-white">Filter by Year:</label>
                  </div>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[180px] bg-white border-0 h-9">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </DialogHeader>
            </div>
          </div>

          {/* Orders Display */}
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-6 pb-4">
              {isLoadingOrders ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-[#E3F2FD] flex items-center justify-center mb-4 animate-pulse">
                    <Package className="w-8 h-8 text-[#4A90E2]" />
                  </div>
                  <p className="text-base text-slate-600 font-medium">Loading orders...</p>
                </div>
              ) : yearlyOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <ShoppingBag className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-lg font-medium text-slate-700 mb-1">No orders found</p>
                  <p className="text-sm text-slate-500">This customer hasn't placed any orders yet</p>
                </div>
              ) : (
                yearlyOrders.map((yearData) => (
                  <Card key={yearData.year} className="border-2 border-slate-200 shadow-sm overflow-hidden">
                    {/* Year Summary Header */}
                    <CardHeader className="bg-gradient-to-r from-[#E3F2FD] to-blue-50 border-b-2 border-[#4A90E2]/30 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#4A90E2] flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-slate-900">{yearData.year}</CardTitle>
                            <p className="text-sm text-slate-600 mt-0.5">Annual Summary</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-right">
                            <p className="text-xs text-slate-600 font-medium">Total Orders</p>
                            <p className="text-lg font-bold text-[#4A90E2]">{yearData.totalOrders}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-600 font-medium">Total Revenue</p>
                            <p className="text-lg font-bold text-[#5B9FED]">₱{yearData.totalSpent.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Orders Table */}
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                              <TableHead className="font-semibold text-slate-700">Order ID</TableHead>
                              <TableHead className="font-semibold text-slate-700">Items</TableHead>
                              <TableHead className="font-semibold text-slate-700">Payment</TableHead>
                              <TableHead className="font-semibold text-slate-700">Status</TableHead>
                              <TableHead className="font-semibold text-slate-700">Amount</TableHead>
                              <TableHead className="font-semibold text-slate-700">Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {yearData.orders.map((order) => (
                              <TableRow key={order.orderId} className="hover:bg-slate-50">
                                <TableCell>
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {order.orderId.substring(0, 8)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-[300px]">
                                  <p className="truncate text-sm" title={order.items}>
                                    {order.items}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm">{order.paymentMethod}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      order.shippingStatus === 'Delivered' && "bg-green-50 text-green-700 border-green-200",
                                      order.shippingStatus === 'Shipped' && "bg-blue-50 text-blue-700 border-blue-200",
                                      order.shippingStatus === 'Pending' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                                      order.shippingStatus === 'Cancelled' && "bg-red-50 text-red-700 border-red-200"
                                    )}
                                  >
                                    <Truck className="w-3 h-3 mr-1" />
                                    {order.shippingStatus}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-semibold text-slate-900">
                                  ₱{order.amount.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-sm text-slate-600">
                                  {new Date(order.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 pb-6 border-t bg-slate-50">
            <Button
              onClick={() => setIsOrderHistoryModalOpen(false)}
              className="w-full h-11 bg-gradient-to-r from-[#4A90E2] to-[#5B9FED] hover:from-[#3A7FC2] hover:to-[#4A90E2] text-white shadow-lg font-semibold"
            >
              Close History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}