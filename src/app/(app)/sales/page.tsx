"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PhilippinePeso,
  TrendingUp,
  Package,
  ShoppingCart,
  ShieldAlert,
  Printer,
  Loader2,
  ArrowUpRight,
  Target,
  FileText
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Order, ShippingStatus } from "@/lib/types";
import { getSalesData } from "./actions";
import { format } from "date-fns";

// Dynamically import charts to disable SSR
const SalesChart = dynamic(() => import("../reports/components/sales-chart"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[350px] text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  ),
});

type Timeframe = "week" | "month" | "year";

export default function SalesPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { orders, isAuthorized } = await getSalesData(timeframe);
      if (!isAuthorized) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }
      setIsAuthorized(true);
      setAllOrders(orders);
      setIsLoading(false);
    };
    fetchData();
  }, [timeframe]);

  const handlePrint = () => {
    window.open(`/sales/report?timeframe=${timeframe}`, '_blank');
  };

  const salesMetrics = useMemo(() => {
    const deliveredOrders = allOrders.filter((order: any) => order.shippingStatus === 'Delivered');

    let totalRevenue = 0;
    let totalCost = 0;
    const numberSales = deliveredOrders.length;

    deliveredOrders.forEach((order: any) => {
      totalRevenue += order.totalAmount || 0;

      const items = Array.isArray(order.items)
        ? order.items
        : (typeof order.items === 'string' ? JSON.parse(order.items) : []);

      items.forEach((item: any) => {
        const qty = item.quantity || 0;
        const cost = item.product?.cost || 0;
        totalCost += qty * cost;
      });
    });

    const netIncome = totalRevenue - totalCost;

    return {
      totalRevenue,
      totalCost,
      netIncome,
      numberSales,
      deliveredOrders
    };
  }, [allOrders]);

  if (isAuthorized === false) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
            Sales
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of your sales performance and metrics.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
          <Link href="/sales/batches">
            <Button className="bg-pink-600 hover:bg-pink-700 text-white">
              View Batch Analytics
            </Button>
          </Link>
          <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as Timeframe)}>
            <TabsList>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
              <TabsTrigger value="year">This Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Stats Cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="relative overflow-hidden border-l-4 border-l-cyan-400 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 to-transparent dark:from-cyan-950/20 dark:to-transparent" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Net Income</CardTitle>
                <div className="h-10 w-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">
                  ₱{salesMetrics.netIncome.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 font-medium">
                  <ArrowUpRight className="h-3 w-3" />
                  Profit after costs
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-l-4 border-l-pink-400 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 to-transparent dark:from-pink-950/20 dark:to-transparent" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</CardTitle>
                <div className="h-10 w-10 rounded-xl bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PhilippinePeso className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-pink-700 dark:text-pink-300">
                  ₱{salesMetrics.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Total sales value</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-l-4 border-l-purple-400 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20 dark:to-transparent" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Number of Sales</CardTitle>
                <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingCart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{salesMetrics.numberSales}</div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Total delivered orders</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-t-4 border-t-pink-500/50 shadow-lg overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-pink-500" />
                Revenue Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <SalesChart orders={salesMetrics.deliveredOrders} timeframe={timeframe} />
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card className="border-t-4 border-t-purple-500/50 shadow-lg overflow-hidden">
            <CardHeader className="border-b bg-muted/30 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                Recent Sales Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-semibold h-12">Order ID</TableHead>
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Items</TableHead>
                      <TableHead className="text-right font-semibold">Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesMetrics.deliveredOrders
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-mono text-xs text-muted-foreground uppercase">
                            #{order.id.substring(0, 8)}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {order.customerName}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(order.orderDate), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(order.items) ? (
                                order.items.map((item: any, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-[10px] py-0">
                                    {item.product?.name || item.productName} (x{item.quantity})
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm">{order.itemName} (x{order.quantity})</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">
                            ₱{order.totalAmount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    {salesMetrics.deliveredOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground h-32">
                          No transactions found for this period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {salesMetrics.deliveredOrders.length > itemsPerPage && (
                <div className="flex items-center justify-between p-4 border-t bg-muted/10">
                  <p className="text-xs text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, salesMetrics.deliveredOrders.length)} of {salesMetrics.deliveredOrders.length} transactions
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(salesMetrics.deliveredOrders.length / itemsPerPage), p + 1))}
                      disabled={currentPage === Math.ceil(salesMetrics.deliveredOrders.length / itemsPerPage)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
