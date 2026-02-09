"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Batch, Order } from "@/lib/types";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, SearchX } from "lucide-react";

interface ViewBatchItemsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    batch: Batch | null;
    batchOrders: Order[];
}

export function ViewBatchItemsDialog({
    isOpen,
    onClose,
    batch,
    batchOrders,
}: ViewBatchItemsDialogProps) {
    const items = useMemo(() => {
        if (!batchOrders || batchOrders.length === 0) return [];

        const salesByProduct: Record<
            string,
            { id: string; itemName: string; quantity: number; totalAmount: number }
        > = {};

        batchOrders.forEach((order) => {
            let orderItems: any[] = [];
            try {
                if (Array.isArray(order.items)) {
                    orderItems = order.items;
                } else if (typeof order.items === 'string') {
                    orderItems = JSON.parse(order.items);
                }
            } catch (e) {
                console.error("Failed to parse order items", e);
                orderItems = [];
            }

            if (orderItems && orderItems.length > 0) {
                orderItems.forEach((item: any) => {
                    const name = item.product?.name || item.productName || "Unknown Item";
                    const price = item.product?.retailPrice || item.product?.cost || 0;
                    // Use item.quantity and calculating amount
                    // Note: item structure in order.items might vary based on how it was saved
                    const amount = (item.quantity || 0) * price;

                    if (!salesByProduct[name]) {
                        salesByProduct[name] = {
                            id: name,
                            itemName: name,
                            quantity: 0,
                            totalAmount: 0,
                        };
                    }
                    salesByProduct[name].quantity += item.quantity || 0;
                    salesByProduct[name].totalAmount += amount;
                });
            } else {
                // Legacy orders or single item orders
                const name = order.itemName;
                if (!salesByProduct[name]) {
                    salesByProduct[name] = {
                        id: name,
                        itemName: name,
                        quantity: 0,
                        totalAmount: 0,
                    };
                }
                salesByProduct[name].quantity += order.quantity;
                salesByProduct[name].totalAmount += order.totalAmount;
            }
        });

        return Object.values(salesByProduct).sort(
            (a, b) => b.totalAmount - a.totalAmount
        );
    }, [batchOrders]);

    if (!batch) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <Package className="h-6 w-6 text-primary" />
                                {batch.batchName}
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground">
                                Batch Items Overview
                            </p>
                        </div>
                        <Badge variant="outline" className="text-sm px-3 py-1">
                            {batch.status}
                        </Badge>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 max-h-[calc(85vh-140px)]">
                    <div className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="px-6">Item Name</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right px-6">Total Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length > 0 ? (
                                    items.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-muted/50">
                                            <TableCell className="px-6 font-medium">
                                                {item.itemName}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="text-right px-6 font-bold text-muted-foreground">
                                                ₱{item.totalAmount.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <SearchX className="h-8 w-8 opacity-30" />
                                                <span>No items found in this batch</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </ScrollArea>

                <DialogFooter className="px-6 py-4 border-t bg-muted/10">
                    <div className="flex w-full items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Total Items: <span className="font-medium text-foreground">{items.length}</span>
                        </div>
                        <Button onClick={onClose}>Close</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
