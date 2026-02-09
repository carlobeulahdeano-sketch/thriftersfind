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
import { Order } from "@/lib/types";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, SearchX, ShoppingBag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface ViewHeldOrdersDialogProps {
    isOpen: boolean;
    onClose: () => void;
    orders: Order[];
}

export function ViewHeldOrdersDialog({
    isOpen,
    onClose,
    orders,
}: ViewHeldOrdersDialogProps) {
    const summarizedItems = useMemo(() => {
        if (!orders || orders.length === 0) return [];

        const itemsByProduct: Record<
            string,
            { id: string; itemName: string; quantity: number; totalAmount: number }
        > = {};

        orders.forEach((order) => {
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
                    const amount = (item.quantity || 0) * price;

                    if (!itemsByProduct[name]) {
                        itemsByProduct[name] = {
                            id: name,
                            itemName: name,
                            quantity: 0,
                            totalAmount: 0,
                        };
                    }
                    itemsByProduct[name].quantity += item.quantity || 0;
                    itemsByProduct[name].totalAmount += amount;
                });
            } else {
                const name = order.itemName;
                if (name) {
                    if (!itemsByProduct[name]) {
                        itemsByProduct[name] = {
                            id: name,
                            itemName: name,
                            quantity: 0,
                            totalAmount: 0,
                        };
                    }
                    itemsByProduct[name].quantity += order.quantity || 0;
                    itemsByProduct[name].totalAmount += order.totalAmount || 0;
                }
            }
        });

        return Object.values(itemsByProduct).sort(
            (a, b) => b.totalAmount - a.totalAmount
        );
    }, [orders]);

    const totalHeldValue = useMemo(() => {
        return orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    }, [orders]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <Archive className="h-6 w-6 text-orange-500" />
                                Held Orders
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground">
                                Detailed view of orders and items currently on hold
                            </p>
                        </div>
                        <Badge variant="outline" className="text-sm px-3 py-1 bg-orange-50 text-orange-700 border-orange-200">
                            {orders.length} Orders
                        </Badge>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="items" className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 border-b bg-muted/20">
                        <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0 border-b-0">
                            <TabsTrigger
                                value="items"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-12"
                            >
                                Items Summary
                            </TabsTrigger>
                            <TabsTrigger
                                value="orders"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none h-12"
                            >
                                Orders List
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 max-h-[calc(90vh-220px)]">
                        <TabsContent value="items" className="m-0 focus-visible:outline-none">
                            <Table>
                                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead className="px-6">Item Name</TableHead>
                                        <TableHead className="text-right">Quantity</TableHead>
                                        <TableHead className="text-right px-6">Approx. Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {summarizedItems.length > 0 ? (
                                        summarizedItems.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-muted/50">
                                                <TableCell className="px-6 font-medium">
                                                    {item.itemName}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {item.quantity}
                                                </TableCell>
                                                <TableCell className="text-right px-6 font-bold text-muted-foreground font-mono">
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
                                                    <span>No items found</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="orders" className="m-0 focus-visible:outline-none">
                            <Table>
                                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead className="px-6">Customer</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right px-6">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.length > 0 ? (
                                        orders.map((order) => (
                                            <TableRow key={order.id} className="hover:bg-muted/50">
                                                <TableCell className="px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-primary">{order.customerName}</span>
                                                        <span className="text-[10px] text-muted-foreground">ID: {order.id.slice(0, 8)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {format(new Date(order.orderDate), "MMM dd, yyyy")}
                                                </TableCell>
                                                <TableCell className="text-right px-6 font-bold font-mono">
                                                    ₱{order.totalAmount.toLocaleString()}
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
                                                    <ShoppingBag className="h-8 w-8 opacity-30" />
                                                    <span>No orders found</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>

                <DialogFooter className="px-6 py-4 border-t bg-muted/10">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Held Value</span>
                            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                ₱{totalHeldValue.toLocaleString()}
                            </span>
                        </div>
                        <Button onClick={onClose} variant="secondary">Close</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
