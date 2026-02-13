"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import BatchesTable from "./components/batches-table";
import { getBatches } from "./actions";
import { ShieldAlert } from "lucide-react";
import type { Batch } from "@/lib/types";

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) throw new Error('Auth failed');
        const { user } = await response.json();

        if (!user?.permissions?.batches) {
          setIsAuthorized(false);
        } else {
          const { batches: batchesData, isAuthorized: authorized } = await getBatches();
          setBatches(batchesData);
          setIsAuthorized(authorized);
        }
      } catch (error) {
        console.error("Error fetching batches:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit">Batch Management</h1>
        </div>
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page. Please contact your administrator.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit">Batch Management</h1>
      </div>
      <BatchesTable
        batches={batches}
      />
    </div>
  );
}
