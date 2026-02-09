"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Printer, ShieldAlert } from "lucide-react";
import CourierChart from "./components/courier-chart";
import SalesChart from "./components/sales-chart";
import TopCustomersChart from "./components/top-customers-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Order, Customer } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { startOfWeek, startOfMonth, startOfYear, endOfToday, isWithinInterval } from "date-fns";
import { getCustomers } from "../customers/actions";
import { getSalesData } from "../sales/actions";

type Timeframe = "week" | "month" | "year";

export default function ReportsPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("year");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const fetchData = async () => {
      // For reports, we might want a larger range of data initially
      const { orders, isAuthorized } = await getSalesData("year");
      if (!isAuthorized) {
        setIsAuthorized(false);
        return;
      }
      setIsAuthorized(true);
      const customersData = await getCustomers();
      setAllOrders(orders);
      setAllCustomers(customersData);
    };
    fetchData();
  }, []);

  const filteredOrders = useMemo(() => {
    if (!allOrders) return { salesOrders: [], courierOrders: [] };

    const now = new Date();
    let startDate: Date;

    if (timeframe === 'week') {
      startDate = startOfWeek(now);
    } else if (timeframe === 'month') {
      startDate = startOfMonth(now);
    } else { // year
      startDate = startOfYear(now);
    }
    const endDate = endOfToday();

    const salesOrders = allOrders.filter(order => {
      const orderDate = (order.createdAt as any)?.seconds ? new Date((order.createdAt as any).seconds * 1000) : new Date(order.orderDate);
      return isWithinInterval(orderDate, { start: startDate, end: endDate }) && order.shippingStatus === 'Delivered';
    });

    const courierOrders = allOrders.filter(order => {
      const orderDate = (order.createdAt as any)?.seconds ? new Date((order.createdAt as any).seconds * 1000) : new Date(order.orderDate);
      return isWithinInterval(orderDate, { start: startDate, end: endDate }) && order.shippingStatus !== 'Cancelled';
    });

    return { salesOrders, courierOrders };
  }, [allOrders, timeframe]);

  const { salesOrders = [], courierOrders = [] } = filteredOrders || {};
  const customers = allCustomers || [];

  if (isAuthorized === false) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page. Restricted to Super Admins only.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-2" suppressHydrationWarning>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize transaction data and customer insights.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.open(`/reports/print?timeframe=${timeframe}`, '_blank')}>
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </div>

      <div className="grid gap-8">
        <Card className="border-t-4 border-t-pink-500/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sales Over Time</CardTitle>
              <CardDescription>Total sales from all orders for the selected period.</CardDescription>
            </div>
            {isMounted && (
              <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as Timeframe)} className="hidden sm:block">
                <TabsList>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="year">Year</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </CardHeader>
          <CardContent>
            {isMounted && (
              <>
                <div className="sm:hidden mb-4">
                  <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as Timeframe)} className="w-full">
                    <TabsList className="w-full">
                      <TabsTrigger value="week" className="flex-1">Week</TabsTrigger>
                      <TabsTrigger value="month" className="flex-1">Month</TabsTrigger>
                      <TabsTrigger value="year" className="flex-1">Year</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <SalesChart orders={salesOrders} timeframe={timeframe} />
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-t-4 border-t-pink-500/50 shadow-sm">
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Top 5 customers by total spending.</CardDescription>
            </CardHeader>
            <CardContent>
              {isMounted && <TopCustomersChart customers={customers} />}
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-pink-500/50 shadow-sm">
            <CardHeader>
              <CardTitle>Courier Usage</CardTitle>
              <CardDescription>Distribution of couriers used for shipments.</CardDescription>
            </CardHeader>
            <CardContent>
              {isMounted && <CourierChart orders={courierOrders} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
