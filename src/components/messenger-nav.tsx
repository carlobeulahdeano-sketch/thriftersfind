"use client";

import React, { useEffect, useState } from "react";
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

interface MessengerNavProps {
    currentUser: User | null;
}

export function MessengerNav({ currentUser }: MessengerNavProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        async function fetchUsersAndCounts() {
            try {
                const usersData = await getUsers();
                setUsers(usersData);

                const counts = await getUnreadCounts();
                setUnreadCounts(counts);
            } catch (error) {
                console.error("Failed to fetch messenger data", error);
            } finally {
                setLoading(false);
            }
        }

        // Initial fetch
        fetchUsersAndCounts();

        // Optional: Poll for new messages every 30 seconds
        const interval = setInterval(fetchUsersAndCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
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
                        <div className="max-h-[300px] overflow-y-auto">
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
            {selectedUser && (
                <ChatBox
                    user={selectedUser}
                    currentUser={currentUser}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </>
    );
}
