"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatBox } from "./chat/chat-box";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/lib/types";
import { getUsers } from "@/app/(app)/users/actions";
import { getUnreadCounts } from "./chat/chat-actions";
import { useChatEvents, ChatEventData } from "@/hooks/use-chat-events";

interface MessengerNavProps {
    currentUser: User | null;
}

export function MessengerNav({ currentUser }: MessengerNavProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeChats, setActiveChats] = useState<User[]>([]);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        setIsMounted(true);
        async function fetchUsersAndCounts() {
            try {
                const usersData = await getUsers();
                if (Array.isArray(usersData)) {
                    // Filter out inactive users
                    setUsers(usersData.filter(u => u.isActive !== false));
                } else {
                    console.warn("[MessengerNav] Received invalid users data:", usersData);
                    setUsers([]);
                }

                const counts = await getUnreadCounts();
                if (counts && typeof counts === 'object') {
                    setUnreadCounts(counts);
                } else {
                    console.warn("[MessengerNav] Received invalid unread counts:", counts);
                    setUnreadCounts({});
                }
            } catch (error) {
                // Only log if it's not a fetch error which we now handle gracefully at the server level
                if (error instanceof Error && !error.message.includes("unexpected response")) {
                    console.error("Failed to fetch messenger data", error);
                }
            } finally {
                setLoading(false);
            }
        }

        // Initial fetch
        fetchUsersAndCounts();

        // Poll less frequently since SSE handles real-time updates
        const interval = setInterval(fetchUsersAndCounts, 10000);
        return () => clearInterval(interval);
    }, [currentUser]);

    // SSE: Auto-open chat box when a new message arrives from another user
    const handleChatEvent = useCallback((event: ChatEventData) => {
        if (!currentUser) return;
        // Only auto-open for messages from OTHER users (not our own sends)
        // Use String() coercion to handle number/string type mismatch from Prisma Int IDs
        if (String(event.senderId) === String(currentUser.id)) return;

        // Update unread count immediately
        setUnreadCounts(prev => ({
            ...prev,
            [event.senderId]: (prev[event.senderId] || 0) + 1,
        }));

        // Auto-open the chat box for the sender
        setActiveChats(prev => {
            // If already chatting with this user, keep it (chat-box will pick up the event)
            if (prev.find(u => String(u.id) === String(event.senderId))) return prev;

            // Find the sender in our users list
            const sender = users.find(u => String(u.id) === String(event.senderId));
            if (sender) {
                return [...prev, sender];
            }

            // If sender not in the list yet, create a minimal user object
            return [...prev, {
                id: String(event.senderId),
                name: event.senderName,
                email: "",
                password: "",
                roleId: null,
                role: null,
                branchId: null,
                branch: null,
                permissions: null,
                createdAt: "",
                updatedAt: "",
            } as User];
        });
    }, [currentUser, users]);

    useChatEvents(handleChatEvent, !!currentUser);

    const totalUnread = unreadCounts ? Object.values(unreadCounts).reduce((a, b) => a + b, 0) : 0;

    if (!isMounted) {
        return (
            <Button variant="ghost" size="icon" className="relative">
                <MessageCircle className="h-5 w-5" />
                <span className="sr-only">Messenger</span>
            </Button>
        );
    }

    const handleUserSelect = (user: User) => {
        setActiveChats(prev => {
            if (prev.find(u => String(u.id) === String(user.id))) return prev;
            return [...prev, user];
        });
        // Optimistically clear unread count for this user
        // The ChatBox will handle the server-side update when it mounts
        setUnreadCounts(prev => ({ ...prev, [user.id]: 0 }));
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                        <MessageCircle className="h-5 w-5" />
                        {totalUnread > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {totalUnread > 9 ? "9+" : totalUnread}
                            </span>
                        )}
                        <span className="sr-only">Messenger</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end" forceMount>
                    <DropdownMenuLabel className="flex justify-between items-center">
                        Messenger
                        {totalUnread > 0 && <span className="text-xs font-normal text-muted-foreground">{totalUnread} new</span>}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Loading users...
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No users found.
                        </div>
                    ) : (
                        <div className="max-h-[480px] overflow-y-auto">
                            {users.map((user) => (
                                <DropdownMenuItem
                                    key={user.id}
                                    className="flex items-center gap-2 p-2 cursor-pointer justify-between"
                                    onClick={() => handleUserSelect(user)}
                                >
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8 relative">
                                            <AvatarImage
                                                src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                                alt={user.name}
                                            />
                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            {unreadCounts[user.id] > 0 && (
                                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
                                            )}
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className={`text-sm ${unreadCounts[user.id] > 0 ? "font-bold" : "font-medium"}`}>
                                                {user.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                    </div>
                                    {unreadCounts[user.id] > 0 && (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">
                                            {unreadCounts[user.id]}
                                        </span>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            {activeChats.map((chatUser, index) => (
                <ChatBox
                    key={chatUser.id}
                    user={chatUser}
                    currentUser={currentUser}
                    index={index}
                    onClose={() => {
                        setActiveChats(prev => prev.filter(u => u.id !== chatUser.id));
                    }}
                />
            ))}
        </>
    );
}
