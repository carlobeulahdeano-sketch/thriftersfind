
"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, PlusCircle, Search, X } from "lucide-react";
import type { Customer } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { CreateCustomerDialog } from "./create-customer-dialog";
import { EditCustomerDialog } from "./edit-customer-dialog";
import { ViewCustomerDialog } from "./view-customer-dialog";

interface CustomerTableProps {
  customers: Customer[];
  onCustomerAdded?: () => void;
}

type ActivityFilter = "all" | "active" | "inactive";

export default function CustomerTable({ customers: initialCustomers, onCustomerAdded }: CustomerTableProps) {
  const [customers, setCustomers] = React.useState<Customer[]>(initialCustomers);
  const [allCustomers, setAllCustomers] = React.useState<Customer[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activityFilter, setActivityFilter] = React.useState<ActivityFilter>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 7;
  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = React.useState<Customer | null>(null);


  React.useEffect(() => {
    setCustomers(initialCustomers);
    setAllCustomers(initialCustomers);
  }, [initialCustomers]);

  React.useEffect(() => {
    let filtered = allCustomers;

    if (activityFilter === "active") {
      filtered = filtered.filter(c => c.orderHistory && c.orderHistory.length > 0);
    } else if (activityFilter === "inactive") {
      filtered = filtered.filter(c => !c.orderHistory || c.orderHistory.length === 0);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setCustomers(filtered);
    setCurrentPage(1);
  }, [searchTerm, allCustomers, activityFilter]);

  const paginatedCustomers = customers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(customers.length / itemsPerPage);

  const isFiltered = searchTerm !== "" || activityFilter !== "all";

  const resetFilters = () => {
    setSearchTerm("");
    setActivityFilter("all");
  }

  return (
    <>
      <Card className="border-t-4 border-t-pink-500/50 shadow-sm">
        <div className="flex items-center justify-between gap-2 p-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers..."
                className="pl-8 sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={activityFilter} onValueChange={(value: string) => setActivityFilter(value as ActivityFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="active">Active Customers</SelectItem>
                <SelectItem value="inactive">Inactive Customers</SelectItem>
              </SelectContent>
            </Select>
            {isFiltered && (
              <Button variant="ghost" onClick={resetFilters}>
                Reset
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-pink-600 hover:bg-pink-700 text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-semibold">Customer</TableHead>
                <TableHead className="hidden md:table-cell font-semibold">Phone</TableHead>
                <TableHead className="hidden sm:table-cell font-semibold">Total Spent</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="grid gap-0.5">
                      <div className="font-medium text-pink-700 dark:text-pink-400">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {customer.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{customer.phone}</TableCell>
                  <TableCell className="hidden sm:table-cell font-medium">₱{customer.totalSpent?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingCustomer(customer)}>View details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingCustomer(customer)}>Edit</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {paginatedCustomers.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              No customers found.
            </div>
          )}
        </CardContent>
        <div className="flex items-center justify-between gap-4 p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
      <CreateCustomerDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        allCustomers={allCustomers}
        onCustomerAdded={onCustomerAdded}
      />
      <EditCustomerDialog
        isOpen={!!editingCustomer}
        onClose={() => setEditingCustomer(null)}
        customer={editingCustomer}
      />
      <ViewCustomerDialog
        isOpen={!!viewingCustomer}
        onClose={() => setViewingCustomer(null)}
        customer={viewingCustomer}
      />
    </>
  );
}
