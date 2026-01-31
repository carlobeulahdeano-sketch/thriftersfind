"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Order } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Package, User, CreditCard, Truck, Calendar, MapPin, Phone, Mail } from "lucide-react";

interface ViewOrderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
}

export function ViewOrderDialog({ isOpen, onClose, order }: ViewOrderDialogProps) {
    if (!order) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold">Order Details</DialogTitle>
                        <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                            #{order.id.substring(0, 8)}
                        </Badge>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 max-h-[calc(85vh-140px)]">
                    <div className="px-6 py-4 space-y-5">
                        {/* Status Section */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <CreditCard className="h-4 w-4" />
                                            <span className="font-semibold">Payment Status</span>
                                        </div>
                                        <Badge variant="secondary" className="text-sm">{order.paymentStatus}</Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Truck className="h-4 w-4" />
                                            <span className="font-semibold">Shipping Status</span>
                                        </div>
                                        <Badge variant="secondary" className="text-sm">{order.shippingStatus}</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Customer Information */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        <span>Customer Information</span>
                                    </div>
                                    <div className="grid gap-3 text-sm">
                                        <div className="flex items-start gap-3">
                                            <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground">Name</p>
                                                <p className="font-medium">{order.customerName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground">Contact Number</p>
                                                <p className="font-medium">{order.contactNumber || <span className="text-muted-foreground italic">Not provided</span>}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground">Email</p>
                                                <p className="font-medium break-all">{order.customerEmail || <span className="text-muted-foreground italic">Not provided</span>}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground">Delivery Address</p>
                                                <p className="font-medium">{order.address || <span className="text-muted-foreground italic">Not provided</span>}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Items Section */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                        <Package className="h-4 w-4" />
                                        <span>Order Items</span>
                                    </div>
                                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between items-start pb-3 border-b">
                                            <div className="flex-1">
                                                <p className="font-semibold text-base">{order.itemName}</p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Quantity: <span className="font-medium">{order.quantity}</span> × ₱{order.price.toFixed(2)}
                                                </p>
                                            </div>
                                            <p className="font-semibold text-base">₱{(order.price * order.quantity).toFixed(2)}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <p className="text-muted-foreground">Subtotal</p>
                                                <p className="font-medium">₱{(order.price * order.quantity).toFixed(2)}</p>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <p className="text-muted-foreground">Shipping Fee</p>
                                                <p className="font-medium">₱{order.shippingFee.toFixed(2)}</p>
                                            </div>
                                            <Separator className="my-2" />
                                            <div className="flex justify-between font-bold text-lg">
                                                <p>Total Amount</p>
                                                <p className="text-primary">₱{order.totalAmount.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Shipping Details */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                        <Truck className="h-4 w-4" />
                                        <span>Shipping Information</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                                            <p className="font-medium">{order.paymentMethod}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Courier</p>
                                            <p className="font-medium">{order.courierName || <span className="text-muted-foreground italic">Not assigned</span>}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Tracking Number</p>
                                            <p className="font-medium font-mono text-xs">{order.trackingNumber || <span className="text-muted-foreground italic">Not available</span>}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Order Date</p>
                                            <p className="font-medium">{order.orderDate}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Batch / Cycle</p>
                                            <p className="font-medium">{order.batch?.batchName || <span className="text-muted-foreground italic">None</span>}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-muted-foreground mb-1">Remarks</p>
                                            <p className="font-medium text-sm italic">{order.remarks || <span className="text-muted-foreground">None</span>}</p>
                                        </div>
                                    </div>
                                    {order.rushShip && (
                                        <div className="mt-3 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-4 py-2 rounded-lg text-sm font-bold text-center">
                                            🚀 RUSH SHIPMENT
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>

                <DialogFooter className="px-6 py-4 border-t">
                    <Button onClick={onClose} className="w-full">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
