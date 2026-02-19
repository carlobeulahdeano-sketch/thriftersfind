
"use client";

import { useState, useEffect } from "react";
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
import { updateCustomer } from "../actions";

interface EditCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onCustomerUpdated?: () => void;
}

export function EditCustomerDialog({
  isOpen,
  onClose,
  customer,
  onCustomerUpdated,
}: EditCustomerDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setEmail(customer.email);
      setPhone(customer.phone);
      const { street, city, state, zip } = customer.address;
      setAddress([street, city, state, zip].filter(item => item && item !== 'N/A').join(', '));
    }
  }, [customer]);

  const handleSave = async () => {
    if (!customer) return;

    if (!name) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out name.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const addressParts = address.split(',').map(s => s.trim());
      const updatedData: Partial<Omit<Customer, 'id' | 'orderHistory' | 'totalSpent'>> = {
        name,
        email,
        phone,
        address: {
          street: addressParts[0] || 'N/A',
          city: addressParts[1] || 'N/A',
          state: addressParts[2] || 'N/A',
          zip: addressParts[3] || 'N/A',
        },
      };

      await updateCustomer(customer.id, updatedData);

      toast({
        title: "Customer Updated",
        description: `Customer ${name} has been successfully updated.`,
      });

      if (onCustomerUpdated) {
        onCustomerUpdated();
      }
      onClose();
    } catch (error: any) {
      console.error("Failed to update customer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update customer. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>
            Update the details for {customer.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, City, State, Zip Code"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
