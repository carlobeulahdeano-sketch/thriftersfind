
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
import { Switch } from "@/components/ui/switch";
import { toggleCustomerStatus, deleteCustomer } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CustomerTableProps {
  customers: Customer[];
  onCustomerAdded?: () => void;
}

type ActivityFilter = "all" | "active" | "inactive";

export default function CustomerTable({ customers: initialCustomers, onCustomerAdded }: CustomerTableProps) {
  const { toast } = useToast();
  const [customers, setCustomers] = React.useState<Customer[]>(initialCustomers);
  const [allCustomers, setAllCustomers] = React.useState<Customer[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activityFilter, setActivityFilter] = React.useState<ActivityFilter>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 7;
  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = React.useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = React.useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);


  React.useEffect(() => {
    setCustomers(initialCustomers);
    setAllCustomers(initialCustomers);
  }, [initialCustomers]);

  React.useEffect(() => {
    let filtered = allCustomers;

    if (activityFilter === "active") {
      filtered = filtered.filter(c => c.isActive !== false);
    } else if (activityFilter === "inactive") {
      filtered = filtered.filter(c => c.isActive === false);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
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
    setActivityFilter("all");
  }

  const handleToggleStatus = async (customerId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // Optimistic update
    setAllCustomers(prev => prev.map(c =>
      c.id === customerId ? { ...c, isActive: newStatus } : c
    ));

    const success = await toggleCustomerStatus(customerId, newStatus);

    if (success) {
      toast({
        title: `Customer marked as ${newStatus ? 'active' : 'inactive'}`,
      });
      if (onCustomerAdded) onCustomerAdded();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update customer status",
      });
      // Rollback
      setAllCustomers(prev => prev.map(c =>
        c.id === customerId ? { ...c, isActive: currentStatus } : c
      ));
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;

    setIsDeleting(true);
    try {
      const result = await deleteCustomer(deletingCustomer.id);

      if (result.success) {
        toast({
          title: "Customer deleted",
          description: result.message,
        });
        if (onCustomerAdded) onCustomerAdded();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsDeleting(false);
      setDeletingCustomer(null);
    }
  };

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
                <TableHead className="font-semibold text-center">Status</TableHead>
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
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <Badge
                        variant={customer.isActive !== false ? "outline" : "secondary"}
                        className={customer.isActive !== false
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                        }
                      >
                        {customer.isActive !== false ? "Active" : "Inactive"}
                      </Badge>
                      <Switch
                        checked={customer.isActive !== false}
                        onCheckedChange={() => handleToggleStatus(String(customer.id), customer.isActive !== false)}
                        className="scale-75 data-[state=checked]:bg-green-600"
                      />
                    </div>
                  </TableCell>
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
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600" 
                          onClick={() => setDeletingCustomer(customer)}
                        >
                          Delete
                        </DropdownMenuItem>
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
        onCustomerUpdated={onCustomerAdded}
      />
      <ViewCustomerDialog
        isOpen={!!viewingCustomer}
        onClose={() => setViewingCustomer(null)}
        customer={viewingCustomer}
      />
      
      <AlertDialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer
              <strong> {deletingCustomer?.name}</strong> and remove their data from our servers.
              <br /><br />
              <span className="text-amber-600 font-medium italic text-xs">
                Note: Deletion will be blocked if the customer has existing orders or pre-orders.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteCustomer();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Customer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
