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
        const currentFrom = searchParams.get('from');
        const currentTo = searchParams.get('to');

        if (date?.from && date?.to) {
            const newFrom = format(date.from, 'yyyy-MM-dd');
            const newTo = format(date.to, 'yyyy-MM-dd');

            if (newFrom !== currentFrom || newTo !== currentTo) {
                const params = new URLSearchParams(searchParams);
                params.set('from', newFrom);
                params.set('to', newTo);
                router.push(`?${params.toString()}`);
            }
        } else if (date === undefined) {
            if (currentFrom || currentTo) {
                const params = new URLSearchParams(searchParams);
                params.delete('from');
                params.delete('to');
                router.replace(`?${params.toString()}`);
            }
        }
    }, [date, router, searchParams]);

    return (
        <div className="flex items-center gap-2">
            <DatePickerWithRange date={date} setDate={setDate} />
        </div>
    );
}
