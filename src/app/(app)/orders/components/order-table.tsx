
"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, PlusCircle, Search, Calendar as CalendarIcon, X, MessageCircle } from "lucide-react";
import type { Order, PaymentStatus, ShippingStatus, Customer, PaymentMethod, Batch, OrderRemark, Product } from "@/lib/types";
import { Station } from "../../stations/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EditOrderDialog } from "./edit-order-dialog";
import { CreateOrderDialog } from "./create-order-dialog";
import { SendSmsDialog } from "./send-sms-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateOrder, cancelOrder } from "../actions";
import { ViewOrderDialog } from "./view-order-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const paymentStatusStyles: Record<PaymentStatus, string> = {
  Hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  Paid: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  Unpaid: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  "PAID PENDING": "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
};

const shippingStatusStyles: Record<ShippingStatus, string> = {
  Pending: "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300",
  Ready: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300",
  Shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  Delivered: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  Claimed: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  "Rush Ship": "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
};

const paymentStatuses: PaymentStatus[] = ["Hold", "Paid", "Unpaid", "PAID PENDING"];
const shippingStatuses: ShippingStatus[] = ["Pending", "Ready", "Shipped", "Delivered", "Claimed", "Cancelled", "Rush Ship"];
const paymentMethods: PaymentMethod[] = ["COD", "GCash", "Bank Transfer"];
const remarks: OrderRemark[] = ["PLUS Branch 1", "PLUS Branch 2", "PLUS Warehouse"];

interface OrderTableProps {
  orders: Order[];
  customers: Customer[];
  products: Product[];
  stations: Station[];
  batches: Batch[];
}

export default function OrderTable({ orders, customers, products, stations, batches }: OrderTableProps) {
  const router = useRouter();
  const [filteredOrders, setFilteredOrders] = React.useState<Order[]>(orders);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = React.useState<string>("all");
  const [shippingStatusFilter, setShippingStatusFilter] = React.useState<string>("all");
  const [batchFilter, setBatchFilter] = React.useState<string>("all");
  const [dateFilter, setDateFilter] = React.useState<DateRange | undefined>(undefined);

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 7;
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [viewOrder, setViewOrder] = React.useState<Order | null>(null);
  const [orderToCancel, setOrderToCancel] = React.useState<Order | null>(null);
  const [isCancelDialogOpen, setCancelDialogOpen] = React.useState(false);

  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [isSmsDialogOpen, setSmsDialogOpen] = React.useState(false);
  const [orderForSms, setOrderForSms] = React.useState<Order | null>(null);
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null);

  React.useEffect(() => {
    let newFilteredOrders = orders;

    if (paymentStatusFilter !== "all") {
      newFilteredOrders = newFilteredOrders.filter(order => order.paymentStatus === paymentStatusFilter);
    }
    if (shippingStatusFilter !== "all") {
      if (shippingStatusFilter === "Rush Ship") {
        newFilteredOrders = newFilteredOrders.filter(order => order.rushShip);
      } else {
        newFilteredOrders = newFilteredOrders.filter(order => order.shippingStatus === shippingStatusFilter);
      }
    }
    if (batchFilter !== "all") {
      if (batchFilter === 'unassigned') {
        newFilteredOrders = newFilteredOrders.filter(order => !order.batchId && order.paymentStatus !== 'Hold');
      } else {
        newFilteredOrders = newFilteredOrders.filter(order => order.batchId === batchFilter);
      }
    }
    if (dateFilter?.from) {
      newFilteredOrders = newFilteredOrders.filter(order => {
        const orderDate = new Date(order.orderDate);
        if (dateFilter.to) {
          return orderDate >= dateFilter.from! && orderDate <= dateFilter.to;
        }
        return orderDate.toDateString() === dateFilter.from!.toDateString();
      });
    }


    if (searchTerm) {
      newFilteredOrders = newFilteredOrders.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(newFilteredOrders);
    setCurrentPage(1);
  }, [searchTerm, paymentStatusFilter, shippingStatusFilter, batchFilter, dateFilter, orders]);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const isFiltered = searchTerm !== "" || paymentStatusFilter !== "all" || shippingStatusFilter !== "all" || batchFilter !== "all" || dateFilter !== undefined;

  const resetFilters = () => {
    setSearchTerm("");
    setPaymentStatusFilter("all");
    setShippingStatusFilter("all");
    setBatchFilter("all");
    setDateFilter(undefined);
  };

  const handleMarkAsReceived = async (order: Order) => {
    setIsUpdating(order.id);
    try {
      await updateOrder(order.id, {
        paymentStatus: "Paid",
        shippingStatus: "Delivered",
      });
      toast({
        title: "Order Updated",
        description: `Order #${order.id.substring(0, 7)} marked as received.`,
      });
      router.refresh(); // Ensure the UI updates immediately
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    const orderId = orderToCancel.id;
    setIsUpdating(orderId);
    try {
      await cancelOrder(orderId);
      toast({
        title: "Order Cancelled",
        description: `Order #${orderId.substring(0, 7)} and its items have been returned to stock.`,
      });
      router.refresh(); // Ensure the UI updates immediately
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: error.message,
      });
    } finally {
      setIsUpdating(null);
      setOrderToCancel(null);
      setCancelDialogOpen(false);
    }
  };

  const openCancelDialog = (order: Order) => {
    setOrderToCancel(order);
    setCancelDialogOpen(true);
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between gap-2 p-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search orders..."
                className="pl-8 sm:w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {batches?.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.batchName} ({format(new Date(b.manufactureDate), 'MMM d')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                {paymentStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={shippingStatusFilter} onValueChange={setShippingStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Shipping Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shipping</SelectItem>
                {shippingStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !dateFilter && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter?.from ? (
                    dateFilter.to ? (
                      <>
                        {format(dateFilter.from, "LLL dd, y")} -{" "}
                        {format(dateFilter.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateFilter.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Filter by date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {isFiltered && (
              <Button variant="ghost" onClick={resetFilters}>
                Reset
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Shipping</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.substring(0, 7)}...</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{order.customerName}</span>
                      {order.batch && (
                        <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <CalendarIcon className="h-2.5 w-2.5" />
                          {order.batch.batchName} ({format(new Date(order.batch.manufactureDate), 'MMM d')})
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={paymentStatusStyles[order.paymentStatus]}>
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={shippingStatusStyles[order.shippingStatus]}>
                      {order.shippingStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">₱{order.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewOrder(order)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                            Edit Order
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleMarkAsReceived(order)}
                            disabled={isUpdating === order.id || order.shippingStatus === 'Delivered' || order.shippingStatus === 'Cancelled'}
                          >
                            Mark as Received
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openCancelDialog(order)}
                            disabled={isUpdating === order.id || order.shippingStatus === 'Cancelled' || order.shippingStatus === 'Delivered'}
                            className="text-red-600 focus:text-red-600"
                          >
                            Cancel Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setOrderForSms(order);
                          setSmsDialogOpen(true);
                        }}
                        title="Send SMS"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="sr-only">Send SMS</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {paginatedOrders.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              No orders found.
            </div>
          )}
        </CardContent>
        <div className="flex items-center justify-between gap-4 p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <EditOrderDialog
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        customers={customers}
        products={products}
        stations={stations}
        batches={batches}
      />

      <ViewOrderDialog
        isOpen={!!viewOrder}
        onClose={() => setViewOrder(null)}
        order={viewOrder}
      />

      <CreateOrderDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        customers={customers}
        products={products}
        stations={stations}
        batches={batches}
      />

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel order #{orderToCancel?.id.substring(0, 7)} and return all items back to inventory stock. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancelOrder();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!!isUpdating}
            >
              {isUpdating ? "Processing..." : "Yes, Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SendSmsDialog
        isOpen={isSmsDialogOpen}
        onClose={() => setSmsDialogOpen(false)}
        order={orderForSms}
      />
    </>
  );
}
