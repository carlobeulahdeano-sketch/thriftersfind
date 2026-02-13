"use client";

import { useEffect, useState } from "react";
import { Bell, Package, AlertTriangle, Clock, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getNotifications, markAllNotificationsAsRead } from "@/app/(app)/inventory/notifications-actions";
import { formatDistanceToNow } from "date-fns";
import { User } from "@/lib/types";

export function NotificationBell({ currentUser }: { currentUser: User | null }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.read).length);
      } else {
        console.warn("[NotificationBell] Received invalid data from server:", data);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      // Ignore "unexpected response" errors as they are likely from expired sessions
      if (error instanceof Error && !error.message.includes("unexpected response")) {
        console.error("[NotificationBell] Failed to fetch notifications:", error);
      }
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    setIsMounted(true);
    fetchNotifications();
    // Refresh notifications every 3 seconds for pseudo-realtime
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    fetchNotifications();
  };

  if (!isMounted) {
    return (
      <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
        <Bell className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Notifications</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 animate-pulse"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 p-0" align="end" forceMount>
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h4 className="text-sm font-semibold">Notifications</h4>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : "No new notifications"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-8 px-2" onClick={handleMarkAllRead}>
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[300px] overflow-y-auto">
          <div className="p-2">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">No notifications yet.</p>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors ${!notification.read ? "bg-accent/30" : ""
                      }`}
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notification.type === 'out_of_stock'
                        ? 'bg-red-100 dark:bg-red-900'
                        : notification.type === 'low_stock'
                          ? 'bg-orange-100 dark:bg-orange-900'
                          : 'bg-blue-100 dark:bg-blue-900'
                        }`}>
                        {notification.type === 'out_of_stock' || notification.type === 'low_stock' ? (
                          <AlertTriangle className={`h-4 w-4 ${notification.type === 'out_of_stock' ? 'text-red-600' : 'text-orange-600'
                            }`} />
                        ) : (
                          <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <div className="flex items-center mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-2 border-t">
          <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-foreground">
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

