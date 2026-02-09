"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useSearchParams } from "next/navigation";

export function PrintButton() {
    const searchParams = useSearchParams();

    const handlePrint = () => {
        const timeframe = searchParams.get("timeframe") || "month";
        window.open(`/dashboard/print?timeframe=${timeframe}`, '_blank');
    };

    return (
        <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2 print:hidden h-11"
        >
            <Printer className="h-4 w-4" />
            PRINT REPORT
        </Button>
    );
}
