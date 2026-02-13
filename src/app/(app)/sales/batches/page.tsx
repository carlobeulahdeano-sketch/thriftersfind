import { getBatchAnalytics } from "../actions";
import { BatchAnalyticsTable } from "./components/batch-analytics-table";
import { BatchSalesChart } from "./components/batch-sales-chart";
import { BatchAnalyticsFilter } from "./components/batch-analytics-filter";
import { PrintButton } from "./components/print-button";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface BatchAnalyticsPageProps {
    searchParams: Promise<{
        from?: string;
        to?: string;
    }>
}

export default async function BatchAnalyticsPage({ searchParams }: BatchAnalyticsPageProps) {
    const { from, to } = await searchParams;
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    const { batchAnalytics, isAuthorized } = await getBatchAnalytics(fromDate, toDate);

    if (!isAuthorized) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
                <ShieldAlert className="h-16 w-16 text-destructive" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 p-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/sales">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
                            Batch Analytics
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Detailed sales performance and capital analysis per batch.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <PrintButton />
                    <BatchAnalyticsFilter />
                </div>
            </div>

            <BatchSalesChart data={batchAnalytics} />

            <BatchAnalyticsTable data={batchAnalytics} />
        </div>
    );
}
