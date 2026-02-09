"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Printer, X, Download, ShieldAlert } from "lucide-react";
import { Order, Customer } from "@/lib/types";
import { getCustomers } from "../../customers/actions";
import { getSalesData } from "../../sales/actions";
import { startOfWeek, startOfMonth, startOfYear, endOfToday, isWithinInterval, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SalesChart from "../components/sales-chart";
import CourierChart from "../components/courier-chart";
import TopCustomersChart from "../components/top-customers-chart";

function PrintReportContent() {
    const searchParams = useSearchParams();
    const timeframe = (searchParams.get("timeframe") as "week" | "month" | "year") || "month";
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const { orders, isAuthorized } = await getSalesData("year");
            if (!isAuthorized) {
                setIsAuthorized(false);
                setIsLoaded(true);
                return;
            }
            setIsAuthorized(true);
            const customersData = await getCustomers();
            setAllOrders(orders);
            setAllCustomers(customersData);
            setIsLoaded(true);
        };
        fetchData();
    }, []);

    const filteredOrders = useMemo(() => {
        if (!allOrders) return [];
        const now = new Date();
        let startDate: Date;
        if (timeframe === 'week') startDate = startOfWeek(now);
        else if (timeframe === 'month') startDate = startOfMonth(now);
        else startDate = startOfYear(now);
        const endDate = endOfToday();

        return allOrders.filter(order => {
            const orderDate = (order.createdAt as any)?.seconds ? new Date((order.createdAt as any).seconds * 1000) : new Date(order.orderDate);
            return isWithinInterval(orderDate, { start: startDate, end: endDate }) && order.shippingStatus === 'Delivered';
        });
    }, [allOrders, timeframe]);

    const [status, setStatus] = useState<'loading' | 'generating' | 'done'>('loading');

    useEffect(() => {
        if (isLoaded && isAuthorized && status === 'loading') {
            // Small delay to ensure charts are rendered
            const timer = setTimeout(() => {
                setStatus('generating');
                generateAndOpenPdf();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isLoaded, isAuthorized, status]);

    const generateAndOpenPdf = async () => {
        const element = document.getElementById('report-content');
        if (!element) return;

        const opt = {
            margin: 0,
            filename: `sales-report-${timeframe}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };

        try {
            // @ts-ignore
            const html2pdf = (await import('html2pdf.js')).default;
            const pdfBlobUrl = await html2pdf().set(opt).from(element).output('bloburl');
            setStatus('done');
            window.location.href = pdfBlobUrl;
        } catch (error) {
            console.error("PDF generation failed", error);
            setStatus('done');
        }
    };

    const totalSales = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    const topProducts = useMemo(() => {
        const map = new Map<string, { name: string; qty: number; sales: number }>();
        filteredOrders.forEach(o => {
            const existing = map.get(o.itemName) || { name: o.itemName, qty: 0, sales: 0 };
            existing.qty += o.quantity;
            existing.sales += o.totalAmount;
            map.set(o.itemName, existing);
        });
        return Array.from(map.values()).sort((a, b) => b.sales - a.sales).slice(0, 10);
    }, [filteredOrders]);

    if (!isLoaded) return null;

    if (isAuthorized === false) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
                <ShieldAlert className="h-16 w-16 text-destructive" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this report.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* 
                Render Invoice Visible immediately. 
                html2pdf will capture this. 
                Once done, we redirect to blob.
             */}
            <div id="report-content" className="bg-white p-[40px] max-w-[210mm] min-h-[297mm] text-slate-800 font-sans mx-auto">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-700 tracking-tight">Sales Report</h1>
                        <p className="text-slate-500 mt-1 font-medium">{format(new Date(), "MM/dd/yyyy")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Placeholder Logo */}
                        <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">TF</span>
                        </div>
                        <span className="text-2xl font-bold text-slate-700">ThriftersFind</span>
                    </div>
                </div>

                {/* Info Block (Gray Background) */}
                <div className="bg-slate-50 p-8 mb-8 grid grid-cols-2 gap-12 rounded-sm text-sm">
                    <div>
                        <h3 className="text-slate-400 font-bold uppercase tracking-wider mb-2 text-xs">Report For</h3>
                        <p className="font-bold text-slate-700 text-base">ThriftersFind Store</p>
                        <p className="text-slate-500">Inventory & Sales Management</p>
                        <p className="text-slate-500">Anaheim Store</p>
                        <p className="text-slate-500">1720 W La Palma Ave, Anaheim, CA</p>
                    </div>
                    <div>
                        <h3 className="text-slate-400 font-bold uppercase tracking-wider mb-2 text-xs">Period Details</h3>
                        <p className="font-bold text-slate-700 text-base">{timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}ly Report</p>
                        <p className="text-slate-500">Date Range:</p>
                        <p className="text-slate-500">
                            {filteredOrders.length > 0
                                ? `${format(new Date(filteredOrders[filteredOrders.length - 1].orderDate), "MMM d")} - ${format(new Date(), "MMM d, yyyy")}`
                                : format(new Date(), "MMM d, yyyy")}
                        </p>
                    </div>
                </div>

                {/* Details Strip */}
                <div className="border-y-2 border-slate-200 py-3 mb-8 flex justify-between text-sm text-slate-600">
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xs uppercase">Generated By</span>
                        <span>System Admin</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xs uppercase">Total Orders</span>
                        <span>{totalOrders}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xs uppercase">Report Scope</span>
                        <span>All Products</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xs uppercase">Status</span>
                        <span>Confirmed</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="font-bold text-slate-800 text-xs uppercase">Terms</span>
                        <span>Confidential</span>
                    </div>
                </div>

                {/* Table Section */}
                <div className="mb-8">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-600 text-white">
                            <tr>
                                <th className="py-3 px-4 text-left font-semibold w-1/4">Order ID / Customer</th>
                                <th className="py-3 px-4 text-left font-semibold">Date</th>
                                <th className="py-3 px-4 text-center font-semibold">Status</th>
                                <th className="py-3 px-4 text-right font-semibold">Discount</th>
                                <th className="py-3 px-4 text-right font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-600">
                            {filteredOrders.map((order, index) => (
                                <tr key={order.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                    <td className="py-3 px-4 font-medium text-slate-800">
                                        <div>{order.id.substring(0, 8).toUpperCase()}</div>
                                        <div className="text-xs text-slate-400 font-normal">{order.customerName}</div>
                                    </td>
                                    <td className="py-3 px-4">{format(new Date(order.orderDate), "MM/dd/yyyy")}</td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${order.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {order.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right">-</td>
                                    <td className="py-3 px-4 text-right font-bold text-slate-800">₱{order.totalAmount.toLocaleString()}</td>
                                </tr>
                            ))}
                            {/* Empty Rows for visual spacing if list is short */}
                            {Array.from({ length: Math.max(0, 5 - filteredOrders.length) }).map((_, i) => (
                                <tr key={`empty-${i}`} className={(filteredOrders.length + i) % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                    <td className="py-4 px-4">&nbsp;</td>
                                    <td className="py-4 px-4">&nbsp;</td>
                                    <td className="py-4 px-4">&nbsp;</td>
                                    <td className="py-4 px-4">&nbsp;</td>
                                    <td className="py-4 px-4">&nbsp;</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="break-inside-avoid">
                    <div className="flex justify-end">
                        <div className="w-1/3">
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">Sub Total</span>
                                <span className="text-slate-700 font-bold">₱{totalSales.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-500 font-medium">Shipping (Est)</span>
                                <span className="text-slate-700 font-bold"> - </span>
                            </div>
                            <div className="flex justify-between py-2 mt-2 border-t-2 border-b-4 border-double border-slate-300">
                                <span className="text-slate-800 font-bold text-lg">Total Due</span>
                                <span className="text-slate-800 font-bold text-lg">₱{totalSales.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 flex items-end justify-between text-xs text-slate-400">
                    <div className="text-center">
                        <div className="h-12 w-32 border-b border-slate-300 mb-2 mx-auto"></div>
                        <p>Authorized Signature</p>
                    </div>
                    <div className="text-right">
                        <p>Digitally signed by System Admin</p>
                        <p>Date: {format(new Date(), "PP pp")}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PrintReportPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <PrintReportContent />
        </Suspense>
    );
}
