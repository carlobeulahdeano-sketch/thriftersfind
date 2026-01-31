"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { BatchAnalytics } from "../../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BatchDetailsDialog } from "./batch-details-dialog";

// Dynamic import for ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface BatchSalesChartProps {
    data: BatchAnalytics[];
}

export function BatchSalesChart({ data }: BatchSalesChartProps) {
    const [selectedBatch, setSelectedBatch] = useState<BatchAnalytics | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Sort data by manufacture date ascending for the chart
    const sortedData = [...data].sort((a, b) => new Date(a.manufactureDate).getTime() - new Date(b.manufactureDate).getTime());

    const categories = sortedData.map(item => item.batchName);
    const salesData = sortedData.map(item => item.totalSales);
    const capitalData = sortedData.map(item => item.totalCapital);
    const profitData = sortedData.map(item => item.netProfit);

    const series = [
        {
            name: 'Total Sales',
            data: salesData,
            color: '#16a34a' // Green
        },
        {
            name: 'Total Capital',
            data: capitalData,
            color: '#94a3b8' // Slate/Gray
        },
        {
            name: 'Net Profit',
            data: profitData,
            color: '#2563eb' // Blue
        }
    ];

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'area', // Changed to area
            height: 350,
            toolbar: {
                show: false
            },
            events: {
                click: function (event, chartContext, config) {
                    if (config.dataPointIndex >= 0) {
                        const batch = sortedData[config.dataPointIndex];
                        setSelectedBatch(batch);
                        setIsDialogOpen(true);
                    }
                }
            }
        },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        xaxis: {
            categories: categories,
            labels: {
                style: {
                    fontSize: '12px'
                }
            }
        },
        yaxis: {
            labels: {
                formatter: (value) => {
                    return `₱${value.toLocaleString()}`;
                }
            }
        },
        dataLabels: {
            enabled: false
        },
        tooltip: {
            y: {
                formatter: (value) => {
                    return `₱${value.toLocaleString()}`;
                }
            }
        },
        legend: {
            position: 'top'
        },
        grid: {
            borderColor: '#f1f1f1'
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.9,
                stops: [0, 90, 100]
            }
        }
    };

    return (
        <>
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Sales Performance Over Batches</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[350px] w-full">
                        <Chart
                            options={options}
                            series={series}
                            type="area" // Changed to area
                            height="100%"
                            width="100%"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        Click on a data point to view top selling products.
                    </p>
                </CardContent>
            </Card>

            <BatchDetailsDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                batchName={selectedBatch?.batchName || ''}
                topProducts={selectedBatch?.topProducts}
            />
        </>
    );
}
