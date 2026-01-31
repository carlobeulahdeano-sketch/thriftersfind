"use client";

import { DatePickerWithRange } from "@/components/date-range-picker";
import { useRouter, useSearchParams } from "next/navigation";
import { DateRange } from "react-day-picker";
import { useState, useEffect } from "react";
import { addDays, format } from "date-fns";

export function BatchAnalyticsFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialFrom = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
    const initialTo = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;

    const [date, setDate] = useState<DateRange | undefined>({
        from: initialFrom,
        to: initialTo
    });

    useEffect(() => {
        if (date?.from) {
            const params = new URLSearchParams(searchParams);
            params.set('from', format(date.from, 'yyyy-MM-dd'));
            if (date.to) {
                params.set('to', format(date.to, 'yyyy-MM-dd'));
            } else {
                params.delete('to');
            }
            router.push(`?${params.toString()}`);
        } else if (date === undefined) {
            const params = new URLSearchParams(searchParams);
            params.delete('from');
            params.delete('to');
            router.replace(`?${params.toString()}`);
        }
    }, [date, router, searchParams]);

    return (
        <div className="flex items-center gap-2">
            <DatePickerWithRange date={date} setDate={setDate} />
        </div>
    );
}
