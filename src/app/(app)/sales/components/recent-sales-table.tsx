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
import { FileText, Printer, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Order } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface RecentSalesTableProps {
    orders: Order[];
}

export function RecentSalesTable({ orders }: RecentSalesTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const { toast } = useToast();
    const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Reset to first page when orders change (e.g. timeframe change)
    useEffect(() => {
        setCurrentPage(1);
    }, [orders]);

    const totalPages = Math.ceil(orders.length / itemsPerPage);

    const paginatedOrders = orders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePrintReceipt = async (order: Order) => {
        setSelectedOrder(order);
        setPrintingOrderId(order.id);

        toast({
            title: "Generating PDF...",
            description: "Please wait while we prepare your receipt.",
        });

        // Small delay to allow state to settle and DOM to render the hidden receipt
        setTimeout(async () => {
            const element = document.getElementById(`receipt-content-${order.id}`);
            if (!element) {
                setPrintingOrderId(null);
                setSelectedOrder(null);
                return;
            }

            const opt = {
                margin: 10,
                filename: `receipt-${order.id.substring(0, 7)}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
            };

            try {
                // @ts-ignore
                const html2pdf = (await import('html2pdf.js')).default;
                const pdfBlobUrl = await html2pdf().set(opt).from(element).output('bloburl');
                window.open(pdfBlobUrl, '_blank');
            } catch (error) {
                console.error("PDF generation failed", error);
                toast({
                    variant: "destructive",
                    title: "PDF Error",
                    description: "Failed to generate receipt PDF.",
                });
            } finally {
                setPrintingOrderId(null);
                setSelectedOrder(null);
            }
        }, 500);
    };

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
                                <TableHead className="text-right font-semibold">Actions</TableHead>
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
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handlePrintReceipt(order)}
                                            disabled={printingOrderId === order.id}
                                        >
                                            {printingOrderId === order.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                                            ) : (
                                                <Printer className="h-4 w-4 text-purple-500" />
                                            )}
                                        </Button>
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

            {/* Hidden Receipt Content for PDF Generation */}
            {selectedOrder && (
                <div className="hidden">
                    <div id={`receipt-content-${selectedOrder.id}`} style={{ padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <h1 style={{ margin: '0', fontSize: '24px' }}>ThriftersFind</h1>
                            <p style={{ margin: '5px 0', color: '#666' }}>Official Receipt</p>
                        </div>

                        <div style={{ marginBottom: '20px', fontSize: '14px' }}>
                            <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                            <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                            <p><strong>Customer:</strong> {selectedOrder.customerName}</p>
                            <p><strong>Address:</strong> {selectedOrder.address || 'N/A'}</p>
                            <p><strong>Contact:</strong> {selectedOrder.contactNumber || 'N/A'}</p>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                                    <th style={{ padding: '10px', textAlign: 'left' }}>Item</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Qty</th>
                                    <th style={{ padding: '10px', textAlign: 'right' }}>Price</th>
                                    <th style={{ padding: '10px', textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedOrder.items?.map((item: any, idx: number) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>{item.product?.name || item.productName || 'Unknown Product'}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ padding: '10px', textAlign: 'right' }}>₱{(item.product?.retailPrice || 0).toFixed(2)}</td>
                                        <td style={{ padding: '10px', textAlign: 'right' }}>₱{((item.product?.retailPrice || 0) * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ textAlign: 'right', fontSize: '14px' }}>
                            <p style={{ margin: '5px 0' }}>Shipping Fee: ₱{selectedOrder.shippingFee.toFixed(2)}</p>
                            <p style={{ margin: '10px 0', fontSize: '18px', fontWeight: 'bold' }}>Total Amount: ₱{selectedOrder.totalAmount.toFixed(2)}</p>
                        </div>

                        <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
                            <p>Thank you for your purchase!</p>
                            <p>ThriftersFind Analytics Engine Generated Receipt</p>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
