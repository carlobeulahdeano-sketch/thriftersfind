"use client";

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Batch } from '@/lib/types';
import { cn } from "@/lib/utils";
import { ApexOptions } from 'apexcharts';

// Dynamically import Chart to avoid SSR issues with ApexCharts
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface BatchesChartProps {
    batches: Batch[];
    width?: string | number;
    height?: string | number;
    className?: string;
    onBatchClick?: (batch: Batch) => void;
}

export default function BatchesChart({ batches, width, height, className, onBatchClick }: BatchesChartProps) {
    const series = useMemo(() => {
        if (!batches || batches.length === 0) return [];
        return batches.map(b => b.totalSales || 0);
    }, [batches]);

    const labels = useMemo(() => {
        if (!batches || batches.length === 0) return [];
        return batches.map(b => b.batchName);
    }, [batches]);

    const options: ApexOptions = {
        chart: {
            type: 'pie',
            toolbar: {
                show: false
            },
            events: {
                dataPointSelection: function (event, chartContext, config) {
                    if (onBatchClick && batches && batches[config.dataPointIndex]) {
                        onBatchClick(batches[config.dataPointIndex]);
                    }
                }
            }
        },
        labels: labels,
        colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0'],
        legend: {
            position: 'right',
        },
        dataLabels: {
            enabled: true,
            formatter: function (val: number) {
                return val.toFixed(1) + "%";
            }
        },
        tooltip: {
            y: {
                formatter: function (val: number) {
                    return "₱" + val.toLocaleString();
                }
            }
        },
        plotOptions: {
            pie: {
                expandOnClick: false,
                customScale: 1
            }
        }
    };

    if (!batches || batches.length === 0) {
        return (
            <div className={cn("flex items-center justify-center text-muted-foreground", className)} style={{ height: height || 350 }}>
                No batch data available
            </div>
        );
    }

    return (
        <div className={cn("w-full", className)}>
            <Chart
                options={options}
                series={series}
                type="pie"
                width={width || "100%"}
                height={height || 350}
            />
        </div>
    );
}
