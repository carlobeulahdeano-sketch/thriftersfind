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
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import type { SalesLog } from "@prisma/client";
import { getSalesLogs, GetSalesLogsResult } from "@/actions/sales-logs";

export default function SalesLogsTable() {
    const [logsData, setLogsData] = React.useState<GetSalesLogsResult>({
        logs: [],
        totalLogs: 0,
        totalPages: 1,
        currentPage: 1
    });
    const [loading, setLoading] = React.useState(true);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [selectedLog, setSelectedLog] = React.useState<SalesLog | null>(null);
    const [isDetailsOpen, setDetailsOpen] = React.useState(false);

    const fetchLogs = async (page: number) => {
        setLoading(true);
        try {
            const result = await getSalesLogs(page, 10);
            setLogsData(result);
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchLogs(currentPage);
    }, [currentPage]);

    const handleRefresh = () => {
        fetchLogs(currentPage);
    }

    const handleViewDetails = (log: SalesLog) => {
        setSelectedLog(log);
        setDetailsOpen(true);
    }

    const formatJSON = (data: any) => {
        if (!data) return "N/A";
        try {
            return JSON.stringify(data, null, 2);
        } catch (e) {
            return "Invalid JSON";
        }
    }

    const formatCurrency = (amount: number | null) => {
        if (amount === null || amount === undefined) return "-";
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
    }

    const renderOrderItems = (items: any) => {
        if (!items) return <p className="text-sm text-muted-foreground">N/A</p>;
        let data = items;
        if (typeof items === 'string') {
            try {
                data = JSON.parse(items);
            } catch (e) {
                return <p className="text-sm text-red-500">Invalid JSON data</p>;
            }
        }

        if (!Array.isArray(data)) {
            return (
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[200px]">
                    {JSON.stringify(data, null, 2)}
                </pre>
            );
        }

        if (data.length === 0) {
            return <p className="text-sm text-muted-foreground">No items</p>;
        }

        return (
            <div className="space-y-3 border rounded-md p-3">
                {data.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start border-b pb-2 last:border-0 last:pb-0 last:mb-0">
                        <div className="flex-1 mr-4">
                            <p className="text-sm font-medium">{item.product?.name || "Unknown Product"}</p>
                            <p className="text-xs text-muted-foreground">SKU: {item.product?.sku || "N/A"}</p>
                        </div>
                        <div className="text-right whitespace-nowrap">
                            <p className="text-sm font-medium">x{item.quantity}</p>
                            {item.product?.cost !== undefined && (
                                <p className="text-xs text-muted-foreground">
                                    {formatCurrency(item.product.cost)}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    const renderShipments = (shipments: any) => {
        if (!shipments) return <p className="text-sm text-muted-foreground">N/A</p>;
        let data = shipments;
        if (typeof shipments === 'string') {
            try {
                data = JSON.parse(shipments);
            } catch (e) {
                return <p className="text-sm text-red-500">Invalid JSON data</p>;
            }
        }

        // According to orders/actions.ts:
        // shipmentsJson = JSON.stringify({
        //     address: orderData.address,
        //     courier: orderData.courierName,
        //     tracking: orderData.trackingNumber,
        //     shippingFee: orderData.shippingFee
        // });

        return (
            <div className="space-y-2 border rounded-md p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <span className="font-medium text-muted-foreground block text-xs">Courier</span>
                        <span>{data.courier || "N/A"}</span>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground block text-xs">Tracking Number</span>
                        <span>{data.tracking || "N/A"}</span>
                    </div>
                    <div className="col-span-2">
                        <span className="font-medium text-muted-foreground block text-xs">Address</span>
                        <span className="break-words">{data.address || "N/A"}</span>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground block text-xs">Shipping Fee</span>
                        <span>{formatCurrency(data.shippingFee)}</span>
                    </div>
                </div>
            </div>
        )
    }

    const renderOrderSnapshot = (snapshot: any) => {
        if (!snapshot) return <p className="text-sm text-muted-foreground">N/A</p>;
        let data = snapshot;
        if (typeof snapshot === 'string') {
            try {
                data = JSON.parse(snapshot);
            } catch (e) {
                return <p className="text-sm text-red-500">Invalid JSON data</p>;
            }
        }

        return (
            <div className="space-y-2 border rounded-md p-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <span className="font-medium text-muted-foreground block text-xs">Order ID</span>
                        <span>{data.id || "N/A"}</span>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground block text-xs">Dates</span>
                        <span>{data.orderDate ? new Date(data.orderDate).toLocaleDateString() : "N/A"}</span>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground block text-xs">Payment</span>
                        <span>{data.paymentMethod} ({data.paymentStatus})</span>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground block text-xs">Shipping Status</span>
                        <span>{data.shippingStatus}</span>
                    </div>
                    <div className="col-span-2">
                        <span className="font-medium text-muted-foreground block text-xs">Created By</span>
                        <span>{data.createdBy?.name || "System"} ({data.createdBy?.email || "N/A"})</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <Card className="border-t-4 border-t-pink-500/50 shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Sales Logs</CardTitle>
                            <CardDescription>View all sales activities and history.</CardDescription>
                        </div>
                        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[180px] font-semibold">Date</TableHead>
                                <TableHead className="font-semibold">Customer</TableHead>
                                <TableHead className="font-semibold">Reference</TableHead>
                                <TableHead className="font-semibold">Products</TableHead>
                                <TableHead className="font-semibold">Description</TableHead>
                                <TableHead className="text-right font-semibold">Total Amount</TableHead>
                                <TableHead className="text-right font-semibold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10">
                                        Loading logs...
                                    </TableCell>
                                </TableRow>
                            ) : logsData.logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                        No logs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logsData.logs.map((log) => (
                                    <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDetails(log)}>
                                        <TableCell className="font-mono text-xs">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium">{log.customerName || "-"}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">{log.orderId || log.preOrderId || "-"}</span>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={log.products || ""}>
                                            {log.products || "-"}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={log.description || ""}>
                                            {log.description || "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(log.totalAmount)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Details</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <div className="flex items-center justify-between gap-4 p-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        Page {logsData.currentPage} of {logsData.totalPages} ({logsData.totalLogs} logs)
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(logsData.totalPages, p + 1))}
                            disabled={currentPage === logsData.totalPages || loading}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </Card>

            <Dialog open={isDetailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Sales Log Details</DialogTitle>
                        <DialogDescription>
                            {selectedLog?.id}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="flex-1 overflow-y-auto pr-4">
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium mb-1">Customer</h4>
                                        <p className="text-sm text-muted-foreground">{selectedLog.customerName || "N/A"}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">Total Amount</h4>
                                        <p className="text-sm text-muted-foreground">{formatCurrency(selectedLog.totalAmount)}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">Date</h4>
                                        <p className="text-sm text-muted-foreground">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <h4 className="font-medium mb-1">Description</h4>
                                        <p className="text-sm text-muted-foreground">{selectedLog.description}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <h4 className="font-medium mb-1">Products (Action)</h4>
                                        <p className="text-sm text-muted-foreground">{selectedLog.products}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 border-t pt-4">
                                    <div>
                                        <h4 className="font-medium mb-2">Order Items</h4>
                                        <div className="max-h-[300px] overflow-y-auto border rounded-md">
                                            {renderOrderItems(selectedLog.order_items)}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">Shipments</h4>
                                        {renderShipments(selectedLog.shipments)}
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">Orders Snapshot</h4>
                                        {renderOrderSnapshot(selectedLog.orders)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
