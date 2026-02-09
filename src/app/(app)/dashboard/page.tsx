"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PhilippinePeso, Users, ShoppingCart, Archive, Package, Loader2, TrendingUp, ArrowUpRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamically import charts to disable SSR and prevent hydration mismatches
const SalesChart = dynamic(() => import("../reports/components/sales-chart"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  ),
});

const BatchesChart = dynamic(() => import("./components/batches-chart"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  ),
});

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrintButton } from "./components/print-button";
import { ShippingStatus, Order, Customer, Batch } from "@/lib/types";
import { startOfWeek, startOfMonth, startOfYear, endOfToday, isWithinInterval, format } from "date-fns";
import { getBatches } from "../batches/actions";
import { getAllOrders } from "../orders/actions";
import { ViewOrderDialog } from "../orders/components/view-order-dialog";
import { ViewBatchItemsDialog } from "./components/view-batch-items-dialog";
import { ViewHeldOrdersDialog } from "./components/view-held-orders-dialog";
import { ViewNewCustomersDialog } from "./components/view-new-customers-dialog";

const shippingStatusStyles: Record<ShippingStatus, string> = {
  Pending: "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300",
  Ready: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300",
  Shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  Delivered: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  Claimed: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  "Rush Ship": "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
};

type Timeframe = "week" | "month" | "year";

const ITEMS_PER_PAGE = 5;

export default function DashboardPage() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [viewBatch, setViewBatch] = useState<Batch | null>(null);
  const [isHeldOrdersDialogOpen, setIsHeldOrdersDialogOpen] = useState(false);
  const [isNewCustomersDialogOpen, setIsNewCustomersDialogOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [topSalesPage, setTopSalesPage] = useState(1);
  const [recentSalesPage, setRecentSalesPage] = useState(1);

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { orders, isAuthorized: ordersAuthorized } = await getAllOrders();

        if (!ordersAuthorized) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        setAllOrders(orders);

        const customersResponse = await fetch('/api/customers');
        if (!customersResponse.ok) throw new Error('Failed to fetch customers');
        const customersData = await customersResponse.json();
        setAllCustomers(customersData.success ? customersData.data : []);

        const { batches, isAuthorized: batchesAuthorized } = await getBatches();

        if (!batchesAuthorized) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        setAllBatches(batches);
        setIsAuthorized(true);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const heldOrders = allOrders.filter(order => order.paymentStatus === 'Hold');

  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    if (timeframe === 'week') {
      startDate = startOfWeek(now);
    } else if (timeframe === 'month') {
      startDate = startOfMonth(now);
    } else {
      startDate = startOfYear(now);
    }
    const endDate = endOfToday();

    const filteredOrders = allOrders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return isWithinInterval(orderDate, { start: startDate, end: endDate });
    });

    const filteredCustomers = allCustomers.filter(customer => {
      const firstOrder = (customer.orderHistory || []).reduce((earliest, current) => {
        if (!earliest) return current;
        return new Date(current.date) < new Date(earliest.date) ? current : earliest;
      }, null as { date: string } | null);

      if (!firstOrder) return false;

      const creationDate = new Date(firstOrder.date);
      return isWithinInterval(creationDate, { start: startDate, end: endDate });
    });

    const filteredBatches = allBatches.filter(batch => {
      if (!batch.manufactureDate) return false;
      const batchDate = new Date(batch.manufactureDate);
      return isWithinInterval(batchDate, { start: startDate, end: endDate });
    });

    return { orders: filteredOrders, customers: filteredCustomers, batches: filteredBatches };

  }, [timeframe, allOrders, allCustomers, allBatches]);

  useEffect(() => {
    setTopSalesPage(1);
    setRecentSalesPage(1);
  }, [timeframe]);

  const batchSummary = useMemo(() => {
    return allBatches.reduce((acc, batch) => {
      if (batch.status === 'Open') acc.open++;
      if (batch.status === 'Closed') acc.closed++;
      if (batch.status === 'Delivered') acc.completed++;
      return acc;
    }, { open: 0, closed: 0, completed: 0 });
  }, [allBatches]);

  const { orders: filteredOrders, customers: filteredCustomers, batches: filteredBatches } = filteredData;
  const deliveredOrders = filteredOrders.filter((order: any) => order.shippingStatus === 'Delivered');

  const topSales = useMemo(() => {
    const salesByProduct: Record<string, { id: string, itemName: string, quantity: number, totalAmount: number }> = {};

    deliveredOrders.forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
          const name = item.product?.name || item.productName || "Unknown Item";
          const price = item.product?.retailPrice || item.product?.cost || 0;
          const amount = item.quantity * price;

          if (!salesByProduct[name]) {
            salesByProduct[name] = { id: name, itemName: name, quantity: 0, totalAmount: 0 };
          }
          salesByProduct[name].quantity += item.quantity;
          salesByProduct[name].totalAmount += amount;
        });
      } else {
        const name = order.itemName;
        if (!salesByProduct[name]) {
          salesByProduct[name] = { id: name, itemName: name, quantity: 0, totalAmount: 0 };
        }
        salesByProduct[name].quantity += order.quantity;
        salesByProduct[name].totalAmount += order.totalAmount;
      }
    });

    return Object.values(salesByProduct)
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [deliveredOrders]);

  const paginatedTopSales = useMemo(() => {
    return topSales.slice((topSalesPage - 1) * ITEMS_PER_PAGE, topSalesPage * ITEMS_PER_PAGE);
  }, [topSales, topSalesPage]);

  const topSalesTotalPages = Math.ceil(topSales.length / ITEMS_PER_PAGE);

  const topBatches = useMemo(() => {
    return [...filteredBatches].sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0)).slice(0, 5);
  }, [filteredBatches]);

  const recentSalesList = useMemo(() => {
    return allOrders
      .flatMap(order => {
        if (order.items && order.items.length > 0) {
          const itemsArray = Array.isArray(order.items) ? order.items : (typeof order.items === 'string' ? JSON.parse(order.items) : []);
          return itemsArray.map((item: any, index: number) => ({
            id: `${order.id}-${index}`,
            itemName: item.product?.name || item.productName || "Unknown Item",
            quantity: item.quantity,
            totalAmount: item.quantity * (item.product?.retailPrice || item.product?.cost || 0),
            shippingStatus: order.shippingStatus,
            customerName: order.customerName,
            orderDate: order.orderDate
          }));
        } else {
          return [{
            id: order.id,
            itemName: order.itemName,
            quantity: order.quantity,
            totalAmount: order.totalAmount,
            shippingStatus: order.shippingStatus,
            customerName: order.customerName,
            orderDate: order.orderDate
          }];
        }
      })
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [allOrders]);

  const paginatedRecentSales = useMemo(() => {
    return recentSalesList.slice((recentSalesPage - 1) * ITEMS_PER_PAGE, recentSalesPage * ITEMS_PER_PAGE);
  }, [recentSalesList, recentSalesPage]);

  const recentSalesTotalPages = Math.ceil(recentSalesList.length / ITEMS_PER_PAGE);

  const batchOrders = useMemo(() => {
    if (!viewBatch) return [];
    return allOrders.filter(o => o.batchId === viewBatch.id);
  }, [viewBatch, allOrders]);

  const totalSales = deliveredOrders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
  const totalOrders = deliveredOrders.length;
  const newCustomers = filteredCustomers.length;
  const heldOrdersCount = heldOrders.length;

  if (loading) {
    return (
      <div className="flex flex-col gap-8 p-4 lg:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit">Dashboard</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading dashboard data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8 p-4 lg:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit">Dashboard</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <p className="text-red-600 font-medium">Failed to load dashboard data</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent pb-1">
            Dashboard
          </h1>
          <p className="text-base text-muted-foreground">
            Overview of your store's performance
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
          <PrintButton />
          <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as Timeframe)} className="w-full md:w-auto">
            <TabsList className="grid w-full grid-cols-3 md:w-auto h-11">
              <TabsTrigger value="week" className="text-sm font-medium">Week</TabsTrigger>
              <TabsTrigger value="month" className="text-sm font-medium">Month</TabsTrigger>
              <TabsTrigger value="year" className="text-sm font-medium">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-l-4 border-l-cyan-400 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 to-transparent dark:from-cyan-950/20 dark:to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Sales</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PhilippinePeso className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">
              ₱{totalSales.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              For this {timeframe}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-pink-400 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 to-transparent dark:from-pink-950/20 dark:to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Orders</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingCart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-pink-700 dark:text-pink-300">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              For this {timeframe}
            </p>
          </CardContent>
        </Card>

        <Card
          className="relative overflow-hidden border-l-4 border-l-purple-400 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
          onClick={() => setIsNewCustomersDialogOpen(true)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20 dark:to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">New Customers</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{newCustomers}</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              For this {timeframe}
            </p>
          </CardContent>
        </Card>

        <Card
          className="relative overflow-hidden border-l-4 border-l-orange-400 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
          onClick={() => setIsHeldOrdersDialogOpen(true)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20 dark:to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Held Orders</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Archive className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">{heldOrdersCount}</div>
            <p className="text-xs text-muted-foreground mt-2">Total orders on hold</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-t-4 border-t-cyan-500/50 shadow-lg overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-500" />
              Sales Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <SalesChart orders={deliveredOrders || []} timeframe={timeframe} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-t-4 border-t-pink-500/50 shadow-lg overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-pink-500" />
              Top Batches
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <BatchesChart
              batches={topBatches}
              height={350}
              onBatchClick={(batch) => setViewBatch(batch)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Tables Section */}
      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-lg border-t-4 border-t-purple-500/50 overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              Top Sales (By Item)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold h-12">Item Name</TableHead>
                    <TableHead className="text-right font-semibold">Quantity</TableHead>
                    <TableHead className="text-right font-semibold">Total Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTopSales.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 font-bold text-sm">
                            {(topSalesPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </div>
                          <span className="text-cyan-700 dark:text-cyan-400">{item.itemName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                      <TableCell className="text-right font-bold text-foreground">₱{item.totalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {paginatedTopSales.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground h-32">
                        <div className="flex flex-col items-center gap-2">
                          <ShoppingCart className="h-8 w-8 opacity-30" />
                          <span>No sales data for this period</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {topSales.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between gap-4 p-4 border-t bg-muted/10">
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  Page {topSalesPage} of {topSalesTotalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setTopSalesPage((p) => Math.max(1, p - 1))}
                    disabled={topSalesPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setTopSalesPage((p) => Math.min(topSalesTotalPages, p + 1))}
                    disabled={topSalesPage === topSalesTotalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-lg border-t-4 border-t-emerald-500/50 overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Recent Sales
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold h-12">Item</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    return paginatedRecentSales.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="font-medium text-pink-600 dark:text-pink-400 text-sm">{item.itemName}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                            <div className="font-medium">{item.customerName}</div>
                            <div className="opacity-70">{item.orderDate ? format(new Date(item.orderDate), "MMM dd, yyyy") : "N/A"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${shippingStatusStyles[item.shippingStatus as ShippingStatus]} text-xs`}>
                            {item.shippingStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-bold text-sm">₱{item.totalAmount.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">{item.quantity} pcs</div>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                  {recentSalesList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground h-32">
                        <div className="flex flex-col items-center gap-2">
                          <ShoppingCart className="h-8 w-8 opacity-30" />
                          <span>No recent sales</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {recentSalesList.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between gap-4 p-4 border-t bg-muted/10">
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  Page {recentSalesPage} of {recentSalesTotalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setRecentSalesPage((p) => Math.max(1, p - 1))}
                    disabled={recentSalesPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setRecentSalesPage((p) => Math.min(recentSalesTotalPages, p + 1))}
                    disabled={recentSalesPage === recentSalesTotalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Batch Summary Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-1 w-12 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 rounded-full" />
          <h2 className="text-2xl font-bold tracking-tight">Batch Summary</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden border-l-4 border-l-blue-500 bg-gradient-to-br from-white via-blue-50/30 to-blue-100/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-blue-900/10 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">Open Batches</p>
                  <p className="text-4xl font-bold text-blue-700 dark:text-blue-300">{batchSummary.open}</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                  <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-l-4 border-l-yellow-500 bg-gradient-to-br from-white via-yellow-50/30 to-yellow-100/20 dark:from-gray-900 dark:via-yellow-950/20 dark:to-yellow-900/10 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">Closed Batches</p>
                  <p className="text-4xl font-bold text-yellow-700 dark:text-yellow-300">{batchSummary.closed}</p>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/50 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                  <Package className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-l-4 border-l-green-500 bg-gradient-to-br from-white via-green-50/30 to-green-100/20 dark:from-gray-900 dark:via-green-950/20 dark:to-green-900/10 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">Completed Batches</p>
                  <p className="text-4xl font-bold text-green-700 dark:text-green-300">{batchSummary.completed}</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/50 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                  <Package className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ViewOrderDialog
        isOpen={!!viewOrder}
        onClose={() => setViewOrder(null)}
        order={viewOrder}
      />

      <ViewBatchItemsDialog
        isOpen={!!viewBatch}
        onClose={() => setViewBatch(null)}
        batch={viewBatch}
        batchOrders={batchOrders}
      />

      <ViewHeldOrdersDialog
        isOpen={isHeldOrdersDialogOpen}
        onClose={() => setIsHeldOrdersDialogOpen(false)}
        orders={heldOrders}
      />

      <ViewNewCustomersDialog
        isOpen={isNewCustomersDialogOpen}
        onClose={() => setIsNewCustomersDialogOpen(false)}
        customers={filteredCustomers}
        timeframe={timeframe}
      />
    </div>
  );
}