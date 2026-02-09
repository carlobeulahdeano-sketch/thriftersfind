import * as React from "react";
import BatchesTable from "./components/batches-table";
import { getBatches } from "./actions";
import { ShieldAlert } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function BatchesPage() {
  const { batches, isAuthorized } = await getBatches();

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
        <h1 className="text-3xl font-bold tracking-tight">Batch Management</h1>
      </div>
      <BatchesTable
        batches={batches}
      />
    </div>
  );
}
