"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ProductSales {
    name: string;
    quantity: number;
    sales: number;
}

interface BatchDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    batchName: string;
    topProducts?: ProductSales[];
}

export function BatchDetailsDialog({
    isOpen,
    onClose,
    batchName,
    topProducts = []
}: BatchDetailsDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{batchName} - Top Products</DialogTitle>
                    <DialogDescription>
                        Highest selling products in this batch by quantity.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                {/* <TableHead className="text-right">Est. Revenue</TableHead> */}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topProducts.map((product, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {index < 3 && (
                                                <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                                    {index + 1}
                                                </Badge>
                                            )}
                                            {product.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">{product.quantity}</TableCell>
                                    {/* <TableCell className="text-right">₱{product.sales.toLocaleString()}</TableCell> */}
                                </TableRow>
                            ))}
                            {topProducts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                                        No product data available.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
