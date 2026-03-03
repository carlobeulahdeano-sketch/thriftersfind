"use client";

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Order } from '@/lib/types';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ApexOptions } from 'apexcharts';

// Dynamically import Chart to avoid SSR issues with ApexCharts
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface SalesChartProps {
  orders: Order[];
  timeframe: "week" | "month" | "year" | "all";
}

export default function SalesChart({ orders, timeframe }: SalesChartProps) {
  const { categories, seriesData } = useMemo(() => {
    if (!orders) return { categories: [], seriesData: [] };

    if (timeframe === 'week') {
      const now = new Date();
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

      const salesByDay: { [key: string]: number } = {};
      const dayLabels: string[] = [];

      days.forEach(day => {
        const label = format(day, 'E'); // Mon, Tue...
        salesByDay[label] = 0;
        dayLabels.push(label);
      });

      orders.forEach(order => {
        const orderDate = (order.createdAt as any)?.seconds ? new Date((order.createdAt as any).seconds * 1000) : new Date(order.orderDate);
        if (isWithinInterval(orderDate, { start: weekStart, end: weekEnd })) {
          const dayOfWeek = format(orderDate, "E");
          if (salesByDay.hasOwnProperty(dayOfWeek)) {
            salesByDay[dayOfWeek] += order.totalAmount;
          }
        }
      });
      return {
        categories: dayLabels,
        seriesData: dayLabels.map(day => salesByDay[day])
      };
    }

    if (timeframe === 'month') {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const weeks = eachWeekOfInterval({
        start: monthStart,
        end: monthEnd
      }, { weekStartsOn: 1 });

      const salesByWeek: { [key: string]: number } = {};
      const weekLabels: string[] = [];

      weeks.forEach((week, index) => {
        const label = `Week ${index + 1}`;
        salesByWeek[label] = 0;
        weekLabels.push(label);
      });

      orders.forEach(order => {
        const orderDate = (order.createdAt as any)?.seconds ? new Date((order.createdAt as any).seconds * 1000) : new Date(order.orderDate);
        if (isWithinInterval(orderDate, { start: monthStart, end: monthEnd })) {
          // Calculate week index
          const weekNumber = Math.ceil((orderDate.getDate() - (orderDate.getDay() || 7) + 1) / 7);
          const weekKey = `Week ${weekNumber}`;
          if (salesByWeek.hasOwnProperty(weekKey)) {
            salesByWeek[weekKey] += order.totalAmount;
          }
        }
      });

      return {
        categories: weekLabels,
        seriesData: weekLabels.map(w => salesByWeek[w])
      };
    }

    if (timeframe === 'year') {
      const monthlySales: { [key: string]: number } = {};
      const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      monthOrder.forEach(month => {
        monthlySales[month] = 0;
      });

      orders.forEach(order => {
        const orderDate = (order.createdAt as any)?.seconds ? new Date((order.createdAt as any).seconds * 1000) : new Date(order.orderDate);
        const month = format(orderDate, "MMM");
        if (monthlySales.hasOwnProperty(month)) {
          monthlySales[month] += order.totalAmount;
        }
      });

      return {
        categories: monthOrder,
        seriesData: monthOrder.map(m => monthlySales[m])
      };
    }

    if (timeframe === 'all') {
      const salesByMonthYear: { [key: string]: number } = {};
      const labels: string[] = [];

      orders.forEach(order => {
        const orderDate = (order.createdAt as any)?.seconds ? new Date((order.createdAt as any).seconds * 1000) : new Date(order.orderDate);
        const label = format(orderDate, "MMM yyyy");

        if (!salesByMonthYear.hasOwnProperty(label)) {
          salesByMonthYear[label] = 0;
          labels.push(label);
        }
        salesByMonthYear[label] += order.totalAmount;
      });

      labels.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      return {
        categories: labels,
        seriesData: labels.map(l => salesByMonthYear[l])
      };
    }

    return { categories: [], seriesData: [] };

  }, [orders, timeframe]);

  const series = [{
    name: "Total Sales",
    data: seriesData
  }];

  const options: ApexOptions = {
    chart: {
      type: 'area',
      height: 350,
      fontFamily: 'inherit',
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    xaxis: {
      categories: categories,
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      labels: {
        style: {
          colors: 'hsl(var(--muted-foreground))',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        formatter: (value) => `₱${value.toLocaleString()}`,
        style: {
          colors: 'hsl(var(--muted-foreground))',
          fontSize: '12px'
        }
      }
    },
    grid: {
      show: true,
      borderColor: 'hsl(var(--border))',
      strokeDashArray: 4,
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 90, 100]
      }
    },
    colors: ['#0ea5e9'],
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function (val) {
          return "₱" + val.toLocaleString()
        }
      }
    }
  };

  return (
    <div className="w-full">
      <Chart options={options} series={series} type="area" height={350} width="100%" />
    </div>
  );
}
