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
    const [printingOrderId, setPrintingOrderId] = useState<string | number | null>(null);
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
        setPrintingOrderId(String(order.id));

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
                filename: `receipt-${String(order.id).substring(0, 7)}.pdf`,
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
                                        #{String(order.id).substring(0, 8)}
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
                <div className="opacity-0 pointer-events-none absolute -z-10">
                    <div id={`receipt-content-${selectedOrder.id}`} className="bg-white p-[40px] w-[210mm] min-h-[297mm] text-slate-800 font-sans mx-auto flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h1 className="text-4xl font-bold text-slate-700 tracking-tight">Official Receipt</h1>
                                <p className="text-slate-500 mt-1 font-medium italic">ThriftersFind Analytics Engine</p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2 justify-end mb-1">
                                    <div className="h-8 w-8 bg-slate-800 rounded flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">TF</span>
                                    </div>
                                    <span className="text-xl font-bold text-slate-700">ThriftersFind</span>
                                </div>
                                <p className="text-xs text-slate-400">Generated: {format(new Date(), "MMM dd, yyyy h:mm:ss a")}</p>
                            </div>
                        </div>

                        {/* Customer Details */}
                        <div className="bg-slate-50 p-6 mb-8 rounded-lg border border-slate-100 grid grid-cols-2 gap-8 text-sm">
                            <div>
                                <h3 className="text-slate-400 font-bold uppercase tracking-wider mb-2 text-[10px]">Billed To</h3>
                                <p className="font-bold text-slate-700 text-base">{selectedOrder.customerName}</p>
                                <p className="text-slate-500 mt-1 flex items-center gap-1">
                                    Contact: <span className="font-semibold text-slate-600">{selectedOrder.contactNumber || 'N/A'}</span>
                                </p>
                                <p className="text-slate-500 mt-1 flex items-center gap-1">
                                    Address: <span className="font-semibold text-slate-600">{selectedOrder.address || 'N/A'}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-slate-400 font-bold uppercase tracking-wider mb-2 text-[10px]">Transaction Context</h3>
                                <p className="text-slate-700 font-medium">Receipt #{String(selectedOrder.id).substring(0, 8).toUpperCase()}</p>
                                <p className="text-slate-400 text-xs mt-1">Status: {selectedOrder.paymentStatus} - {selectedOrder.shippingStatus}</p>
                            </div>
                        </div>

                        {/* Order Items Table */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-l-4 border-slate-800 pl-3">Order Items</h3>
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-800 text-white">
                                        <th className="py-3 px-4 text-left font-semibold rounded-tl-lg">Description</th>
                                        <th className="py-3 px-4 text-center font-semibold">Qty</th>
                                        <th className="py-3 px-4 text-right font-semibold">Unit Price</th>
                                        <th className="py-3 px-4 text-right font-semibold rounded-tr-lg">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(selectedOrder.items) ? (
                                        selectedOrder.items.map((item: any, idx: number) => (
                                            <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                                <td className="py-3 px-4 font-bold text-slate-700 align-top">{item.product?.name || item.productName || 'Unknown Product'}</td>
                                                <td className="py-3 px-4 text-slate-600 align-top text-center">{item.quantity}</td>
                                                <td className="py-3 px-4 text-slate-600 align-top text-right">₱{(item.product?.retailPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="py-3 px-4 text-right font-bold text-slate-800 align-top">₱{((item.product?.retailPrice || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr className="bg-white">
                                            <td className="py-3 px-4 font-bold text-slate-700 align-top">{selectedOrder.itemName || 'Unknown Product'}</td>
                                            <td className="py-3 px-4 text-slate-600 align-top text-center">{selectedOrder.quantity || 1}</td>
                                            <td className="py-3 px-4 text-slate-600 align-top text-right">₱{((selectedOrder.price) || ((selectedOrder.totalAmount - (selectedOrder.shippingFee || 0)) / (selectedOrder.quantity || 1))).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="py-3 px-4 text-right font-bold text-slate-800 align-top">₱{((selectedOrder.price ? (selectedOrder.price * selectedOrder.quantity) : (selectedOrder.totalAmount - (selectedOrder.shippingFee || 0)))).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary Section */}
                        <div className="flex justify-end mb-8">
                            <div className="w-64">
                                <div className="flex justify-between py-2 text-sm text-slate-600">
                                    <span>Subtotal</span>
                                    <span>₱{(selectedOrder.totalAmount - selectedOrder.shippingFee).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between py-2 text-sm text-slate-600">
                                    <span>Shipping Fee</span>
                                    <span>₱{selectedOrder.shippingFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between py-3 border-t-2 border-slate-800 mt-2 font-bold text-lg text-slate-800">
                                    <span>Total Amount</span>
                                    <span>₱{selectedOrder.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-auto pt-10 border-t border-slate-100 text-[10px] text-slate-300 flex justify-between items-center break-inside-avoid">
                            <p>© {new Date().getFullYear()} ThriftersFind Official Receipt</p>
                            <p className="flex items-center gap-2">
                                <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
                                Thank you for your purchase!
                                <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
                                Customer Copy
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
