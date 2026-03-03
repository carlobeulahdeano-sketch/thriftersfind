"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getSalesData } from "../actions";
import { Order } from "@/lib/types";


export default function SalesReportPage() {
    const searchParams = useSearchParams();
    const timeframe = (searchParams.get("timeframe") as "week" | "month" | "year" | "all") || "month";
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<'fetching' | 'generating' | 'done'>('fetching');
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            const data = await getSalesData(timeframe);
            setOrders(data.orders);
            setIsLoading(false);
            setStatus('generating');
        };
        fetchData();
    }, [timeframe]);

    useEffect(() => {
        if (status === 'generating') {
            const timer = setTimeout(() => {
                generatePdf();
            }, 500); // Give DOM a moment to render the off-screen content
            return () => clearTimeout(timer);
        }
    }, [status]);

    const generatePdf = async () => {
        // Find the element by ID because ref might have issues with off-screen rendering
        const element = document.getElementById('report-content');
        if (!element) return;

        const opt = {
            margin: 0,
            filename: `sales-report-${timeframe}-${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, windowWidth: 800 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };

        try {
            // @ts-ignore
            const html2pdf = (await import('html2pdf.js')).default;
            await html2pdf().set(opt).from(element).save();
            setStatus('done');
            setTimeout(() => window.close(), 1000); // Close tab after 1s
        } catch (error) {
            console.error("PDF generation failed", error);
            setStatus('done');
        }
    };

    const deliveredOrders = useMemo(() => {
        return orders.filter(order => order.shippingStatus === 'Delivered');
    }, [orders]);

    const metrics = useMemo(() => {
        const totalSales = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = deliveredOrders.length;

        const productMap = new Map<string, { name: string; sales: number; quantity: number }>();
        deliveredOrders.forEach(order => {
            const itemName = order.itemName || "Unknown Item";
            const existing = productMap.get(itemName) || { name: itemName, sales: 0, quantity: 0 };
            existing.sales += order.totalAmount;
            existing.quantity += order.quantity;
            productMap.set(itemName, existing);
        });
        const topProducts = Array.from(productMap.values()).sort((a, b) => b.sales - a.sales);

        return { totalSales, totalOrders, topProducts };
    }, [deliveredOrders]);

    if (isLoading || status === 'generating') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-lg font-medium">Loading and generating PDF report...</p>
                <p className="text-sm text-muted-foreground">This tab will close automatically when done.</p>

                {/* 
                  Render the report element off-screen but in the DOM so html2pdf can access it 
                  without showing it to the user. 
                  We use opacity-0 and pointer-events-none instead of display:none or absolute off-screen
                  because html2canvas needs it to be laid out properly.
                */}
                <div className="absolute top-0 left-0 w-[210mm] opacity-0 pointer-events-none -translate-x-[9999px]">
                    <div id="report-content" className="bg-white p-[40px] max-w-[210mm] min-h-[297mm] text-slate-800 font-sans mx-auto flex flex-col">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h1 className="text-4xl font-bold text-slate-700 tracking-tight">Sales Report</h1>
                                <p className="text-slate-500 mt-1 font-medium">{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">TF</span>
                                </div>
                                <span className="text-2xl font-bold text-slate-700">ThriftersFind</span>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-8 mb-8 grid grid-cols-2 gap-12 rounded-sm text-sm">
                            <div>
                                <h3 className="text-slate-400 font-bold uppercase tracking-wider mb-2 text-xs">Report For</h3>
                                <p className="font-bold text-slate-700 text-base">ThriftersFind Store</p>
                                <p className="text-slate-500">Sales Performance</p>
                            </div>
                            <div>
                                <h3 className="text-slate-400 font-bold uppercase tracking-wider mb-2 text-xs">Period Details</h3>
                                <p className="font-bold text-slate-700 text-base capitalize">{timeframe === 'all' ? 'All Time' : `${timeframe}ly`} Report</p>
                                <p className="text-slate-500">Date Generated:</p>
                                <p className="text-slate-500">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                        </div>

                        <div className="border-y-2 border-slate-200 py-3 mb-8 flex justify-between text-sm text-slate-600 space-x-4">
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-xs uppercase">Generated By</span>
                                <span>System Admin</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-xs uppercase">Total Orders</span>
                                <span>{metrics.totalOrders}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-xs uppercase">Total Sales</span>
                                <span>₱{metrics.totalSales.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="font-bold text-slate-800 text-xs uppercase">Status</span>
                                <span>Generated</span>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="font-bold text-lg mb-4 uppercase tracking-wider text-slate-700">Product Performance</h3>
                            <table className="w-full text-sm">
                                <thead className="bg-slate-600 text-white">
                                    <tr>
                                        <th className="py-3 px-4 text-left font-semibold w-1/2">Product Name</th>
                                        <th className="py-3 px-4 text-center font-semibold">Quantity</th>
                                        <th className="py-3 px-4 text-right font-semibold">Total Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-600">
                                    {metrics.topProducts.map((product, index) => (
                                        <tr key={product.name} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                            <td className="py-3 px-4 font-medium text-slate-800">{product.name}</td>
                                            <td className="py-3 px-4 text-center">{product.quantity}</td>
                                            <td className="py-3 px-4 text-right">₱{product.sales.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {metrics.topProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-4 px-4 text-center text-slate-500">No product data available</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mb-8 break-inside-avoid">
                            <h3 className="font-bold text-lg mb-4 uppercase tracking-wider text-slate-700">Recent Transactions</h3>
                            <table className="w-full text-sm">
                                <thead className="bg-slate-600 text-white">
                                    <tr>
                                        <th className="py-3 px-4 text-left font-semibold">Date</th>
                                        <th className="py-3 px-4 text-left font-semibold">Customer</th>
                                        <th className="py-3 px-4 text-left font-semibold">Item</th>
                                        <th className="py-3 px-4 text-right font-semibold">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-600">
                                    {deliveredOrders.slice(0, 15).map((order, index) => (
                                        <tr key={order.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                            <td className="py-3 px-4">{new Date(order.orderDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
                                            <td className="py-3 px-4 font-medium text-slate-800">{order.customerName || "Walk In Customer"}</td>
                                            <td className="py-3 px-4 truncate max-w-[200px]" title={order.itemName}>{order.itemName}</td>
                                            <td className="py-3 px-4 text-right font-bold text-slate-800">₱{order.totalAmount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {deliveredOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-4 px-4 text-center text-slate-500">No recent transactions</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-auto pt-8 flex items-end justify-between text-xs text-slate-400 break-inside-avoid">
                            <div className="text-center">
                                <div className="h-12 w-32 border-b border-slate-300 mb-2 mx-auto"></div>
                                <p>Authorized Signature</p>
                            </div>
                            <div className="text-right">
                                <p>ThriftersFind Analytics</p>
                                <p>Generated on {new Date().toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <p className="text-lg flex items-center gap-2 font-medium text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
                PDF downloaded successfully!
            </p>
            <p className="text-sm text-muted-foreground">You can close this tab now.</p>
            <button onClick={() => window.close()} className="px-4 py-2 mt-4 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors">
                Close Tab
            </button>
        </div>
    );
}
