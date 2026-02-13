
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
  onSuccess?: (batch: Batch) => void;
}

type BatchStatus = "Open" | "Closed";

export function CreateBatchDialog({ isOpen, onClose, onSuccess }: CreateBatchDialogProps) {
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
        if (onSuccess && result.data) {
          onSuccess(result.data);
        }
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
      <DialogContent className="sm:max-w-2xl">
        {/* Gradient Header */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-lg flex items-center px-6">
          <div className="flex items-center gap-3 text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <div>
              <DialogTitle className="text-white text-lg font-semibold">Add New Batch</DialogTitle>
              <DialogDescription className="text-blue-100 text-sm">
                Create a new delivery batch cycle
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content with top padding for header */}
        <div className="pt-12">
          {/* Batch Information Section */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-semibold text-sm">Batch Information</h3>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="batchName" className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Batch Name
                </Label>
                <Input
                  id="batchName"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="Enter batch name"
                  className="bg-white dark:bg-gray-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="manufactureDate" className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Manufacture Date
                  </Label>
                  <Input
                    id="manufactureDate"
                    type="date"
                    value={manufactureDate}
                    onChange={(e) => setManufactureDate(e.target.value)}
                    className="bg-white dark:bg-gray-950"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status" className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status
                  </Label>
                  <Select value={status} onValueChange={(value: BatchStatus) => setStatus(value)}>
                    <SelectTrigger className="bg-white dark:bg-gray-950">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {isSubmitting ? "Creating..." : "Create Batch"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
