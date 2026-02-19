"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PreOrder } from "@/lib/types";
import { recordPreOrderPayment } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface PayBalanceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    preOrder: PreOrder | null;
    onSuccess?: () => void;
}

export function PayBalanceDialog({ isOpen, onClose, preOrder, onSuccess }: PayBalanceDialogProps) {
    const { toast } = useToast();
    const [amount, setAmount] = React.useState<string>("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Calculate remaining balance
    const remainingBalance = preOrder
        ? preOrder.totalAmount - (preOrder.depositAmount || 0)
        : 0;

    // Reset form when dialog opens
    React.useEffect(() => {
        if (isOpen && preOrder) {
            setAmount(remainingBalance.toString());
        }
    }, [isOpen, preOrder, remainingBalance]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!preOrder) return;

        const paymentAmount = parseFloat(amount);

        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            toast({
                variant: "destructive",
                title: "Invalid Amount",
                description: "Please enter a valid payment amount",
            });
            return;
        }

        if (paymentAmount > remainingBalance) {
            toast({
                variant: "destructive",
                title: "Amount Too High",
                description: "Payment amount cannot exceed remaining balance",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await recordPreOrderPayment(preOrder.id, paymentAmount);
            toast({
                title: "Payment Recorded",
                description: `Successfully recorded payment of ₱${paymentAmount.toLocaleString()}`,
            });
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Failed to record payment:", error);
            toast({
                variant: "destructive",
                title: "Payment Failed",
                description: "Failed to record payment. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!preOrder) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Pay Balance</DialogTitle>
                    <DialogDescription>
                        Record a payment for {preOrder.customerName}'s pre-order
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Amount:</span>
                                <span className="font-medium">₱{preOrder.totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Already Paid:</span>
                                <span className="font-medium text-green-600">₱{(preOrder.depositAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-2">
                                <span className="text-muted-foreground">Remaining Balance:</span>
                                <span className="font-semibold text-red-600">₱{remainingBalance.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="amount">Payment Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={remainingBalance}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-7"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Payment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
