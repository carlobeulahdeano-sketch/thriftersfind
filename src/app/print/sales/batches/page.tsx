"use client";

import { useEffect, useState, Suspense } from "react";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { getBatchAnalytics, BatchAnalytics } from "@/app/(app)/sales/actions";
import { ArrowLeft, ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";

function PrintReportContent() {
    const searchParams = useSearchParams();
    const [analyticsData, setAnalyticsData] = useState<BatchAnalytics[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [status, setStatus] = useState<'loading' | 'generating' | 'done'>('loading');
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    const fromDate = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
    const toDate = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { batchAnalytics, isAuthorized } = await getBatchAnalytics(fromDate, toDate);
                if (!isAuthorized) {
                    setIsAuthorized(false);
                    setIsLoaded(true);
                    return;
                }
                setAnalyticsData(batchAnalytics);
                setIsAuthorized(true);
                setIsLoaded(true);
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
    }, [searchParams]);

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
        const element = document.getElementById('report-content');
        if (!element) return;

        const opt = {
            margin: 0,
            filename: `batch-analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };

        try {
            // @ts-ignore
            const html2pdf = (await import('html2pdf.js')).default;
            await html2pdf().set(opt).from(element).save();
            setStatus('done');

            // Try to close the window after a short delay
            setTimeout(() => {
                window.close();
            }, 1500);
        } catch (error) {
            console.error("PDF generation failed", error);
            setStatus('done');
        }
    };

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
        <div className="min-h-screen bg-slate-100 flex flex-col items-center">
            {/* Status Overlay */}
            {(status === 'loading' || status === 'generating') && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800">
                        {status === 'loading' ? 'Loading Data...' : 'Generating PDF...'}
                    </h2>
                    <p className="text-slate-500 mt-2">Please wait while we prepare your report.</p>
                </div>
            )}

            {status === 'done' && (
                <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-4">
                    <CheckCircle2 className="h-20 w-20 text-green-500 mb-6" />
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">Download Complete!</h2>
                    <p className="text-slate-600 mb-8 max-w-md">
                        Your batch report has been downloaded. You can safely close this tab or we will close it for you shortly.
                    </p>
                    <button
                        onClick={() => window.close()}
                        className="px-6 py-3 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 transition-colors"
                    >
                        Close Tab
                    </button>
                </div>
            )}

            {/* 
                Render Invoice Visible immediately. 
                html2pdf will capture this. 
                Once done, we redirect to blob.
             */}
            <div className="opacity-0 pointer-events-none absolute -z-10">
                <div id="report-content" className="bg-white p-[40px] w-[210mm] min-h-[297mm] text-slate-800 font-sans mx-auto">
                    {/* Header Section */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-4xl font-bold text-slate-700 tracking-tight">Batch Report</h1>
                            <p className="text-slate-500 mt-1 font-medium">{format(new Date(), "MM/dd/yyyy")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-lg">TF</span>
                            </div>
                            <span className="text-2xl font-bold text-slate-700">ThriftersFind</span>
                        </div>
                    </div>

                    {/* Info Block */}
                    <div className="bg-slate-50 p-8 mb-8 grid grid-cols-2 gap-12 rounded-sm text-sm">
                        <div>
                            <h3 className="text-slate-400 font-bold uppercase tracking-wider mb-2 text-xs">Report For</h3>
                            <p className="font-bold text-slate-700 text-base">ThriftersFind Store</p>
                            <p className="text-slate-500">Batch Performance Analysis</p>
                        </div>
                        <div>
                            <h3 className="text-slate-400 font-bold uppercase tracking-wider mb-2 text-xs">Period Details</h3>
                            <p className="font-bold text-slate-700 text-base">
                                {fromDate && toDate
                                    ? "Custom Range"
                                    : "All Time / Default"}
                            </p>
                            <p className="text-slate-500">Range:</p>
                            <p className="text-slate-500">
                                {fromDate ? format(fromDate, "MMM d, yyyy") : 'Start'} - {toDate ? format(toDate, "MMM d, yyyy") : 'Present'}
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
                            <span className="font-bold text-slate-800 text-xs uppercase">Total Batches</span>
                            <span>{analyticsData.length}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-xs uppercase">Total Sales</span>
                            <span>₱{analyticsData.reduce((acc, b) => acc + b.totalSales, 0).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-xs uppercase">Total Profit</span>
                            <span>₱{analyticsData.reduce((acc, b) => acc + b.netProfit, 0).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="font-bold text-slate-800 text-xs uppercase">Status</span>
                            <span>Generated</span>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="mb-8">
                        <h3 className="font-bold text-lg mb-4 uppercase tracking-wider text-slate-700">Batch Details</h3>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-600 text-white">
                                <tr>
                                    <th className="py-3 px-4 text-left font-semibold">Batch Name</th>
                                    <th className="py-3 px-4 text-left font-semibold">Date</th>
                                    <th className="py-3 px-4 text-center font-semibold">Orders</th>
                                    <th className="py-3 px-4 text-right font-semibold">Sales</th>
                                    <th className="py-3 px-4 text-right font-semibold">Profit</th>
                                    <th className="py-3 px-4 text-right font-semibold">Best Seller</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-600">
                                {analyticsData.map((batch, index) => (
                                    <tr key={batch.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                        <td className="py-3 px-4 font-medium text-slate-800">{batch.batchName}</td>
                                        <td className="py-3 px-4">{format(new Date(batch.manufactureDate), "MMM d, yyyy")}</td>
                                        <td className="py-3 px-4 text-center">{batch.totalOrders}</td>
                                        <td className="py-3 px-4 text-right">₱{batch.totalSales.toLocaleString()}</td>
                                        <td className={`py-3 px-4 text-right font-bold ${batch.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            ₱{batch.netProfit.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right text-xs">
                                            {batch.bestSellingProduct ? batch.bestSellingProduct.name.substring(0, 20) + (batch.bestSellingProduct.name.length > 20 ? '...' : '') : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-8 flex items-end justify-between text-xs text-slate-400 break-inside-avoid">
                        <div className="text-center">
                            <div className="h-12 w-32 border-b border-slate-300 mb-2 mx-auto"></div>
                            <p>Authorized Signature</p>
                        </div>
                        <div className="text-right">
                            <p>ThriftersFind Analytics</p>
                            <p>Generated: {format(new Date(), "PP pp")}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BatchPrintPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center bg-white h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-blue-600 animate-spin" /></div>}>
            <PrintReportContent />
        </Suspense>
    );
}
