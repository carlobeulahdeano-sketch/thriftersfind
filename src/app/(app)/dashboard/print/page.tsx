"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Order, Customer, Batch, ShippingStatus } from "@/lib/types";
import { getAllOrders } from "../../orders/actions";
import { getBatches } from "../../batches/actions";
import { getCustomers } from "../../customers/actions";
import { startOfWeek, startOfMonth, startOfYear, endOfToday, isWithinInterval, format } from "date-fns";
// Icons removed as they are unused

// shippingStatusStyles removed as it is no longer used

function DashboardPrintContent() {
    const searchParams = useSearchParams();
    const timeframe = (searchParams.get("timeframe") as "week" | "month" | "year") || "month";

    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [allBatches, setAllBatches] = useState<Batch[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [status, setStatus] = useState<'loading' | 'generating' | 'done'>('loading');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ordersData, batchesResult, customersData] = await Promise.all([
                    getAllOrders(),
                    getBatches(),
                    getCustomers()
                ]);

                // Extract bundles from result object
                const orders = (ordersData as any).orders || [];
                const batches = (batchesResult as any).batches || [];

                setAllOrders(orders);
                setAllBatches(batches);
                setAllCustomers(customersData);
                setIsLoaded(true);
            } catch (error) {
                console.error("Failed to fetch dashboard print data", error);
            }
        };
        fetchData();
    }, []);

    const filteredData = useMemo(() => {
        const now = new Date();
        let startDate: Date;

        if (timeframe === 'week') startDate = startOfWeek(now);
        else if (timeframe === 'month') startDate = startOfMonth(now);
        else startDate = startOfYear(now);

        const endDate = endOfToday();

        const filteredOrders = allOrders.filter(order => {
            const orderDate = new Date(order.orderDate);
            return isWithinInterval(orderDate, { start: startDate, end: endDate }) && order.shippingStatus === 'Delivered';
        });

        const filteredCustomers = allCustomers.filter(customer => {
            const firstOrder = (customer.orderHistory || []).reduce((earliest, current) => {
                if (!earliest) return current;
                return new Date(current.date) < new Date(earliest.date) ? current : earliest;
            }, null as { date: string } | null);

            if (!firstOrder) return false;

            const creationDate = new Date(firstOrder.date);
            return isWithinInterval(creationDate, { start: startDate, end: endDate });
        });

        return { orders: filteredOrders, customers: filteredCustomers };
    }, [timeframe, allOrders, allCustomers]);

    const { orders: filteredOrders, customers: filteredCustomers } = filteredData;

    const totalSales = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrdersCount = filteredOrders.length;
    const newCustomersCount = filteredCustomers.length;
    const heldOrdersCount = allOrders.filter(order => order.paymentStatus === 'Hold').length;

    const summaryData = useMemo(() => {
        const dataMap: Record<string, {
            period: string,
            dateObj: Date,
            orders: number,
            revenue: number,
            productIncomes: Record<string, number>,
            batchIds: Set<string>
        }> = {};

        filteredOrders.forEach(order => {
            const date = new Date(order.orderDate);
            let periodKey: string;
            let periodLabel: string;

            if (timeframe === 'year') {
                periodKey = format(date, "yyyy-MM");
                periodLabel = format(date, "MMMM yyyy");
            } else {
                periodKey = format(date, "yyyy-MM-dd");
                periodLabel = format(date, "MMM dd, yyyy");
            }

            if (!dataMap[periodKey]) {
                dataMap[periodKey] = {
                    period: periodLabel,
                    dateObj: date,
                    orders: 0,
                    revenue: 0,
                    productIncomes: {},
                    batchIds: new Set()
                };
            }

            const entry = dataMap[periodKey];
            entry.orders += 1;
            entry.revenue += order.totalAmount;

            if (order.batchId && order.batchId !== 'none') {
                entry.batchIds.add(order.batchId);
            }

            if (order.items && order.items.length > 0) {
                order.items.forEach((item: any) => {
                    const name = item.product?.name || item.productName || "Unknown Item";
                    const val = item.quantity * (item.product?.retailPrice || item.product?.cost || 0);
                    entry.productIncomes[name] = (entry.productIncomes[name] || 0) + val;
                });
            } else {
                const name = order.itemName;
                entry.productIncomes[name] = (entry.productIncomes[name] || 0) + order.totalAmount;
            }
        });

        return Object.values(dataMap)
            .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
            .map(item => {
                // Find Top Product
                let topProduct = "N/A";
                let maxRev = -1;
                Object.entries(item.productIncomes).forEach(([name, rev]) => {
                    if (rev > maxRev) {
                        maxRev = rev;
                        topProduct = name;
                    }
                });

                // Format Batches
                const batchNames = Array.from(item.batchIds).map(id => {
                    const b = allBatches.find(bg => bg.id === id);
                    return b ? b.batchName : id;
                });

                const batchDisplay = batchNames.length > 0
                    ? (batchNames.length > 3 ? `${batchNames.slice(0, 3).join(", ")} +${batchNames.length - 3} more` : batchNames.join(", "))
                    : "-";

                return {
                    period: item.period,
                    orders: item.orders,
                    revenue: item.revenue,
                    topProduct,
                    batches: batchDisplay
                };
            });
    }, [filteredOrders, timeframe, allBatches]);

    useEffect(() => {
        if (isLoaded && status === 'loading') {
            const timer = setTimeout(() => {
                setStatus('generating');
                generateAndOpenPdf();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isLoaded, status]);

    const generateAndOpenPdf = async () => {
        const element = document.getElementById('dashboard-report-content');
        if (!element) return;

        const opt = {
            margin: 0,
            filename: `dashboard-report-${timeframe}-${format(new Date(), "yyyy-MM-dd")}.pdf`,
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

    if (!isLoaded) return <div className="p-8 text-center text-slate-500 font-medium">Preparing report data...</div>;

    return (
        <div className="min-h-screen bg-white">
            <div id="dashboard-report-content" className="bg-white p-[40px] max-w-[210mm] min-h-[297mm] text-slate-800 font-sans mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-700 tracking-tight">Dashboard Summary</h1>
                        <p className="text-slate-500 mt-1 font-medium italic">ThriftersFind Analytics Engine</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-1">
                            <div className="h-8 w-8 bg-slate-800 rounded flex items-center justify-center">
                                <span className="text-white font-bold text-sm">TF</span>
                            </div>
                            <span className="text-xl font-bold text-slate-700">ThriftersFind</span>
                        </div>
                        <p className="text-xs text-slate-400">Generated: {format(new Date(), "PP pp")}</p>
                    </div>
                </div>

                {/* Period & Scope */}
                <div className="bg-slate-50 p-6 mb-8 rounded-lg border border-slate-100 grid grid-cols-2 gap-8 text-sm">
                    <div>
                        <h3 className="text-slate-400 font-bold uppercase tracking-wider mb-2 text-[10px]">Report Parameters</h3>
                        <p className="font-bold text-slate-700 text-base">{timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}ly Performance Review</p>
                        <p className="text-slate-500 mt-1 flex items-center gap-1">
                            Period: <span className="font-semibold text-slate-600">
                                {timeframe === 'week' ? 'Past 7 Days' : timeframe === 'month' ? 'Past 30 Days' : 'Past 365 Days'}
                            </span>
                        </p>
                    </div>
                    <div className="text-right">
                        <h3 className="text-slate-400 font-bold uppercase tracking-wider mb-2 text-[10px]">Store Context</h3>
                        <p className="text-slate-700 font-medium">Main Hub / System Dashboard</p>
                        <p className="text-slate-400 text-xs mt-1">Status: Operational - Verified</p>
                    </div>
                </div>

                {/* Consolidated Summary Table */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-l-4 border-slate-800 pl-3">Comprehensive Performance Summary</h3>
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-800 text-white">
                                <th className="py-3 px-4 text-left font-semibold rounded-tl-lg">Period</th>
                                <th className="py-3 px-4 text-left font-semibold">Top Product</th>
                                <th className="py-3 px-4 text-left font-semibold">Active Batches</th>
                                <th className="py-3 px-4 text-right font-semibold">Orders</th>
                                <th className="py-3 px-4 text-right font-semibold rounded-tr-lg">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summaryData.map((row, index) => (
                                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                    <td className="py-3 px-4 font-bold text-slate-700 align-top">{row.period}</td>
                                    <td className="py-3 px-4 text-slate-600 align-top">{row.topProduct}</td>
                                    <td className="py-3 px-4 text-slate-600 text-xs align-top">{row.batches}</td>
                                    <td className="py-3 px-4 text-right align-top">{row.orders}</td>
                                    <td className="py-3 px-4 text-right font-bold text-slate-800 align-top">₱{row.revenue.toLocaleString()}</td>
                                </tr>
                            ))}
                            {summaryData.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-6 text-center text-slate-400 italic">No consolidated data available for this timeframe</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-10 border-t border-slate-100 text-[10px] text-slate-300 flex justify-between items-center">
                    <p>© 2026 ThriftersFind Professional Series Report</p>
                    <p className="flex items-center gap-2">
                        <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
                        Confidential Business Intelligence
                        <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
                        Internal Use Only
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPrintPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-400">Initializating Reporting Module...</div>}>
            <DashboardPrintContent />
        </Suspense>
    );
}
