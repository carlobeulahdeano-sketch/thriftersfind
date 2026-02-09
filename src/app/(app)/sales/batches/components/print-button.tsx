"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useSearchParams } from "next/navigation";

export function PrintButton() {
    const searchParams = useSearchParams();

    const handlePrint = () => {
        const params = new URLSearchParams(searchParams);
        window.open(`/sales/batches/print?${params.toString()}`, '_blank');
    };

    return (
        <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2 print:hidden"
        >
            <Printer className="h-4 w-4" />
            PRINT REPORT
        </Button>
    );
}
