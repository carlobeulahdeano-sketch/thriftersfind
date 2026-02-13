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
import { RecentSalesTable } from "./components/recent-sales-table";
import { Badge } from "@/components/ui/badge";
import { Order, ShippingStatus, PreOrder } from "@/lib/types";
import { getSalesData, getPreOrderSalesData } from "./actions";
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
type ViewType = "regular" | "preorder";

export default function SalesPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const [viewType, setViewType] = useState<ViewType>("regular");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allPreOrders, setAllPreOrders] = useState<PreOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      if (viewType === "regular") {
        const { orders, isAuthorized } = await getSalesData(timeframe);
        if (!isAuthorized) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }
        setIsAuthorized(true);
        setAllOrders(orders);
      } else {
        const { preOrders, isAuthorized } = await getPreOrderSalesData(timeframe);
        if (!isAuthorized) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }
        setIsAuthorized(true);
        setAllPreOrders(preOrders);
      }

      setIsLoading(false);
    };
    fetchData();
  }, [timeframe, viewType]);

  const handlePrint = () => {
    window.open(`/sales/report?timeframe=${timeframe}`, '_blank');
  };

  const salesMetrics = useMemo(() => {
    if (viewType === "regular") {
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
    } else {
      // Pre-order sales metrics
      const paidPreOrders = allPreOrders; // Already filtered for 'Paid' status

      let totalRevenue = 0;
      let totalCost = 0;
      const numberSales = paidPreOrders.length;

      paidPreOrders.forEach((preOrder: any) => {
        totalRevenue += preOrder.totalAmount || 0;

        const items = preOrder.items || [];
        items.forEach((item: any) => {
          const qty = item.quantity || 0;
          // Pre-order items don't have product cost, estimate using pricePerUnit * 0.5 or use 0
          const cost = 0; // We don't have cost data for pre-order items
          totalCost += qty * cost;
        });
      });

      const netIncome = totalRevenue - totalCost;

      // Convert pre-orders to Order-compatible format for components
      const deliveredOrders: Order[] = paidPreOrders.map((preOrder: any) => ({
        id: preOrder.id,
        customerName: preOrder.customerName,
        contactNumber: preOrder.contactNumber || "",
        address: preOrder.address || "",
        orderDate: preOrder.orderDate,
        itemName: preOrder.items?.map((item: any) => item.productName).join(", ") || "Pre-order items",
        items: preOrder.items?.map((item: any) => ({
          product: {
            id: "",
            name: item.productName,
            sku: "",
            description: "",
            quantity: item.quantity,
            totalStock: 0,
            alertStock: 0,
            cost: 0,
            retailPrice: item.pricePerUnit,
            images: item.images || []
          },
          quantity: item.quantity
        })) || [],
        quantity: preOrder.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
        price: preOrder.items?.[0]?.pricePerUnit || 0,
        shippingFee: 0,
        totalAmount: preOrder.totalAmount,
        paymentMethod: (preOrder.paymentMethod || "GCash") as any,
        paymentStatus: (preOrder.paymentStatus || "Paid") as any,
        shippingStatus: "Delivered" as any, // Treat paid pre-orders as delivered for display
        batchId: preOrder.batchId,
        customerId: preOrder.customerId,
        customerEmail: preOrder.customerEmail,
        rushShip: false,
        batch: preOrder.batch,
        createdAt: preOrder.createdAt
      }));

      return {
        totalRevenue,
        totalCost,
        netIncome,
        numberSales,
        deliveredOrders
      };
    }
  }, [allOrders, allPreOrders, viewType]);

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
            {viewType === "regular" ? "Sales" : "Pre-Order Sales"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {viewType === "regular"
              ? "Overview of your sales performance and metrics."
              : "Overview of your pre-order sales performance and metrics."}
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
          <Tabs value={viewType} onValueChange={(value) => setViewType(value as ViewType)}>
            <TabsList>
              <TabsTrigger value="regular">Regular Sales</TabsTrigger>
              <TabsTrigger value="preorder">Pre-Order Sales</TabsTrigger>
            </TabsList>
          </Tabs>
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
          <RecentSalesTable orders={salesMetrics.deliveredOrders} />
        </div>
      )
      }
    </div >
  );
}
