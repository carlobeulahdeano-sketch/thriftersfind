"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BatchAnalytics } from "../../actions";
import { format } from "date-fns";

interface BatchAnalyticsTableProps {
    data: BatchAnalytics[];
}

export function BatchAnalyticsTable({ data }: BatchAnalyticsTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Batch Name</TableHead>
                        <TableHead>Manufacture Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Total Sales</TableHead>
                        <TableHead className="text-right">Total Capital</TableHead>
                        <TableHead className="text-right">Net Profit</TableHead>
                        <TableHead>Best Seller</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((batch) => (
                        <TableRow key={batch.id}>
                            <TableCell className="font-medium">{batch.batchName}</TableCell>
                            <TableCell>{format(new Date(batch.manufactureDate), "MMM d, yyyy")}</TableCell>
                            <TableCell>
                                <Badge variant={batch.status === 'Open' ? 'default' : 'secondary'}>
                                    {batch.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">{batch.totalOrders}</TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                                ₱{batch.totalSales.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                                ₱{batch.totalCapital.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-bold text-blue-600">
                                ₱{batch.netProfit.toLocaleString()}
                            </TableCell>
                            <TableCell>
                                {batch.bestSellingProduct ? (
                                    <div className="flex flex-col">
                                        <span className="font-medium">{batch.bestSellingProduct.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {batch.bestSellingProduct.quantitySold} sold
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground text-xs">No sales yet</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    {data.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                No batch data found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
