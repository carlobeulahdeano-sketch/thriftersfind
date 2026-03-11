"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useChatEvents, ChatEventData } from "@/hooks/use-chat-events";
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
    ArrowRightLeft,
    Package2,
    Search,
    CheckCheck,
    MoreVertical
} from "lucide-react";
import { sendMessage, getMessages, markMessagesAsRead, getAllWarehouseProducts, transferStock, getProductBySku, bulkTransferStock } from "./chat-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ChatBoxProps {
    user: User;
    currentUser: User | null;
    onClose: () => void;
    index?: number;
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

export function ChatBox({ user, currentUser, onClose, index = 0 }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sending, setSending] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const { toast } = useToast();
    const hasLoadedRef = useRef(false);
    const isMinimizedRef = useRef(isMinimized);
    const fetchMessagesRef = useRef<() => void>(() => { });

    // Keep the ref in sync with state
    useEffect(() => {
        isMinimizedRef.current = isMinimized;
    }, [isMinimized]);

    useEffect(() => {
        let isMounted = true;

        async function fetchMessages() {
            if (!currentUser) return;
            // Only show loading spinner on the very first load
            if (!hasLoadedRef.current) setLoading(true);
            try {
                // Using statically imported getMessages and markMessagesAsRead

                const result = await getMessages(String(user.id));
                if (isMounted) {
                    if (result.success && Array.isArray(result.data)) {
                        const newMsgs = result.data as unknown as Message[];

                        // Check if there are any unread messages from the other user
                        const hasUnread = newMsgs.some(m => m.senderId === user.id && !(m as any).read);

                        if (!isMinimizedRef.current && hasUnread) {
                            markMessagesAsRead(String(user.id)).catch(err => console.error("Failed to mark read", err));
                        }

                        setMessages((prev) => {
                            const hasChanges = newMsgs.length !== prev.length ||
                                (newMsgs.length > 0 && prev.length > 0 && newMsgs[newMsgs.length - 1].id !== prev[prev.length - 1].id);

                            return hasChanges ? newMsgs : prev;
                        });
                    }
                }
            } catch (error) {
                // Ignore "unexpected response" errors as they are likely from expired sessions
                if (error instanceof Error && !error.message.includes("unexpected response")) {
                    console.error("Failed to load messages", error);
                }
            } finally {
                if (isMounted && !hasLoadedRef.current) {
                    setLoading(false);
                    hasLoadedRef.current = true;
                }
            }
        }

        // Store fetchMessages in ref so SSE handler can call it
        fetchMessagesRef.current = fetchMessages;

        if (currentUser) {
            fetchMessages();
        }
        // Reduced polling interval — SSE handles real-time, this is a fallback
        const interval = setInterval(fetchMessages, 10000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [user.id, currentUser]);

    // SSE: immediately refresh messages when a new-message event involves this chat
    const handleChatEvent = useCallback((event: ChatEventData) => {
        // Use String() coercion to handle number/string type mismatch from Prisma Int IDs
        if (String(event.senderId) === String(user.id) || (currentUser && String(event.senderId) === String(currentUser.id))) {
            fetchMessagesRef.current();
        }
    }, [user.id, currentUser]);

    useChatEvents(handleChatEvent, !!currentUser);

    const prevMessageCountRef = useRef(0);

    useEffect(() => {
        if (!isMinimized && !loading) {
            // Only scroll smoothly if we're adding a new message to an existing list
            const isNewMessage = prevMessageCountRef.current > 0 && messages.length > prevMessageCountRef.current;
            messagesEndRef.current?.scrollIntoView({
                behavior: isNewMessage ? "smooth" : "auto"
            });
            prevMessageCountRef.current = messages.length;
        }
    }, [messages, isMinimized, loading]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim()) return;
        if (user.isActive === false) return;

        setSending(true);
        try {
            const result = await sendMessage(String(user.id), newMessage);
            if (result.success && result.message) {
                const newMsg = result.message as unknown as Message;
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

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    const handleProductSelect = async (product: any) => {
        // Only close modal for non-request actions (sharing products)
        if (!product.isRequest) {
            setIsProductModalOpen(false);
        }

        if (user.isActive === false) {
            toast({
                variant: "destructive",
                title: "Action Disabled",
                description: "Cannot share products with inactive users.",
            });
            return;
        }

        let imageUrl = "";
        if (product.image) {
            imageUrl = product.image;
        } else if (product.images) {
            if (Array.isArray(product.images) && product.images.length > 0) {
                imageUrl = product.images[0];
            } else if (typeof product.images === 'string') {
                imageUrl = product.images;
            }
        }

        const prefix = product.isRequest ? "📢 REQUESTING Product from Warehouse:" : "📦 Shared Product:";
        const imageTag = imageUrl ? `\n[[IMAGE:${imageUrl}]]` : "";
        const productMessage = `${prefix}\nName: ${product.productName}\nSKU: ${product.sku}${product.isRequest ? "" : `\nCost: ₱${product.cost}`}${imageTag}`;
        // Expand the chatbox if it was minimized
        setIsMinimized(false);

        // Immediately send the message instead of just setting the input
        setSending(true);
        try {
            // Using statically imported sendMessage
            const result = await sendMessage(String(user.id), productMessage);
            if (result.success && result.message) {
                const newMsg = result.message as unknown as Message;
                setMessages((prev) => [...prev, newMsg]);
                if (product.isRequest) {
                    toast({
                        title: "Request Sent",
                        description: `Request for "${product.productName}" has been sent.`,
                    });
                }
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

    const unreadCount = messages.filter(m => m.senderId === user.id && !(m as any).read).length;

    const content = (
        <>
            {isMinimized ? (
                <div
                    className="fixed bottom-6 z-[100] group animate-in slide-in-from-bottom-5 fade-in duration-300 flex flex-col items-center"
                    style={{ right: `${24 + index * 70}px` }}
                >
                    <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-sm font-medium rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-lg whitespace-nowrap">
                        {user.name}
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-slate-100 hover:bg-white text-slate-600 hover:text-red-500 border border-slate-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md z-10"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>

                    <button
                        onClick={() => {
                            setIsMinimized(false);
                            // Mark messages as read when expanding
                            if (unreadCount > 0) {
                                markMessagesAsRead(String(user.id)).catch(err => console.error("Failed to mark read", err));
                                // Optimistically update local messages read state so badge goes away
                                setMessages(prev => prev.map(m => m.senderId === user.id ? { ...m, read: true } : m));
                            }
                        }}
                        className="relative w-12 h-12 rounded-full shadow-2xl hover:scale-105 transition-transform duration-200 focus:outline-none ring-2 ring-white/50 dark:ring-slate-800/50"
                    >
                        <Avatar className="h-full w-full bg-white">
                            <AvatarImage src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} />
                            <AvatarFallback className="text-base">{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {user.isOnline === true ? (
                            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-900 shadow-sm" />
                        ) : (
                            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-slate-400 ring-2 ring-white dark:ring-slate-900 shadow-sm" />
                        )}

                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md border-[1.5px] border-white dark:border-slate-900 animate-in zoom-in">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            ) : (
                <div
                    className="fixed bottom-0 w-80 h-[450px] bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl flex flex-col z-[100] overflow-hidden border-2 border-slate-200 dark:border-slate-700 animate-in slide-in-from-bottom-10 fade-in duration-300"
                    style={{ right: `${40 + index * 340}px` }}
                >
                    {/* Enhanced Header */}
                    <div className="relative overflow-hidden shrink-0 z-10">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600" />
                        <div className="relative p-3 flex items-center justify-between">
                            <div
                                className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity flex-1"
                                onClick={() => setIsMinimized(true)}
                            >
                                <div className="relative">
                                    <Avatar className="h-10 w-10 ring-2 ring-white shadow-lg">
                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {user.isOnline === true ? (
                                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white" />
                                    ) : (
                                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-slate-400 ring-2 ring-white" />
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-white text-sm leading-none">{user.name}</span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        {user.isOnline === true ? (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                                <span className="text-[10px] text-blue-100">Active now</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                <span className="text-[10px] text-blue-100">Offline</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20">
                                    <Phone className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20">
                                    <Video className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setIsMinimized(true)}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={onClose}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <ScrollArea className="flex-1 min-h-0 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-slate-900">
                        <div className="p-4 space-y-4">
                            {/* Profile Hero Section */}
                            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20" />
                                    <Avatar className="relative h-20 w-20 ring-4 ring-white shadow-xl">
                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} />
                                        <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{user.name}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Connected on ThriftersFind</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center p-8">
                                    <div className="text-center">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3 animate-pulse">
                                            <Package2 className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">Loading messages...</p>
                                    </div>
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
                                                <Avatar className={cn("h-7 w-7 transition-opacity", showAvatar ? 'opacity-100' : 'opacity-0')}>
                                                    <AvatarImage src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} />
                                                    <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
                                                <div
                                                    className={cn(
                                                        "px-4 py-2.5 text-[15px] shadow-md whitespace-pre-wrap relative",
                                                        isMe
                                                            ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl rounded-br-md"
                                                            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-bl-md border border-slate-200 dark:border-slate-700"
                                                    )}
                                                >
                                                    {(() => {
                                                        const imageMatch = msg.content.match(/\[\[IMAGE:(.*?)\]\]/);
                                                        const imageUrl = imageMatch ? imageMatch[1] : null;
                                                        const textContent = msg.content.replace(/\[\[IMAGE:.*?\]\]/, '').trim();

                                                        return (
                                                            <>
                                                                {imageUrl && (
                                                                    <div className="mb-2 -mx-1 -mt-1">
                                                                        <img
                                                                            src={imageUrl}
                                                                            alt="Shared Image"
                                                                            className="rounded-xl max-h-48 w-full object-cover border-2 border-white/20 shadow-sm"
                                                                            onError={(e) => {
                                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                            }}
                                                                        />
                                                                    </div>
                                                                )}
                                                                {textContent}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(new Date(msg.createdAt))}
                                                    </span>
                                                    {isMe && <CheckCheck className="w-3 h-3 text-blue-600" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} className="h-4 w-full shrink-0" />
                        </div>
                    </ScrollArea>

                    {/* Enhanced Input Area */}
                    <div className="p-2 border-t-2 bg-white dark:bg-slate-900 dark:border-slate-800 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-full"
                                    disabled={user.isActive === false}
                                >
                                    <ImageIcon className="h-5 w-5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    title="Warehouse Products"
                                    className="h-9 w-9 text-purple-600 hover:bg-purple-50 rounded-full"
                                    onClick={() => setIsProductModalOpen(true)}
                                    disabled={user.isActive === false}
                                >
                                    <Package2 className="h-5 w-5" />
                                </Button>
                            </div>
                            <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={user.isActive === false ? "Cannot chat with inactive user..." : "Type a message..."}
                                        className="w-full rounded-full bg-slate-100 dark:bg-slate-800 dark:text-slate-100 border-2 border-transparent focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 px-4 py-2 h-9 pr-10"
                                        disabled={sending || user.isActive === false}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-slate-400 hover:text-slate-600 hover:bg-transparent"
                                    >
                                        <Smile className="h-4 w-4" />
                                    </Button>
                                </div>
                            </form>
                            <Button
                                onClick={() => handleSendMessage()}
                                size="icon"
                                className={cn(
                                    "h-9 w-9 rounded-full shadow-lg transition-all",
                                    newMessage.trim()
                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-blue-500/30"
                                        : "bg-slate-200 hover:bg-slate-300 text-slate-600"
                                )}
                                disabled={sending || user.isActive === false}
                            >
                                {newMessage.trim() ? <Send className="h-4 w-4 text-white" /> : <ThumbsUp className="h-4 w-4" />}
                            </Button>
                        </div>
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
    const [isBulkTransferModalOpen, setIsBulkTransferModalOpen] = useState(false);
    const { toast } = useToast();

    const handleTransferSuccess = () => {
        loadProducts();
    };

    useEffect(() => {
        if (isOpen) {
            loadProducts();
        }
    }, [isOpen]);

    async function loadProducts() {
        setLoading(true);
        try {
            // Using statically imported getAllWarehouseProducts
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

    const handleBulkTransferClick = () => {
        if (selectedProductIds.size === 0) return;
        setIsBulkTransferModalOpen(true);
    };

    const handleBulkTransferSuccess = () => {
        setSelectedProductIds(new Set());
        loadProducts();
    };

    const filteredProducts = products.filter(p =>
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.manufacturer && p.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-6xl h-[85vh] flex flex-col p-0 z-[150] overflow-hidden bg-white dark:bg-slate-950">
                {/* Enhanced Header */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600" />
                    <div className="relative p-6">
                        <DialogHeader>
                            <div className="flex items-center justify-between pr-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <Package2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl font-bold text-white">Warehouse Products</DialogTitle>
                                        <p className="text-purple-100 text-sm mt-1">Browse and transfer inventory items</p>
                                    </div>
                                </div>
                                {currentUser?.permissions?.adminManage && selectedProductIds.size > 0 && (
                                    <Button
                                        size="sm"
                                        className="h-10 gap-2 bg-white text-purple-600 hover:bg-white/90 shadow-lg font-semibold"
                                        onClick={handleBulkTransferClick}
                                    >
                                        <ArrowRightLeft className="h-4 w-4" />
                                        Transfer Selected ({selectedProductIds.size})
                                    </Button>
                                )}
                            </div>
                        </DialogHeader>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4 flex-1 flex flex-col min-h-0 px-6 pb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, SKU, or manufacturer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-12 border-2 focus:border-purple-400 bg-white dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800"
                        />
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-4">
                            {loading ? (
                                <div className="col-span-full flex items-center justify-center p-16">
                                    <div className="text-center">
                                        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
                                            <Package2 className="w-8 h-8 text-purple-600" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">Loading products...</p>
                                    </div>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center p-16">
                                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <p className="text-base font-medium text-slate-700 mb-1">No products found</p>
                                    <p className="text-sm text-muted-foreground">Try adjusting your search terms</p>
                                </div>
                            ) : (
                                filteredProducts.map(product => {
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

                                    const isSelected = selectedProductIds.has(String(product.id));

                                    return (
                                        <div
                                            key={product.id}
                                            className={cn(
                                                "group relative flex flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden transition-all duration-200 border-2 shadow-sm hover:shadow-lg",
                                                isSelected
                                                    ? 'border-purple-500 ring-2 ring-purple-200 shadow-purple-200 dark:shadow-purple-900/50'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700'
                                            )}
                                        >
                                            {currentUser?.permissions?.adminManage && (
                                                <div className="absolute top-3 left-3 z-10" onClick={(e) => { e.stopPropagation(); toggleProductSelection(product.id); }}>
                                                    <div className={cn(
                                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                                        isSelected
                                                            ? "bg-purple-600 border-purple-600"
                                                            : "bg-white border-slate-300 hover:border-purple-400"
                                                    )}>
                                                        {isSelected && (
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="h-44 w-full bg-gradient-to-br from-slate-100 to-purple-50 relative overflow-hidden">
                                                {product.image || product.images ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={product.productName}
                                                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center w-full h-full">
                                                        <ImageIcon className="h-12 w-12 text-slate-300" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-3 flex flex-col gap-2">
                                                <h4 className="font-semibold text-sm truncate text-slate-900 dark:text-slate-100" title={product.productName}>
                                                    {product.productName}
                                                </h4>
                                                <Badge variant="outline" className="w-fit text-[10px] font-mono">
                                                    {product.sku}
                                                </Badge>

                                                {currentUser?.permissions?.adminManage ? (
                                                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-[10px] gap-1 px-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
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
                                                            className="h-7 text-[10px] gap-1 px-2 bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100 hover:border-purple-300"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    // Using statically imported transferStock
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

                                                                        try {
                                                                            // Using statically imported sendMessage
                                                                            let imageUrl = "";
                                                                            if (product.image) imageUrl = product.image;
                                                                            else if (product.images) {
                                                                                if (Array.isArray(product.images)) imageUrl = product.images[0] || "";
                                                                                else if (typeof product.images === 'string') imageUrl = product.images;
                                                                            }
                                                                            const imageTag = imageUrl ? `\n[[IMAGE:${imageUrl}]]` : "";
                                                                            await sendMessage(targetUser.id, `✅ Transfer Successful: All stock of ${product.productName}\nSKU: ${product.sku}\ntransferred to your inventory.${imageTag}`);
                                                                        } catch (err) {
                                                                            console.error("Failed to send confirmation msg", err);
                                                                        }
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
                                                            All Stock
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full h-7 text-[10px] mt-1 gap-1 border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onSelect({ ...product, isRequest: true });
                                                        }}
                                                    >
                                                        <ArrowRightLeft className="h-3 w-3" />
                                                        Request Item
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <TransferStockModal
                    isOpen={!!transferringProduct}
                    onClose={() => setTransferringProduct(null)}
                    product={transferringProduct}
                    onSuccess={handleTransferSuccess}
                    targetUser={targetUser}
                />

                <BulkTransferModal
                    isOpen={isBulkTransferModalOpen}
                    onClose={() => setIsBulkTransferModalOpen(false)}
                    selectedProducts={products.filter(p => selectedProductIds.has(String(p.id)))}
                    onSuccess={handleBulkTransferSuccess}
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
            // Using statically imported getProductBySku
            const existing = await getProductBySku(product.sku, targetUser?.id);
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
            // Using statically imported transferStock
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

                try {
                    // Using statically imported sendMessage
                    let imageUrl = "";
                    if (product.image) imageUrl = product.image;
                    else if (product.images) {
                        if (Array.isArray(product.images)) imageUrl = product.images[0] || "";
                        else if (typeof product.images === 'string') imageUrl = product.images;
                    }
                    const imageTag = imageUrl ? `\n[[IMAGE:${imageUrl}]]` : "";
                    await sendMessage(targetUser.id, `✅ Transfer Successful: ${transferQty} unit(s) of ${product.productName}\nSKU: ${product.sku}\ntransferred to your inventory.${imageTag}`);
                } catch (err) {
                    console.error("Failed to send confirmation msg", err);
                }
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
            <DialogContent className="sm:max-w-md z-[160] p-0 overflow-hidden bg-white">
                {/* Header */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />
                    <div className="relative p-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-white">Transfer to Inventory</DialogTitle>
                            <DialogDescription className="text-blue-100">
                                Transfer stock from warehouse to main inventory
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-xl p-4 border-2 border-purple-200">
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-slate-600">Product</div>
                            <div className="text-lg font-bold text-slate-900">{product.productName}</div>
                            <Badge variant="outline" className="font-mono">{product.sku}</Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-200">
                            <div className="text-xs font-medium text-blue-600 mb-1">Available</div>
                            <div className="text-2xl font-bold text-blue-700">{product.quantity}</div>
                            <div className="text-xs text-blue-600 mt-0.5">units</div>
                        </div>
                        {existingStock && (
                            <div className="bg-purple-50 rounded-lg p-3 border-2 border-purple-200">
                                <div className="text-xs font-medium text-purple-600 mb-1">Current Stock</div>
                                <div className="text-2xl font-bold text-purple-700">{existingStock.quantity}</div>
                                <div className="text-xs text-purple-600 mt-0.5">in inventory</div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-sm font-semibold text-slate-700">
                            Quantity to Transfer
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            max={product.quantity}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder={`Max: ${product.quantity}`}
                            className="h-11 border-2 focus:border-purple-400"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t-2 bg-slate-50">
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 h-11 border-2"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleTransfer}
                            disabled={isSubmitting}
                            className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg font-semibold"
                        >
                            {isSubmitting ? "Transferring..." : "Transfer Stock"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function BulkTransferModal({
    isOpen,
    onClose,
    selectedProducts,
    onSuccess,
    targetUser
}: {
    isOpen: boolean;
    onClose: () => void;
    selectedProducts: any[];
    onSuccess: () => void;
    targetUser?: any;
}) {
    const { toast } = useToast();
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize quantities with max available stock
    useEffect(() => {
        if (isOpen && selectedProducts.length > 0) {
            const initialQuantities: Record<string, string> = {};
            selectedProducts.forEach(p => {
                initialQuantities[p.id] = p.quantity.toString();
            });
            setQuantities(initialQuantities);
        }
    }, [isOpen, selectedProducts]);

    const handleQuantityChange = (id: string, value: string) => {
        setQuantities(prev => ({ ...prev, [id]: value }));
    };

    const handleTransferAllClick = () => {
        const resetQuantities: Record<string, string> = {};
        selectedProducts.forEach(p => {
            resetQuantities[p.id] = p.quantity.toString();
        });
        setQuantities(resetQuantities);
    };

    const handleTransfer = async () => {
        const transfers: { id: string, quantity: number }[] = [];

        // Validate inputs
        for (const product of selectedProducts) {
            const qtyStr = quantities[product.id];
            const qty = parseInt(qtyStr);

            if (!qtyStr || isNaN(qty) || qty <= 0 || qty > product.quantity) {
                toast({
                    variant: "destructive",
                    title: "Invalid Quantity",
                    description: `Please enter a valid quantity for ${product.productName} (1-${product.quantity}).`,
                });
                return;
            }
            transfers.push({ id: product.id, quantity: qty });
        }

        if (transfers.length === 0) return;

        setIsSubmitting(true);
        try {
            // Using statically imported bulkTransferStock
            const result = await bulkTransferStock(transfers, {
                id: targetUser.id,
                name: targetUser.name,
                email: targetUser.email
            });

            if (result.success) {
                toast({
                    title: "Bulk Transfer Successful",
                    description: `${transfers.length} products transferred to Main Inventory.`,
                });

                try {
                    // Using statically imported sendMessage
                    await sendMessage(targetUser.id, `✅ Bulk Transfer Successful: ${transfers.length} products transferred to your inventory.`);
                } catch (err) {
                    console.error("Failed to send confirmation msg", err);
                }

                onClose();
                onSuccess();
            } else {
                toast({
                    variant: "destructive",
                    title: "Transfer Failed",
                    description: (result as any).error || "Failed to transfer products",
                });
            }
        } catch (error) {
            console.error("Bulk transfer error:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (selectedProducts.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl z-[160] p-0 overflow-hidden bg-white">
                {/* Header */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />
                    <div className="relative p-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-white">Bulk Transfer Stock</DialogTitle>
                            <DialogDescription className="text-blue-100">
                                Specify transfer quantities for the selected products
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-semibold text-slate-700">{selectedProducts.length} Items Selected</span>
                        <Button variant="outline" size="sm" onClick={handleTransferAllClick} className="text-xs">
                            Set All to Max Max Stock
                        </Button>
                    </div>
                    <ScrollArea className="h-[40vh] border rounded-md">
                        <div className="p-4 space-y-4">
                            {selectedProducts.map(product => {
                                let imageUrl = "/placeholder-image.jpg";
                                if (product.image) imageUrl = product.image;
                                else if (product.images && Array.isArray(product.images) && product.images.length > 0) imageUrl = product.images[0];
                                else if (product.images && typeof product.images === 'string') imageUrl = product.images;

                                return (
                                    <div key={product.id} className="flex gap-4 items-center p-3 bg-slate-50 dark:bg-slate-900 border rounded-lg">
                                        <img src={imageUrl} alt={product.productName} className="w-12 h-12 rounded object-cover border bg-white" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate" title={product.productName}>{product.productName}</p>
                                            <p className="text-xs text-muted-foreground mr-2">Avail: {product.quantity}</p>
                                        </div>
                                        <div className="w-24">
                                            <Input
                                                type="number"
                                                min="1"
                                                max={product.quantity}
                                                value={quantities[product.id] || ""}
                                                onChange={(e) => handleQuantityChange(String(product.id), e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </div>

                {/* Footer */}
                <div className="p-6 border-t-2 bg-slate-50">
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 h-11 border-2"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleTransfer}
                            disabled={isSubmitting}
                            className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg font-semibold"
                        >
                            {isSubmitting ? "Transferring..." : "Confirm Transfer"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}