"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Order, Customer, Batch, ShippingStatus } from "@/lib/types";
import { getAllOrders } from "../../orders/actions";
import { getBatches } from "../../batches/actions";
import { getCustomers } from "../../customers/actions";
import { startOfWeek, startOfMonth, startOfYear, endOfToday, isWithinInterval, format } from "date-fns";
import { PhilippinePeso, Users, ShoppingCart, Archive, Package } from "lucide-react";

const shippingStatusStyles: Record<ShippingStatus, string> = {
    Pending: "bg-gray-100 text-gray-800",
    Ready: "bg-cyan-100 text-cyan-800",
    Shipped: "bg-blue-100 text-blue-800",
    Delivered: "bg-purple-100 text-purple-800",
    Cancelled: "bg-red-100 text-red-800",
    Claimed: "bg-green-100 text-green-800",
    "Rush Ship": "bg-orange-100 text-orange-800",
};

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

    const salesOverview = useMemo(() => {
        const periodMap: Record<string, { key: string, period: string, count: number, amount: number }> = {};

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

            if (!periodMap[periodKey]) {
                periodMap[periodKey] = { key: periodKey, period: periodLabel, count: 0, amount: 0 };
            }
            periodMap[periodKey].count += 1;
            periodMap[periodKey].amount += order.totalAmount;
        });

        return Object.values(periodMap).sort((a, b) => b.key.localeCompare(a.key));
    }, [filteredOrders, timeframe]);

    const topSales = useMemo(() => {
        const salesByProduct: Record<string, { id: string, itemName: string, quantity: number, totalAmount: number }> = {};

        filteredOrders.forEach(order => {
            if (order.items && order.items.length > 0) {
                order.items.forEach((item: any) => {
                    const name = item.product?.name || item.productName || "Unknown Item";
                    const price = item.product?.retailPrice || item.product?.cost || 0;
                    const amount = item.quantity * price;

                    if (!salesByProduct[name]) {
                        salesByProduct[name] = { id: name, itemName: name, quantity: 0, totalAmount: 0 };
                    }
                    salesByProduct[name].quantity += item.quantity;
                    salesByProduct[name].totalAmount += amount;
                });
            } else {
                const name = order.itemName;
                if (!salesByProduct[name]) {
                    salesByProduct[name] = { id: name, itemName: name, quantity: 0, totalAmount: 0 };
                }
                salesByProduct[name].quantity += order.quantity;
                salesByProduct[name].totalAmount += order.totalAmount;
            }
        });

        return Object.values(salesByProduct)
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, 5);
    }, [filteredOrders]);

    const topBatches = useMemo(() => {
        const batchMap: Record<string, { id: string, batchName: string, status: string, totalOrders: number, totalSales: number }> = {};

        filteredOrders.forEach(order => {
            if (order.batchId && order.batchId !== 'none' && order.batchId !== 'hold') {
                if (!batchMap[order.batchId]) {
                    const batchInfo = allBatches.find(b => b.id === order.batchId);
                    batchMap[order.batchId] = {
                        id: order.batchId,
                        batchName: batchInfo?.batchName || `Batch ${order.batchId.substring(0, 5)}`,
                        status: batchInfo?.status || "Unknown",
                        totalOrders: 0,
                        totalSales: 0
                    };
                }
                batchMap[order.batchId].totalOrders += 1;
                batchMap[order.batchId].totalSales += order.totalAmount;
            }
        });

        return Object.values(batchMap)
            .sort((a, b) => b.totalSales - a.totalSales)
            .slice(0, 5);
    }, [filteredOrders, allBatches]);

    const recentSales = useMemo(() => {
        return allOrders
            .flatMap(order => {
                if (order.items && order.items.length > 0) {
                    return order.items.map((item: any, index: number) => ({
                        id: `${order.id}-${index}`,
                        itemName: item.product?.name || item.productName || "Unknown Item",
                        quantity: item.quantity,
                        totalAmount: item.quantity * (item.product?.retailPrice || item.product?.cost || 0),
                        shippingStatus: order.shippingStatus,
                        customerName: order.customerName,
                        orderDate: order.orderDate
                    }));
                } else {
                    return [{
                        id: order.id,
                        itemName: order.itemName,
                        quantity: order.quantity,
                        totalAmount: order.totalAmount,
                        shippingStatus: order.shippingStatus,
                        customerName: order.customerName,
                        orderDate: order.orderDate
                    }];
                }
            })
            .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
            .slice(0, 10);
    }, [allOrders]);

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

                {/* Top Sales By Item Table */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-l-4 border-purple-500 pl-3">Top Performing Products</h3>
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-700 text-white">
                                <th className="py-2 px-4 text-left font-semibold rounded-tl-lg">Rank</th>
                                <th className="py-2 px-4 text-left font-semibold">Product Name</th>
                                <th className="py-2 px-4 text-right font-semibold">Qty Sold</th>
                                <th className="py-2 px-4 text-right font-semibold rounded-tr-lg">Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topSales.map((item, index) => (
                                <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                    <td className="py-3 px-4 text-slate-400 font-bold"># {index + 1}</td>
                                    <td className="py-3 px-4 font-bold text-slate-700">{item.itemName}</td>
                                    <td className="py-3 px-4 text-right">{item.quantity}</td>
                                    <td className="py-3 px-4 text-right font-bold text-slate-800">₱{item.totalAmount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Top Performing Batches Table */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-l-4 border-pink-500 pl-3">Top Performing Batches</h3>
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-700 text-white">
                                <th className="py-2 px-4 text-left font-semibold rounded-tl-lg">Batch Name</th>
                                <th className="py-2 px-4 text-left font-semibold">Status</th>
                                <th className="py-2 px-4 text-right font-semibold">Orders</th>
                                <th className="py-2 px-4 text-right font-semibold rounded-tr-lg">Total Sales</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topBatches.map((batch, index) => (
                                <tr key={batch.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                    <td className="py-3 px-4 font-bold text-slate-700">{batch.batchName}</td>
                                    <td className="py-3 px-4 text-slate-500 text-xs">{batch.status}</td>
                                    <td className="py-3 px-4 text-right">{batch.totalOrders || 0}</td>
                                    <td className="py-3 px-4 text-right font-bold text-slate-800">₱{(batch.totalSales || 0).toLocaleString()}</td>
                                </tr>
                            ))}
                            {topBatches.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-4 text-center text-slate-400 italic">No batch data available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Sales Overview Table */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-l-4 border-blue-500 pl-3">Sales Performance Overview</h3>
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-700 text-white">
                                <th className="py-2 px-4 text-left font-semibold rounded-tl-lg">Date / Period</th>
                                <th className="py-2 px-4 text-right font-semibold">Orders</th>
                                <th className="py-2 px-4 text-right font-semibold rounded-tr-lg">Total Sales</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesOverview.map((item, index) => (
                                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                    <td className="py-3 px-4 font-bold text-slate-700">{item.period}</td>
                                    <td className="py-3 px-4 text-right">{item.count}</td>
                                    <td className="py-3 px-4 text-right font-bold text-slate-800">₱{item.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                            {salesOverview.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="py-4 text-center text-slate-400 italic">No sales data available for this period</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Recent Sales Table */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 border-l-4 border-emerald-500 pl-3">Recent Transaction Activity</h3>
                    <table className="w-full text-[11px] border-collapse">
                        <thead className="border-b-2 border-slate-200">
                            <tr>
                                <th className="py-2 text-left text-slate-400 uppercase tracking-tighter">Product</th>
                                <th className="py-2 text-left text-slate-400 uppercase tracking-tighter">Customer</th>
                                <th className="py-2 text-center text-slate-400 uppercase tracking-tighter">Status</th>
                                <th className="py-2 text-right text-slate-400 uppercase tracking-tighter">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentSales.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-3 font-semibold text-slate-700">{item.itemName} <span className="text-slate-300 font-normal">({item.quantity}x)</span></td>
                                    <td className="py-3 text-slate-500">{item.customerName}</td>
                                    <td className="py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${shippingStatusStyles[item.shippingStatus as ShippingStatus]}`}>
                                            {item.shippingStatus}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right font-black text-slate-800">₱{item.totalAmount.toLocaleString()}</td>
                                </tr>
                            ))}
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
