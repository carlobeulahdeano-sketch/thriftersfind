"use client";


import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    X,
    Send,
    Phone,
    Video,
    Minus,
    Image as ImageIcon,
    PlusCircle,
    Smile,
    ThumbsUp,
    ArrowRightLeft
} from "lucide-react";
import { sendMessage, getMessages } from "./chat-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns"; // You might need to install date-fns if not present, but I'll use Intl if not

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ChatBoxProps {
    user: User;
    currentUser: User | null;
    onClose: () => void;
}

interface Message {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    createdAt: Date;
    sender?: {
        name: string;
        image?: string | null;
    };
}

export function ChatBox({ user, currentUser, onClose }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sending, setSending] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const { toast } = useToast();

    // Fetch messages on mount and when user changes
    useEffect(() => {
        let isMounted = true;

        async function fetchMessages() {
            setLoading(true);
            try {
                // Dynamically import markMessagesAsRead as well
                const { getMessages, markMessagesAsRead } = await import("./chat-actions");

                // Mark messages as read immediately when opening chat
                markMessagesAsRead(user.id).catch(err => console.error("Failed to mark read", err));

                const result = await getMessages(user.id);
                if (isMounted) {
                    if (result.success && Array.isArray(result.data)) {
                        setMessages(result.data as unknown as Message[]);
                    } else {
                        console.error("Failed to load messages:", result.error);
                        toast({
                            variant: "destructive",
                            title: "Error",
                            description: "Failed to load history.",
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to load messages", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchMessages();

        return () => {
            isMounted = false;
        };
    }, [user.id, toast]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (!isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isMinimized]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() && !sending) return;
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const result = await sendMessage(user.id, newMessage);
            if (result.success && result.message) {
                // Optimistically update or just append the returned message
                // This avoids a race condition if getMessages is faster than DB commit (unlikely but possible)
                // or simply saves a network call.
                const newMsg = result.message as unknown as Message;

                // Ensure the sender info is populated if needed for display immediately
                // The server action returns the message model, which might not have 'sender' relation populated fully
                // effectively we might need to mock it or rely on the fact that we know who sent it (current user)
                if (!newMsg.sender) {
                    // We can construct the sender object part since we know the current user
                    // However, we don't have the current user OBJECT accessible fully here easily unless we pass it down
                    // But wait, we assume 'user' prop is the OTHER user. We need the CURRENT user.
                    // The chat-box doesn't seem to have the 'currentUser' prop?
                    // Ah, wait. 'user' prop in ChatBox is the 'receiver' (the person we are chatting WITH).
                    // We need to know who 'I' am to display 'me' messages correctly?
                    // The 'Message' interface has 'senderId'.
                    // isMe = msg.receiverId === user.id. 
                    // If I sent it, receiverId IS user.id. So isMe is TRUE.
                    // So we just need the message object.
                }

                setMessages((prev) => [...prev, newMsg]);
                setNewMessage("");
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to send message",
                });
            }
        } catch (error) {
            console.error("Failed to send message", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred",
            });
        } finally {
            setSending(false);
        }
    };

    // Portal mount handling
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    const handleProductSelect = async (product: any) => {
        setIsProductModalOpen(false);
        const prefix = product.isRequest ? "📢 REQUESTING Product from Warehouse:" : "📦 Shared Product:";
        const productMessage = `${prefix}\nName: ${product.productName}\nSKU: ${product.sku}${product.isRequest ? "" : `\nCost: ₱${product.cost}`}`;
        setNewMessage(productMessage);
        // Optionally auto-send:
        // await sendMessage(user.id, productMessage);
        // const updatedMessages = await getMessages(user.id);
        // setMessages(updatedMessages as unknown as Message[]);
    };

    // Content to render
    const content = (
        <>
            {isMinimized ? (
                <div className="fixed bottom-0 right-10 w-64 bg-background border border-border/40 rounded-t-lg shadow-2xl z-[100] overflow-hidden cursor-pointer" onClick={() => setIsMinimized(false)}>
                    <div className="p-3 bg-background flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 ring-2 ring-background">
                                <AvatarImage src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-sm truncate">{user.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onClose(); }}>
                            <X className="h-4 w-4 text-primary" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="fixed bottom-0 right-10 w-80 h-[450px] bg-background border border-border/40 rounded-t-xl shadow-2xl flex flex-col z-[100] overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="p-2 px-3 border-b shadow-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between sticky top-0 z-10">
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded-md transition-colors flex-1" onClick={() => setIsMinimized(true)}>
                            <div className="relative">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm leading-none">{user.name}</span>
                                <span className="text-[10px] text-muted-foreground mt-0.5">Active now</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                                <Phone className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                                <Video className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setIsMinimized(true)}>
                                <Minus className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={onClose}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                        {/* Profile Hero Section */}
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 opacity-80">
                            <Avatar className="h-24 w-24 mb-2">
                                <AvatarImage src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} />
                                <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <h3 className="font-bold text-lg">{user.name}</h3>
                            <p className="text-xs text-muted-foreground">You are connected on ThriftersFind</p>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                                Loading chat...
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const isMe = msg.receiverId === user.id;
                                const showAvatar = !isMe && (index === messages.length - 1 || messages[index + 1]?.receiverId === user.id);

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"} items-end group`}
                                    >
                                        {!isMe && (
                                            <Avatar className={`h-7 w-7 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                                                <AvatarImage src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
                                            <div
                                                className={`px-4 py-2 text-[15px] shadow-sm whitespace-pre-wrap ${isMe
                                                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md"
                                                    : "bg-muted text-foreground rounded-2xl rounded-tl-md"
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                                                {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(new Date(msg.createdAt))}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-2 border-t bg-background flex items-center gap-2">
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-muted rounded-full">
                                <ImageIcon className="h-5 w-5" />
                            </Button>
                            {(currentUser?.role?.name.toLowerCase() === 'super admin' || currentUser?.role?.name.toLowerCase() === 'staff') && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-primary hover:bg-muted rounded-full"
                                    onClick={() => setIsProductModalOpen(true)}
                                >
                                    <PlusCircle className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                        <form onSubmit={handleSendMessage} className="flex-1 flex items-center">
                            <div className="relative flex-1">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Aa"
                                    className="w-full rounded-2xl bg-muted/50 border-none px-4 py-2 focus-visible:ring-1 focus-visible:ring-primary h-9"
                                    disabled={sending}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-primary hover:bg-transparent"
                                >
                                    <Smile className="h-5 w-5" />
                                </Button>
                            </div>
                        </form>
                        <Button
                            onClick={() => handleSendMessage()}
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-primary hover:bg-muted rounded-full"
                            disabled={sending}
                        >
                            {newMessage.trim() ? <Send className="h-5 w-5" /> : <ThumbsUp className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            )}
            <ProductSelectorModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSelect={handleProductSelect}
                currentUser={currentUser}
                targetUser={user}
            />
        </>
    );

    // Use createPortal to render the chat box at the end of the document body
    // This ensures it breaks out of any stacking contexts (like transforms in nav headers)
    return createPortal(content, document.body);
}

function ProductSelectorModal({
    isOpen,
    onClose,
    onSelect,
    currentUser,
    targetUser
}: {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: any) => void;
    currentUser: User | null;
    targetUser?: any;
}) {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [transferringProduct, setTransferringProduct] = useState<any | null>(null);
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
    const [isBulkTransferring, setIsBulkTransferring] = useState(false);
    const { toast } = useToast();

    const handleTransferSuccess = () => {
        loadProducts(); // Refresh list to show updated quantities
    };

    useEffect(() => {
        if (isOpen) {
            loadProducts();
        }
    }, [isOpen]);

    async function loadProducts() {
        setLoading(true);
        try {
            // Dynamically import to avoid circular dependencies if any, or just call the action
            const { getAllWarehouseProducts } = await import("./chat-actions");
            const data = await getAllWarehouseProducts();
            setProducts(data);
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setLoading(false);
        }
    }

    const toggleProductSelection = (id: string) => {
        const next = new Set(selectedProductIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedProductIds(next);
    };

    const handleBulkTransfer = async () => {
        if (selectedProductIds.size === 0) return;

        setIsBulkTransferring(true);
        try {
            const { bulkTransferStock } = await import("./chat-actions");
            const result = await bulkTransferStock(Array.from(selectedProductIds), {
                id: targetUser.id,
                name: targetUser.name,
                email: targetUser.email
            });

            if (result.success) {
                toast({
                    title: "Bulk Transfer Successful",
                    description: `${selectedProductIds.size} products transferred to Main Inventory.`,
                });
                setSelectedProductIds(new Set());
                loadProducts();
            } else {
                toast({
                    variant: "destructive",
                    title: "Transfer Failed",
                    description: result.error || "Failed to transfer products",
                });
            }
        } catch (error) {
            console.error("Bulk transfer error:", error);
        } finally {
            setIsBulkTransferring(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.manufacturer && p.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[1000px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-8">
                        <DialogTitle>Warehouse Products</DialogTitle>
                        {currentUser?.role?.name.toLowerCase() === 'super admin' && selectedProductIds.size > 0 && (
                            <Button
                                size="sm"
                                className="h-8 gap-2 bg-primary hover:bg-primary/90"
                                onClick={handleBulkTransfer}
                                disabled={isBulkTransferring}
                            >
                                <ArrowRightLeft className="h-4 w-4" />
                                Transfer Selected ({selectedProductIds.size})
                            </Button>
                        )}
                    </div>
                </DialogHeader>
                <div className="space-y-4 flex-1 flex flex-col min-h-0">
                    <div className="relative">
                        <Input
                            placeholder="Search by name, SKU, or manufacturer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-muted/50"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-3 md:grid-cols-4 gap-2 min-h-[300px] content-start">
                        {loading ? (
                            <div className="col-span-full flex items-center justify-center p-8 text-muted-foreground">
                                Loading products...
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                <p>No products found.</p>
                            </div>
                        ) : (
                            filteredProducts.map(product => {
                                // Handle different image formats safely
                                let imageUrl = "/placeholder-image.jpg";
                                if (product.image) {
                                    imageUrl = product.image;
                                } else if (product.images) {
                                    if (Array.isArray(product.images) && product.images.length > 0) {
                                        imageUrl = product.images[0];
                                    } else if (typeof product.images === 'string') {
                                        imageUrl = product.images;
                                    }
                                }

                                return (
                                    <div
                                        key={product.id}
                                        className={`group relative flex flex-col bg-card border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-all ${selectedProductIds.has(product.id) ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'}`}
                                        onClick={() => onSelect(product)}
                                    >
                                        {currentUser?.role?.name.toLowerCase() === 'super admin' && (
                                            <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                    checked={selectedProductIds.has(product.id)}
                                                    onChange={() => toggleProductSelection(product.id)}
                                                />
                                            </div>
                                        )}
                                        <div className="h-40 w-full bg-muted relative overflow-hidden">
                                            {/* Using standard img for simplicity here, can swap to Next/Image if domains allowed */}
                                            {product.image || product.images ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={product.productName}
                                                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center w-full h-full text-muted-foreground bg-secondary/30">
                                                    <ImageIcon className="h-8 w-8 opacity-50" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2 flex flex-col gap-1">
                                            <h4 className="font-semibold text-[13px] truncate" title={product.productName}>
                                                {product.productName}
                                            </h4>
                                            <p className="text-[12px] text-muted-foreground truncate font-mono">
                                                {product.sku}
                                            </p>
                                            {currentUser?.role?.name.toLowerCase() === 'super admin' ? (
                                                <div className="grid grid-cols-2 gap-1 my-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-6 text-[9px] gap-1 px-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTransferringProduct(product);
                                                        }}
                                                    >
                                                        <ArrowRightLeft className="h-3 w-3" />
                                                        Partial
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-6 text-[9px] gap-1 px-1 bg-primary/5 hover:bg-primary/10 border-primary/20"
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                const { transferStock } = await import("./chat-actions");
                                                                const res = await transferStock(product.id, undefined, {
                                                                    id: targetUser.id,
                                                                    name: targetUser.name,
                                                                    email: targetUser.email
                                                                });
                                                                if (res.success) {
                                                                    toast({
                                                                        title: "Transfer Successful",
                                                                        description: `Entire product transferred to Main Inventory.`
                                                                    });
                                                                    loadProducts();
                                                                } else {
                                                                    toast({
                                                                        variant: "destructive",
                                                                        title: "Transfer Failed",
                                                                        description: (res as any).error || "Failed to transfer product"
                                                                    });
                                                                }
                                                            } catch (err) {
                                                                console.error("Transfer error:", err);
                                                            }
                                                        }}
                                                    >
                                                        <ArrowRightLeft className="h-3 w-3" />
                                                        All
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full h-6 text-[10px] my-1 gap-1 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSelect({ ...product, isRequest: true });
                                                    }}
                                                >
                                                    <ArrowRightLeft className="h-3 w-3" />
                                                    Request Item
                                                </Button>
                                            )}
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="font-bold text-cyan-400 text-xs">
                                                    ₱{product.cost}
                                                </span>
                                                <Badge className="bg-zinc-800 text-white hover:bg-zinc-700 text-[11px] px-1.5 h-4 border-none">
                                                    QTY:{product.quantity > 0 ? `${product.quantity}` : '0'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
                <TransferStockModal
                    isOpen={!!transferringProduct}
                    onClose={() => setTransferringProduct(null)}
                    product={transferringProduct}
                    onSuccess={handleTransferSuccess}
                    targetUser={targetUser}
                />
            </DialogContent>
        </Dialog>
    );
}

function TransferStockModal({
    isOpen,
    onClose,
    product,
    onSuccess,
    targetUser
}: {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    onSuccess: () => void;
    targetUser?: any;
}) {
    const { toast } = useToast();
    const [quantity, setQuantity] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingStock, setExistingStock] = useState<{ quantity: number } | null>(null);

    useEffect(() => {
        if (isOpen && product) {
            checkExistingStock();
        }
    }, [isOpen, product]);

    const checkExistingStock = async () => {
        try {
            const { getProductBySku } = await import("./chat-actions");
            const existing = await getProductBySku(product.sku);
            if (existing) {
                setExistingStock({ quantity: existing.quantity });
            } else {
                setExistingStock({ quantity: 0 });
            }
        } catch (error) {
            console.error("Failed to check existing stock", error);
        }
    };

    const handleTransfer = async () => {
        if (!product) return;

        const transferQty = parseInt(quantity);
        if (!quantity || transferQty <= 0 || transferQty > product.quantity) {
            toast({
                variant: "destructive",
                title: "Invalid Quantity",
                description: `Please enter a valid quantity between 1 and ${product.quantity}.`,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const { transferStock } = await import("./chat-actions");
            const result = await transferStock(product.id, transferQty, {
                id: targetUser.id,
                name: targetUser.name,
                email: targetUser.email
            });

            if (result.success) {
                toast({
                    title: "Transfer Successful",
                    description: `${transferQty} units transferred to Main Inventory.`,
                });
                setQuantity("");
                onClose();
                onSuccess();
            } else {
                toast({
                    variant: "destructive",
                    title: "Transfer Failed",
                    description: (result as any).error || "Failed to transfer product.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!product) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md z-[110]">
                <DialogHeader>
                    <DialogTitle>Transfer to Inventory</DialogTitle>
                    <DialogDescription>
                        Transfer stock from warehouse to main inventory.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <div className="text-sm font-medium text-muted-foreground">Product</div>
                        <div className="text-base font-semibold">{product.productName}</div>
                        <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                    </div>

                    <div className="grid gap-2">
                        <div className="text-sm font-medium text-muted-foreground">Available Quantity</div>
                        <Badge variant="secondary" className="w-fit">
                            {product.quantity} units
                        </Badge>
                    </div>

                    <div className="grid gap-2">
                        <Label>Destination</Label>
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                            <span className="text-sm">Main Inventory</span>
                            {existingStock && (
                                <Badge variant="outline" className="ml-auto">
                                    Current: {existingStock.quantity}
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="quantity">Quantity to Transfer</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            max={product.quantity}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder={`Max: ${product.quantity}`}
                            className="h-8"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting} size="sm">
                        Cancel
                    </Button>
                    <Button onClick={handleTransfer} disabled={isSubmitting} size="sm">
                        {isSubmitting ? "Transferring..." : "Transfer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
