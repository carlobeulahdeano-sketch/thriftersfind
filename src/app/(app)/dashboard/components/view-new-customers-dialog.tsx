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
import { Customer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserX, MapPin, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ViewNewCustomersDialogProps {
    isOpen: boolean;
    onClose: () => void;
    customers: Customer[];
    timeframe: "week" | "month" | "year";
}

export function ViewNewCustomersDialog({
    isOpen,
    onClose,
    customers,
    timeframe,
}: ViewNewCustomersDialogProps) {

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <Users className="h-6 w-6 text-purple-500" />
                                New Customers
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground">
                                Customers who joined this {timeframe}
                            </p>
                        </div>
                        <Badge variant="outline" className="text-sm px-3 py-1 bg-purple-50 text-purple-700 border-purple-200">
                            {customers.length} New
                        </Badge>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 max-h-[calc(90vh-140px)]">
                    <div className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="px-6">Customer</TableHead>
                                    <TableHead>Contact Info</TableHead>
                                    <TableHead>Joined Date</TableHead>
                                    <TableHead className="text-right px-6">Total Spent</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.length > 0 ? (
                                    customers.map((customer) => {
                                        // Determine join date from first order
                                        const firstOrder = (customer.orderHistory || []).reduce((earliest, current) => {
                                            if (!earliest) return current;
                                            return new Date(current.date) < new Date(earliest.date) ? current : earliest;
                                        }, null as any);

                                        const joinDate = firstOrder ? new Date(firstOrder.date) : new Date();

                                        return (
                                            <TableRow key={customer.id} className="hover:bg-muted/50">
                                                <TableCell className="px-6">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border">
                                                            <AvatarImage src={customer.avatar} alt={customer.name} />
                                                            <AvatarFallback>{customer.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-foreground">{customer.name}</span>
                                                            <div className="flex items-center text-xs text-muted-foreground gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                <span className="truncate max-w-[150px]">
                                                                    {customer.address?.city}, {customer.address?.state}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 text-sm">
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Mail className="h-3 w-3" />
                                                            <span className="truncate max-w-[150px]">{customer.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Phone className="h-3 w-3" />
                                                            <span>{customer.phone}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {format(joinDate, "MMM dd, yyyy")}
                                                </TableCell>
                                                <TableCell className="text-right px-6 font-bold font-mono text-purple-600 dark:text-purple-400">
                                                    ₱{(customer.totalSpent || 0).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <UserX className="h-8 w-8 opacity-30" />
                                                <span>No new customers found for this period</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </ScrollArea>

                <DialogFooter className="px-6 py-4 border-t bg-muted/10">
                    <Button onClick={onClose} variant="secondary">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
