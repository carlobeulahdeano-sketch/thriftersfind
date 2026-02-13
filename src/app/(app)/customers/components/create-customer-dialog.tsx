
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
import { Customer } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { createCustomer } from "../actions";

interface CreateCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  allCustomers: Customer[];
  onCustomerAdded?: () => void;
}

export function CreateCustomerDialog({
  isOpen,
  onClose,
  allCustomers,
  onCustomerAdded,
}: CreateCustomerDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
  };

  const handleSave = async () => {
    if (!name) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out name.",
      });
      return;
    }

    try {
      const addressParts = address.split(',').map(s => s.trim());

      const newCustomerData: Omit<Customer, 'id'> = {
        name,
        email,
        phone,
        avatar: '',
        address: {
          street: addressParts[0] || 'N/A',
          city: addressParts[1] || 'N/A',
          state: addressParts[2] || 'N/A',
          zip: addressParts[3] || 'N/A'
        },
        orderHistory: [],
        totalSpent: 0
      };

      await createCustomer(newCustomerData);

      onClose();
      toast({
        title: "Customer Created",
        description: `Customer ${newCustomerData.name} has been successfully created.`,
      });
      resetForm();

      // Notify parent component to refresh the list
      if (onCustomerAdded) {
        onCustomerAdded();
      }
    } catch (error) {
      console.error("Failed to create customer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create customer. Please try again.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        {/* Gradient Header */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-lg flex items-center px-6">
          <div className="flex items-center gap-3 text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <DialogTitle className="text-white text-lg font-semibold">Add New Customer</DialogTitle>
              <DialogDescription className="text-indigo-100 text-sm">
                Fill in the details below to add a new customer
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content with top padding for header */}
        <div className="pt-12">
          {/* Customer Information Section */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-semibold text-sm">Customer Information</h3>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white dark:bg-gray-950"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white dark:bg-gray-950"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Contact Number
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09XX-XXX-XXXX"
                  className="bg-white dark:bg-gray-950"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address" className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Address
                </Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State"
                  className="bg-white dark:bg-gray-950"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              Add Customer
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
