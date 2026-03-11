"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Order } from "@/lib/types";
import { Send, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SendSmsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
}

export function SendSmsDialog({ isOpen, onClose, order }: SendSmsDialogProps) {
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen && order) {
            // Pre-fill or reset message when dialog opens
            setMessage(`Hi ${order.customerName}, regarding your order #${String(order.id).substring(0, 7)}...`);
        }
    }, [isOpen, order]);

    const handleSend = () => {
        setIsSending(true);
        // Simulate API call
        setTimeout(() => {
            setIsSending(false);
            toast({
                title: "Message Sent",
                description: `SMS sent to ${order?.contactNumber}`,
            });
            onClose();
        }, 1000);
    };

    if (!order) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Send SMS
                    </DialogTitle>
                    <DialogDescription>
                        Send a text message to the customer depending on their contact number.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="rounded-lg border p-4 bg-muted/50 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>Recipient:</span>
                            <span className="ml-auto">{order.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>Phone:</span>
                            <span className="ml-auto font-mono">{order.contactNumber}</span>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="message">Message</Label>
                            <span className="text-xs text-muted-foreground">{message.length} characters</span>
                        </div>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here..."
                            className="h-32 resize-none"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={isSending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSend} disabled={!message.trim() || isSending}>
                        {isSending ? "Sending..." : "Send Message"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
