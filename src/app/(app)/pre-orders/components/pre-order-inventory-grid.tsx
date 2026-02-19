"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Image as ImageIcon, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface PreOrderItem {
    id: string;
    productName: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
    createdAt: Date;
    preOrder: {
        customerName: string;
        batch?: {
            batchName: string;
        } | null;
    };
    images?: any;
}

interface PreOrderInventoryGridProps {
    products: PreOrderItem[];
    onRefresh: () => void;
}

export default function PreOrderInventoryGrid({ products, onRefresh }: PreOrderInventoryGridProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = React.useState("");

    const filteredItems = React.useMemo(() => {
        return products.filter((item) => {
            const matchesSearch =
                item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.preOrder.customerName.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [products, searchTerm]);

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl shadow-sm border border-t-4 border-t-pink-500/50">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-foreground"
                        placeholder="Search items or customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm text-muted-foreground">
                    Total Items: <span className="font-medium text-foreground">{filteredItems.length}</span>
                </div>
            </div>

            {/* Product Table */}
            <Card className="rounded-xl border shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead className="w-[200px] font-semibold">Item Name</TableHead>
                                <TableHead className="font-semibold">Customer</TableHead>
                                <TableHead className="font-semibold">Batch</TableHead>
                                <TableHead className="text-center font-semibold">Qty</TableHead>
                                <TableHead className="text-right font-semibold">Price</TableHead>
                                <TableHead className="text-right font-semibold">Total</TableHead>
                                <TableHead className="text-right font-semibold">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item) => {
                                        // Handle images safely
                                        const imageUrl = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null;

                                        return (
                                            <motion.tr
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="border-b transition-colors hover:bg-muted/50"
                                            >
                                                <TableCell>
                                                    <Avatar className="h-9 w-9 rounded-md border">
                                                        <AvatarImage src={imageUrl} alt={item.productName} />
                                                        <AvatarFallback className="rounded-md bg-muted">
                                                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <span className="line-clamp-2">{item.productName}</span>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {item.preOrder.customerName}
                                                </TableCell>
                                                <TableCell>
                                                    {item.preOrder.batch ? (
                                                        <Badge variant="outline" className="font-normal">
                                                            {item.preOrder.batch.batchName}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-bold tabular-nums">{item.quantity}</span>
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                                    ₱{item.pricePerUnit.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums font-semibold">
                                                    ₱{item.totalPrice.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-muted-foreground">
                                                    {format(new Date(item.createdAt), 'MMM d, yyyy')}
                                                </TableCell>
                                            </motion.tr>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                            No items found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
