"use client";

import { useState, useEffect } from "react";
import { InventoryLog, Branch } from "@/lib/types";
import { getInventoryLogs } from "../actions";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Loader2, Search } from "lucide-react";

interface InventoryLogsTableProps {
    branches: Branch[];
}

export function InventoryLogsTable({ branches }: InventoryLogsTableProps) {
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [branchId, setBranchId] = useState<string>("all");
    const [action, setAction] = useState<string>("all");

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await getInventoryLogs(page, 10, {
                search,
                branchId: branchId === "all" ? undefined : branchId,
                action: action === "all" ? undefined : action,
            });
            if (res.success && res.data) {
                setLogs(res.data as any);
                setTotalPages(res.totalPages || 1);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, branchId, action]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search product..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Button variant="outline" onClick={fetchLogs}>
                        Refresh
                    </Button>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <Select value={branchId} onValueChange={(val: string) => { setBranchId(val); setPage(1); }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Branch" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Branches</SelectItem>
                            {branches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={action} onValueChange={(val: string) => { setAction(val); setPage(1); }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Action" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Actions</SelectItem>
                            <SelectItem value="STOCK_IN">Stock In</SelectItem>
                            <SelectItem value="STOCK_OUT">Stock Out</SelectItem>
                            <SelectItem value="SOLD">Sold</SelectItem>
                            <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                            <SelectItem value="TRANSFER">Transfer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Product</TableHead>
                            <TableHead className="font-semibold">Action</TableHead>
                            <TableHead className="font-semibold">Change</TableHead>
                            <TableHead className="font-semibold">Branch</TableHead>
                            <TableHead className="font-semibold">User</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No logs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {log.product?.name || log.warehouseProduct?.productName || "Unknown Product"}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {log.product?.sku || log.warehouseProduct?.sku}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{log.action}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={
                                                log.quantityChange > 0
                                                    ? "text-green-600 font-medium"
                                                    : "text-red-600 font-medium"
                                            }
                                        >
                                            {log.quantityChange > 0 ? "+" : ""}
                                            {log.quantityChange}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                            (bal: {log.newStock})
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {log.branch ? (
                                            <Badge variant="secondary">{log.branch.name}</Badge>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{log.user?.name || "System"}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
