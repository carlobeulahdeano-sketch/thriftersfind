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
    ArrowRightLeft,
    Package2,
    Search,
    CheckCheck,
    MoreVertical
} from "lucide-react";
import { sendMessage, getMessages } from "./chat-actions";
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

    useEffect(() => {
        let isMounted = true;
        let firstLoad = true;

        async function fetchMessages() {
            if (!currentUser) return;
            if (firstLoad) setLoading(true);
            try {
                const { getMessages, markMessagesAsRead } = await import("./chat-actions");

                if (!isMinimized) {
                    markMessagesAsRead(user.id).catch(err => console.error("Failed to mark read", err));
                }

                const result = await getMessages(user.id);
                if (isMounted) {
                    if (result.success && Array.isArray(result.data)) {
                        const newMsgs = result.data as unknown as Message[];
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
                if (isMounted && firstLoad) {
                    setLoading(false);
                    firstLoad = false;
                }
            }
        }

        if (currentUser) {
            fetchMessages();
        }
        const interval = setInterval(fetchMessages, 2000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [user.id, isMinimized, toast, currentUser]);

    useEffect(() => {
        if (!isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isMinimized]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const result = await sendMessage(user.id, newMessage);
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
        setIsProductModalOpen(false);

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
        setNewMessage(productMessage);
    };

    const content = (
        <>
            {isMinimized ? (
                <div
                    className="fixed bottom-0 right-10 w-80 bg-gradient-to-br from-blue-600 to-purple-600 rounded-t-2xl shadow-2xl z-[100] overflow-hidden cursor-pointer hover:shadow-blue-500/50 transition-all duration-300"
                    onClick={() => setIsMinimized(false)}
                >
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Avatar className="h-10 w-10 ring-2 ring-white shadow-lg">
                                    <AvatarImage src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white" />
                            </div>
                            <div>
                                <span className="font-semibold text-white text-sm block">{user.name}</span>
                                <span className="text-xs text-blue-100">Click to expand</span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white hover:bg-white/20"
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="fixed bottom-0 right-10 w-80 h-[450px] bg-white rounded-t-2xl shadow-2xl flex flex-col z-[100] overflow-hidden border-2 border-slate-200 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Enhanced Header */}
                    <div className="relative overflow-hidden">
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
                                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-white text-sm leading-none">{user.name}</span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                        <span className="text-[10px] text-blue-100">Active now</span>
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
                    <ScrollArea className="flex-1 bg-gradient-to-br from-slate-50 to-blue-50/30">
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
                                    <h3 className="font-bold text-lg text-slate-900">{user.name}</h3>
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
                                                            : "bg-white text-slate-900 rounded-2xl rounded-bl-md border border-slate-200"
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
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    {/* Enhanced Input Area */}
                    <div className="p-2 border-t-2 bg-white">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-blue-600 hover:bg-blue-50 rounded-full"
                                >
                                    <ImageIcon className="h-5 w-5" />
                                </Button>
                                {(currentUser?.role?.name?.toLowerCase() === 'super admin' || currentUser?.permissions?.warehouses) && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-purple-600 hover:bg-purple-50 rounded-full"
                                        onClick={() => setIsProductModalOpen(true)}
                                    >
                                        <PlusCircle className="h-5 w-5" />
                                    </Button>
                                )}
                            </div>
                            <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="w-full rounded-full bg-slate-100 border-2 border-transparent focus:border-blue-400 focus:bg-white px-4 py-2 h-9 pr-10"
                                        disabled={sending}
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
                                disabled={sending}
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
    const [isBulkTransferring, setIsBulkTransferring] = useState(false);
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

                try {
                    const { sendMessage } = await import("./chat-actions");
                    await sendMessage(targetUser.id, `✅ Bulk Transfer Successful: ${selectedProductIds.size} products transferred to your inventory.`);
                } catch (err) {
                    console.error("Failed to send confirmation msg", err);
                }

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
            <DialogContent className="sm:max-w-6xl h-[85vh] flex flex-col p-0 z-[150] overflow-hidden bg-white">
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
                                        onClick={handleBulkTransfer}
                                        disabled={isBulkTransferring}
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
                            className="pl-10 h-12 border-2 focus:border-purple-400 bg-white"
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

                                    const isSelected = selectedProductIds.has(product.id);

                                    return (
                                        <div
                                            key={product.id}
                                            className={cn(
                                                "group relative flex flex-col bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border-2 shadow-sm hover:shadow-lg",
                                                isSelected
                                                    ? 'border-purple-500 ring-2 ring-purple-200 shadow-purple-200'
                                                    : 'border-slate-200 hover:border-purple-300'
                                            )}
                                            onClick={() => onSelect(product)}
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
                                                <h4 className="font-semibold text-sm truncate text-slate-900" title={product.productName}>
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

                                                                        try {
                                                                            const { sendMessage } = await import("./chat-actions");
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

                try {
                    const { sendMessage } = await import("./chat-actions");
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