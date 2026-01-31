
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Batch } from "@/lib/types";
import { format } from "date-fns";

interface ViewBatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch | null;
}

export function ViewBatchDialog({
  isOpen,
  onClose,
  batch,
}: ViewBatchDialogProps) {
  if (!batch) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{batch.batchName}</DialogTitle>
          <DialogDescription>
            Batch Details
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className="col-span-2 text-sm">{batch.status}</p>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">Manufacture Date</p>
            <p className="col-span-2 text-sm text-bold">{format(new Date(batch.manufactureDate), "PPP")}</p>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
            <p className="col-span-2 text-sm font-bold">{batch.totalOrders}</p>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
            <p className="col-span-2 text-sm font-bold">₱{batch.totalSales.toFixed(2)}</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
