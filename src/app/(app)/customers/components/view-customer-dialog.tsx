
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
import { Customer, YearlyOrderSummary } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { useMemo, useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCustomerOrdersByYear } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ViewCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export function ViewCustomerDialog({
  isOpen,
  onClose,
  customer,
}: ViewCustomerDialogProps) {

  const fullAddress = useMemo(() => {
    if (!customer?.address) return 'N/A';
    const { street, city, state, zip } = customer.address;
    return [street, city, state, zip].filter(val => val && val !== 'N/A').join(', ');
  }, [customer]);

  const [isOrderHistoryModalOpen, setIsOrderHistoryModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [yearlyOrders, setYearlyOrders] = useState<YearlyOrderSummary[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Get available years from customer order history
  const availableYears = useMemo(() => {
    if (!customer?.orderHistory) return [];
    const years = [...new Set(customer.orderHistory.map(order => order.year))];
    return years.sort((a, b) => b - a);
  }, [customer]);

  // Fetch orders when dialog opens or year changes
  useEffect(() => {
    if (isOrderHistoryModalOpen && customer) {
      setIsLoadingOrders(true);
      const yearFilter = selectedYear === "all" ? undefined : parseInt(selectedYear);
      getCustomerOrdersByYear(customer.id, yearFilter)
        .then(data => {
          setYearlyOrders(data);
        })
        .finally(() => {
          setIsLoadingOrders(false);
        });
    }
  }, [isOrderHistoryModalOpen, customer, selectedYear]);

  if (!customer) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{customer.name}</DialogTitle>
            <DialogDescription>
              Customer Details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="col-span-2 text-sm">{customer.email}</p>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="col-span-2 text-sm">{customer.phone || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p className="col-span-2 text-sm">{fullAddress}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-3 items-center gap-4">
              <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
              <p className="col-span-2 text-sm font-bold">₱{customer.totalSpent?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="grid grid-cols-3 items-start gap-4">
              <p className="text-sm font-medium text-muted-foreground pt-1">Order History</p>
              <div className="col-span-2">
                <Button onClick={() => setIsOrderHistoryModalOpen(true)} variant="outline">View Order History</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isOrderHistoryModalOpen} onOpenChange={setIsOrderHistoryModalOpen}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Order History for {customer.name}</DialogTitle>
            <DialogDescription>
              View purchase history grouped by year
            </DialogDescription>
          </DialogHeader>

          {/* Year Filter */}
          <div className="flex items-center gap-4 py-2">
            <label className="text-sm font-medium">Filter by Year:</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Orders Display */}
          <div className="max-h-[500px] overflow-y-auto space-y-6">
            {isLoadingOrders ? (
              <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
            ) : yearlyOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No orders found</div>
            ) : (
              yearlyOrders.map((yearData) => (
                <div key={yearData.year} className="space-y-3">
                  {/* Year Summary Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{yearData.year}</span>
                        <div className="flex gap-6 text-sm font-normal text-muted-foreground">
                          <span>Orders: <strong className="text-foreground">{yearData.totalOrders}</strong></span>
                          <span>Total: <strong className="text-foreground">₱{yearData.totalSpent.toFixed(2)}</strong></span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {yearData.orders.map((order) => (
                            <TableRow key={order.orderId}>
                              <TableCell className="font-mono text-xs">{order.orderId.substring(0, 7)}...</TableCell>
                              <TableCell className="max-w-[300px] truncate" title={order.items}>{order.items}</TableCell>
                              <TableCell>{order.paymentMethod}</TableCell>
                              <TableCell>{order.shippingStatus}</TableCell>
                              <TableCell>₱{order.amount.toFixed(2)}</TableCell>
                              <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsOrderHistoryModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
