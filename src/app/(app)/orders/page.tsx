"use client";

import { useEffect, useState } from "react";
import OrderTable from "./components/order-table";
import { getOrders } from "./actions";
import { getCustomers } from "../customers/actions";
import { getProducts } from "../inventory/actions";
import { getStations } from "../stations/actions";
import { getBatches } from "../batches/actions";
import type { Order, Customer, Product, Batch } from "@/lib/types";
import type { Station } from "../stations/actions";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAuthorized, setIsAuthorized] = useState(true);
  const [hasCheckedPermission, setHasCheckedPermission] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const { user } = await response.json();

        if (!user?.permissions?.orders) {
          setIsAuthorized(false);
          return;
        }

        const [ordersData, customersData, productsData, stationsData, batchesData] = await Promise.all([
          getOrders(),
          getCustomers(),
          getProducts(),
          getStations(),
          getBatches(),
        ]);
        setOrders(ordersData);
        setCustomers(customersData);
        setProducts(productsData);
        setStations(stationsData);
        setBatches(batchesData.batches);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setHasCheckedPermission(true);
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (!hasCheckedPermission || isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit">Orders</h1>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <svg className="h-10 w-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view orders.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit">Orders</h1>
      </div>
      <OrderTable
        orders={orders}
        customers={customers}
        products={products}
        stations={stations}
        batches={batches}
      />
    </div>
  );
}
