"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { Order } from "@/lib/types";

interface RecentSalesTableProps {
    orders: Order[];
}

export function RecentSalesTable({ orders }: RecentSalesTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset to first page when orders change (e.g. timeframe change)
    useEffect(() => {
        setCurrentPage(1);
    }, [orders]);

    const totalPages = Math.ceil(orders.length / itemsPerPage);

    const paginatedOrders = orders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <Card className="border-t-4 border-t-purple-500/50 shadow-lg overflow-hidden">
            <CardHeader className="border-b bg-muted/30 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-500" />
                    Recent Sales Transactions
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-semibold h-12">Order ID</TableHead>
                                <TableHead className="font-semibold">Customer</TableHead>
                                <TableHead className="font-semibold">Date</TableHead>
                                <TableHead className="font-semibold">Items</TableHead>
                                <TableHead className="text-right font-semibold">Total Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedOrders.map((order) => (
                                <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-mono text-xs text-muted-foreground uppercase">
                                        #{order.id.substring(0, 8)}
                                    </TableCell>
                                    <TableCell className="font-medium text-foreground">
                                        {order.customerName}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {format(new Date(order.orderDate), "MMM dd, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {Array.isArray(order.items) ? (
                                                order.items.map((item: any, i: number) => (
                                                    <Badge key={i} variant="secondary" className="text-[10px] py-0">
                                                        {item.product?.name || item.productName} (x{item.quantity})
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-sm">{order.itemName} (x{order.quantity})</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-foreground">
                                        ₱{order.totalAmount.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {orders.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground h-32">
                                        No transactions found for this period
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {orders.length > 0 && (
                    <div className="flex items-center justify-between p-4 border-t bg-muted/10">
                        <p className="text-xs text-muted-foreground">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                            {Math.min(currentPage * itemsPerPage, orders.length)} of {orders.length} transactions
                        </p>
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
                )}
            </CardContent>
        </Card>
    );
}
