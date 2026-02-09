import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Order } from "@/lib/types";
import { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CourierChartProps {
  orders: Order[];
}

export default function CourierChart({ orders }: CourierChartProps) {
  const { series, options } = useMemo(() => {
    const usage: { [key: string]: { count: number, trackingNumbers: string[] } } = {};

    orders.forEach(order => {
      // Use "Unassigned" if courierName is missing or empty
      const courier = order.courierName || "Unassigned";
      if (!usage[courier]) {
        usage[courier] = { count: 0, trackingNumbers: [] };
      }
      usage[courier].count += 1;
      if (order.trackingNumber && !usage[courier].trackingNumbers.includes(order.trackingNumber)) {
        usage[courier].trackingNumbers.push(order.trackingNumber);
      }
    });

    const labels = Object.keys(usage);
    const seriesData = Object.values(usage).map(u => u.count);
    const trackingData = Object.values(usage).map(u => u.trackingNumbers);

    const chartOptions: ApexOptions = {
      chart: {
        type: "donut",
        animations: {
          enabled: true,
          speed: 800,
        },
        fontFamily: 'inherit',
        toolbar: {
          show: false
        }
      },
      labels: labels,
      colors: [
        '#06b6d4', // cyan-500
        '#ec4899', // pink-500
        '#8b5cf6', // violet-500
        '#f59e0b', // amber-500
        '#10b981', // emerald-500
        '#3b82f6', // blue-500
      ],
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '14px',
                fontFamily: 'inherit',
                fontWeight: 600,
                color: 'inherit',
                offsetY: -10
              },
              value: {
                show: true,
                fontSize: '16px',
                fontFamily: 'inherit',
                fontWeight: 400,
                color: 'inherit',
                offsetY: 16,
                formatter: function (val) {
                  return val.toString()
                }
              },
              total: {
                show: true,
                showAlways: true,
                label: 'Total',
                fontSize: '14px',
                fontFamily: 'inherit',
                fontWeight: 600,
                color: 'inherit',
                formatter: function (w) {
                  const total = w.globals.seriesTotals.reduce((a: number, b: number) => {
                    return a + b
                  }, 0);
                  return total.toString();
                }
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        colors: ['transparent'],
        width: 2
      },
      legend: {
        position: 'bottom',
        fontFamily: 'inherit',
        labels: {
          colors: 'inherit',
        },
        markers: {
          width: 12,
          height: 12,
          radius: 12,
        } as any, // Cast to any to bypass type mismatch if properties exist in runtime but missing in types
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: function (val, opts) {
            const dataIndex = opts.dataPointIndex;
            const trackingNumbers = trackingData[dataIndex];

            if (!trackingNumbers || trackingNumbers.length === 0) {
              return val + " orders";
            }

            const maxShown = 5;
            const shownTracking = trackingNumbers.slice(0, maxShown).join(", ");
            const remaining = trackingNumbers.length - maxShown;

            let tooltipText = val + " orders";
            if (trackingNumbers.length > 0) {
              tooltipText += " (Tracking: " + shownTracking + (remaining > 0 ? `, +${remaining} more` : "") + ")";
            }

            return tooltipText;
          }
        }
      },
      theme: {
        mode: 'dark',
        palette: 'palette1'
      }
    };

    return { series: seriesData, options: chartOptions };
  }, [orders]);

  if (series.length === 0) {
    return <div className="flex items-center justify-center h-[300px] text-muted-foreground">No courier data available</div>
  }

  return (
    <div className="h-[300px] w-full">
      <Chart
        options={options}
        series={series}
        type="donut"
        width="100%"
        height="100%"
      />
    </div>
  );
}
