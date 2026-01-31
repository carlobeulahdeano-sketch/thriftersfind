"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, TrendingUp, Package, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Order } from "@/lib/types";
import { startOfWeek, startOfMonth, startOfYear, endOfToday, isWithinInterval } from "date-fns";

import { getSalesData } from "./actions";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import Link from "next/link";

type Timeframe = "week" | "month" | "year";

export default function SalesPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await getSalesData(timeframe);
      setAllOrders(data);
      setIsLoading(false);
    };
    fetchData();
  }, [timeframe]);

  const filteredOrders = allOrders; // Filtering is now done on the server

  const handlePrint = () => {
    window.open(`/sales/report?timeframe=${timeframe}`, '_blank');
  };

  const salesMetrics = useMemo(() => {
    const paidOrders = filteredOrders; // getSalesData already filters for Paid orders

    const totalSales = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = paidOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Top selling products
    const productMap = new Map<string, { name: string; sales: number; quantity: number; orders: number }>();
    paidOrders.forEach(order => {
      const existing = productMap.get(order.itemName) || { name: order.itemName, sales: 0, quantity: 0, orders: 0 };
      existing.sales += order.totalAmount;
      existing.quantity += order.quantity;
      existing.orders += 1;
      productMap.set(order.itemName, existing);
    });
    const topProducts = Array.from(productMap.values()).sort((a, b) => b.sales - a.sales).slice(0, 5);

    // Sales by payment method
    const paymentMap = new Map<string, { method: string; sales: number; count: number }>();
    paidOrders.forEach(order => {
      const existing = paymentMap.get(order.paymentMethod) || { method: order.paymentMethod, sales: 0, count: 0 };
      existing.sales += order.totalAmount;
      existing.count += 1;
      paymentMap.set(order.paymentMethod, existing);
    });
    const paymentMethods = Array.from(paymentMap.values());

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      topProducts,
      paymentMethods,
    };
  }, [filteredOrders]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
          <Link href="/sales/batches">
            <Button>
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
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₱{salesMetrics.totalSales.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">For this {timeframe}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesMetrics.totalOrders}</div>
                <p className="text-xs text-muted-foreground">Paid orders for this {timeframe}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱{salesMetrics.averageOrderValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Per order for this {timeframe}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Product</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesMetrics.topProducts[0]?.name || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  ₱{salesMetrics.topProducts[0]?.sales.toLocaleString() || '0'} sales
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesMetrics.topProducts.map((product) => (
                      <TableRow key={product.name}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-right">{product.orders}</TableCell>
                        <TableCell className="text-right">{product.quantity}</TableCell>
                        <TableCell className="text-right">₱{product.sales.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {salesMetrics.topProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                          No sales data for this period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales by Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesMetrics.paymentMethods.map((method) => (
                      <TableRow key={method.method}>
                        <TableCell className="font-medium">{method.method}</TableCell>
                        <TableCell className="text-right">{method.count}</TableCell>
                        <TableCell className="text-right">₱{method.sales.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {salesMetrics.paymentMethods.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                          No payment data for this period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
