
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CreateBatchDialog } from "./create-batch-dialog";
import type { Batch } from "@/lib/types";
import { format } from 'date-fns';
import { ViewBatchDialog } from "./view-batch-dialog";
import { EditBatchDialog } from "./edit-batch-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteBatch } from "../actions";

type BatchStatus = "Open" | "Closed" | "Delivered" | "Cancelled";

const statusStyles: Record<BatchStatus, string> = {
  Open: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  Closed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  Delivered: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

interface BatchesTableProps {
  batches: Batch[];
}

export default function BatchesTable({ batches: initialBatches }: BatchesTableProps) {
  const [batches, setBatches] = React.useState<Batch[]>(initialBatches);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [viewingBatch, setViewingBatch] = React.useState<Batch | null>(null);
  const [editingBatch, setEditingBatch] = React.useState<Batch | null>(null);

  React.useEffect(() => {
    let filtered = initialBatches;
    if (searchTerm) {
      filtered = filtered.filter(
        (batch) =>
          batch.batchName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((batch) => batch.status === statusFilter);
    }
    setBatches(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, initialBatches]);

  const paginatedBatches = batches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(batches.length / itemsPerPage);
  const isFiltered = searchTerm !== "" || statusFilter !== "all";
  const { toast } = useToast();

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete batch "${name}"?`)) return;

    try {
      const result = await deleteBatch(id);
      if (result.success) {
        toast({
          title: "Batch Deleted",
          description: `Batch "${name}" has been deleted successfully.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: result.error || "Could not delete batch.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    }
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between gap-2 p-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search batches..."
                className="pl-8 sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {isFiltered && (
              <Button variant="ghost" onClick={resetFilters}>
                Reset
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Batch
          </Button>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Name</TableHead>
                <TableHead>Manufacture Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Orders</TableHead>
                <TableHead className="text-right">Total Sales</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBatches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.batchName}</TableCell>
                  <TableCell>{format(new Date(batch.manufactureDate), "PPP")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyles[batch.status]}>
                      {batch.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{batch.totalOrders}</TableCell>
                  <TableCell className="text-right">₱{batch.totalSales.toFixed(2)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingBatch(batch)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingBatch(batch)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(batch.id, batch.batchName)} className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {paginatedBatches.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              No batches found.
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
      <CreateBatchDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
      <ViewBatchDialog
        isOpen={!!viewingBatch}
        onClose={() => setViewingBatch(null)}
        batch={viewingBatch}
      />
      <EditBatchDialog
        isOpen={!!editingBatch}
        onClose={() => setEditingBatch(null)}
        batch={editingBatch}
      />
    </>
  );
}
