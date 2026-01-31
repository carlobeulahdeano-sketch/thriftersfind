
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Batch } from "@/lib/types";
import { createBatch } from "../actions";
import { useRouter } from "next/navigation";

interface CreateBatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type BatchStatus = "Open" | "Closed" | "Delivered" | "Cancelled";

export function CreateBatchDialog({ isOpen, onClose }: CreateBatchDialogProps) {
  const { toast } = useToast();

  const [batchName, setBatchName] = useState("");
  const [manufactureDate, setManufactureDate] = useState("");
  const [status, setStatus] = useState<BatchStatus>("Open");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const resetForm = () => {
    setBatchName("");
    setManufactureDate("");
    setStatus("Open");
  };

  const handleSave = async () => {
    if (!batchName || !manufactureDate) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all fields.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createBatch({
        batchName,
        manufactureDate,
        status,
      });

      if (result.success) {
        toast({
          title: "Batch Created",
          description: `Batch "${batchName}" has been created successfully.`,
        });
        resetForm();
        onClose();
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to create batch.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Batch</DialogTitle>
          <DialogDescription>
            Create a new delivery batch cycle.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="batchName">Batch Name</Label>
            <Input id="batchName" value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="manufactureDate">Manufacture Date</Label>
            <Input id="manufactureDate" type="date" value={manufactureDate} onChange={(e) => setManufactureDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: BatchStatus) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Batch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
