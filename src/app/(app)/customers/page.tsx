
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import CustomerTable from "./components/customer-table";
import { getCustomers } from "./actions";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [hasCheckedPermission, setHasCheckedPermission] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) throw new Error('Auth failed');
        const { user } = await response.json();

        if (!user?.permissions?.customers) {
          setIsAuthorized(false);
        }

        if (user?.permissions?.customers) {
          const customerData = await getCustomers();
          setCustomers(customerData);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setHasCheckedPermission(true);
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleCustomerAdded = async () => {
    // Refresh the customers list after adding a new customer
    try {
      const updatedCustomers = await getCustomers();
      setCustomers(updatedCustomers);
    } catch (error) {
      console.error("Failed to refresh customers:", error);
    }
  };

  if (!hasCheckedPermission || isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit">Customers</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-lg text-muted-foreground">Loading customers...</div>
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
        <p className="text-muted-foreground">You do not have permission to view the customers database.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
            Customers
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer database
          </p>
        </div>
      </div>
      <CustomerTable
        customers={customers}
        onCustomerAdded={handleCustomerAdded}
      />
    </div>
  );
}
