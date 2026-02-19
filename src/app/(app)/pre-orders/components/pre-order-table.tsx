"use client";

import * as React from "react";
import { Order, PaymentStatus, ShippingStatus, Customer, Product, Station, Batch, PreOrderProduct, PreOrder } from "@/lib/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag, Truck, Calendar, Filter, Archive, User, Package, PlusCircle, PhilippinePeso, Banknote } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

import { CreatePreOrderDialog } from "./create-pre-order-dialog";
import { PayBalanceDialog } from "./pay-balance-dialog";

interface PreOrderTableProps {
    orders: PreOrder[];
    customers: Customer[];
    stations: Station[];
    batches?: Batch[];
    onRefresh: () => void;
}

const statusBadgeStyles: Record<ShippingStatus, string> = {
    Pending: "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300",
    Ready: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300",
    Shipped: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    Delivered: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
    Claimed: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300",
    Cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300",
    "Rush Ship": "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
};

// Mock payment statuses for the filter UI - in real app this would likely be on the Order object
const PAYMENT_STATUSES = ["TO PAY", "DOWNPAYMENT", "PAID"];

export default function PreOrderTable({ orders, customers, stations, batches, onRefresh }: PreOrderTableProps) {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<string>("all");
    const [paymentStatusFilter, setPaymentStatusFilter] = React.useState<string>("all");
    const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);
    const [isPayBalanceDialogOpen, setPayBalanceDialogOpen] = React.useState(false);
    const [selectedPreOrder, setSelectedPreOrder] = React.useState<PreOrder | null>(null);

    const filteredOrders = React.useMemo(() => {
        return orders.filter((order) => {
            const matchesSearch =
                order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                order.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase());

            // For now status filter will be simple or mocked if not present in PreOrder directly
            // PreOrder doesn't have shippingStatus yet, maybe use paymentStatus as proxy or add it later.
            // Keeping logic simple for now.
            const matchesStatus = statusFilter === "all"; // || order.status === statusFilter;

            const matchesPaymentStatus = paymentStatusFilter === "all" ||
                (paymentStatusFilter === "PAID" && order.paymentStatus === "Paid") ||
                (paymentStatusFilter === "TO PAY" && order.paymentStatus === "Unpaid") ||
                (paymentStatusFilter === "DOWNPAYMENT" && order.paymentStatus === "Partial");

            return matchesSearch && matchesStatus && matchesPaymentStatus;
        });
    }, [orders, searchTerm, statusFilter, paymentStatusFilter]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-card p-4 rounded-xl shadow-sm border border-t-4 border-t-pink-500/50">
                <div className="relative w-full xl:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        placeholder="Search orders, items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
                    <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                            <div className="flex items-center gap-2">
                                <PhilippinePeso className="h-4 w-4" />
                                <SelectValue placeholder="Payment" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Payments</SelectItem>
                            {PAYMENT_STATUSES.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Status Filter for future use */}
                    <Select value={statusFilter} onValueChange={setStatusFilter} disabled>
                        <SelectTrigger className="w-full sm:w-[150px]">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white" onClick={() => setCreateDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Pre order
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[250px] font-semibold">Item Details</TableHead>
                            <TableHead className="font-semibold">Customer</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="text-right font-semibold">Total</TableHead>
                            <TableHead className="text-right text-green-600 font-semibold">Paid</TableHead>
                            <TableHead className="text-right text-red-600 font-semibold">Bal</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => {
                                    // Use depositAmount from DB
                                    const amountPaid = order.depositAmount || 0;
                                    const remainingBalance = Math.max(0, order.totalAmount - amountPaid);

                                    return (
                                        <motion.tr
                                            key={order.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="group border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                        >
                                            {/* Item Details Column */}
                                            <TableCell className="align-top py-4">
                                                <div className="space-y-1">
                                                    {order.items.map((item) => (
                                                        <div key={item.id} className="font-medium flex items-center gap-2 text-foreground">
                                                            <ShoppingBag className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                                                            <span className="line-clamp-1" title={item.productName}>
                                                                {item.productName} (x{item.quantity})
                                                            </span>
                                                        </div>
                                                    ))}
                                                    <div className="text-xs text-muted-foreground pl-5.5 mt-1">
                                                        {order.id.substring(0, 8)} • {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Customer Column */}
                                            <TableCell className="align-top py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border">
                                                        <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                                                            {getInitials(order.customerName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="grid gap-0.5">
                                                        <span className="font-medium text-sm leading-none">{order.customerName}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground font-mono">{order.paymentMethod}</span>
                                                            {order.batch && (
                                                                <div className="text-[10px] text-zinc-500 flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-1.5 rounded">
                                                                    <Calendar className="h-2.5 w-2.5" />
                                                                    {order.batch.batchName} ({format(new Date(order.batch.manufactureDate), 'MMM d')})
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Status Column - Circular Progress */}
                                            <TableCell className="align-top py-4">
                                                {(() => {
                                                    const amountPaid = order.depositAmount || 0;
                                                    const percentage = Math.round((amountPaid / order.totalAmount) * 100);
                                                    const circumference = 2 * Math.PI * 18; // radius = 18
                                                    const strokeDashoffset = circumference - (percentage / 100) * circumference;

                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative w-12 h-12">
                                                                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 40 40">
                                                                    {/* Background circle */}
                                                                    <circle
                                                                        cx="20"
                                                                        cy="20"
                                                                        r="18"
                                                                        stroke="currentColor"
                                                                        strokeWidth="4"
                                                                        fill="none"
                                                                        className="text-zinc-200 dark:text-zinc-700"
                                                                    />
                                                                    {/* Progress circle */}
                                                                    <circle
                                                                        cx="20"
                                                                        cy="20"
                                                                        r="18"
                                                                        stroke="currentColor"
                                                                        strokeWidth="4"
                                                                        fill="none"
                                                                        strokeDasharray={circumference}
                                                                        strokeDashoffset={strokeDashoffset}
                                                                        strokeLinecap="round"
                                                                        className={`transition-all duration-500 ${percentage === 100
                                                                            ? 'text-green-500'
                                                                            : percentage > 0
                                                                                ? 'text-blue-500'
                                                                                : 'text-zinc-400'
                                                                            }`}
                                                                    />
                                                                </svg>
                                                                {/* Percentage text */}
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <span className={`text-[10px] font-bold ${percentage === 100
                                                                        ? 'text-green-600'
                                                                        : percentage > 0
                                                                            ? 'text-blue-600'
                                                                            : 'text-zinc-500'
                                                                        }`}>
                                                                        {percentage}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </TableCell>

                                            {/* Total Column */}
                                            <TableCell className="align-top text-right py-4 font-medium tabular-nums">
                                                ₱{order.totalAmount.toLocaleString()}
                                            </TableCell>

                                            {/* Paid Column */}
                                            <TableCell className="align-top text-right py-4 font-medium tabular-nums text-green-600">
                                                ₱{amountPaid.toLocaleString()}
                                            </TableCell>

                                            {/* Balance Column */}
                                            <TableCell className={`align-top text-right py-4 font-medium tabular-nums ${remainingBalance > 0 ? 'text-red-600' : 'text-zinc-500'}`}>
                                                ₱{remainingBalance.toLocaleString()}
                                            </TableCell>

                                            {/* Action Column */}
                                            <TableCell className="align-top py-4">
                                                <div className="flex items-center gap-2">
                                                    {remainingBalance > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2 text-xs"
                                                            onClick={() => {
                                                                setSelectedPreOrder(order);
                                                                setPayBalanceDialogOpen(true);
                                                            }}
                                                        >
                                                            <Banknote className="h-3.5 w-3.5 mr-1" />
                                                            Pay
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No pre-orders found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </div>
            <div className="text-xs text-center text-muted-foreground">
                Showing {filteredOrders.length} records.
            </div>

            <CreatePreOrderDialog
                isOpen={isCreateDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                customers={customers}
                stations={stations}
                batches={batches}
                onSuccess={() => {
                    onRefresh();
                    setCreateDialogOpen(false);
                }}
            />

            <PayBalanceDialog
                isOpen={isPayBalanceDialogOpen}
                onClose={() => {
                    setPayBalanceDialogOpen(false);
                    setSelectedPreOrder(null);
                }}
                preOrder={selectedPreOrder}
                onSuccess={onRefresh}
            />
        </div>
    );
}
