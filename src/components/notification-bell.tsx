"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Bell, Package, AlertTriangle, Clock, CheckCheck, ChevronUp } from "lucide-react";
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

const COLLAPSED_COUNT = 3;

export function NotificationBell({ currentUser }: { currentUser: User | null }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [fadingOutIds, setFadingOutIds] = useState<Set<string>>(new Set());
  const [isDismissing, setIsDismissing] = useState(false);
  const animationTimers = useRef<NodeJS.Timeout[]>([]);

  const fetchNotifications = async () => {
    if (isDismissing) return; // Don't refresh while animating out
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
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Clean up animation timers on unmount
  useEffect(() => {
    return () => {
      animationTimers.current.forEach(clearTimeout);
    };
  }, []);

  const handleMarkAllRead = async () => {
    if (isDismissing || notifications.length === 0) return;

    setIsDismissing(true);
    animationTimers.current.forEach(clearTimeout);
    animationTimers.current = [];

    // Get the currently displayed notifications (reversed for bottom-to-top)
    const displayed = isExpanded
      ? [...notifications]
      : notifications.slice(0, COLLAPSED_COUNT);
    const reversed = [...displayed].reverse();

    // Stagger fade out from bottom to top
    reversed.forEach((notif, i) => {
      const timer = setTimeout(() => {
        setFadingOutIds((prev) => new Set(prev).add(notif.id));
      }, i * 100);
      animationTimers.current.push(timer);
    });

    // After all have faded, actually mark as read and reset
    const totalDelay = reversed.length * 100 + 350;
    const finalTimer = setTimeout(async () => {
      await markAllNotificationsAsRead();
      setNotifications([]);
      setUnreadCount(0);
      setFadingOutIds(new Set());
      setIsDismissing(false);
      setIsExpanded(false);
      setVisibleCount(0);
    }, totalDelay);
    animationTimers.current.push(finalTimer);
  };

  const handleViewAll = useCallback(() => {
    if (isExpanded) {
      // Collapse: reset immediately
      animationTimers.current.forEach(clearTimeout);
      animationTimers.current = [];
      setIsExpanded(false);
      setVisibleCount(0);
      return;
    }

    // Expand: stagger each notification after the collapsed ones
    setIsExpanded(true);
    const extraItems = notifications.length - COLLAPSED_COUNT;
    if (extraItems <= 0) return;

    setVisibleCount(0);
    animationTimers.current.forEach(clearTimeout);
    animationTimers.current = [];

    for (let i = 0; i < extraItems; i++) {
      const timer = setTimeout(() => {
        setVisibleCount((prev) => prev + 1);
      }, (i + 1) * 80);
      animationTimers.current.push(timer);
    }
  }, [isExpanded, notifications.length]);

  // Reset expanded state when dropdown closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      animationTimers.current.forEach(clearTimeout);
      animationTimers.current = [];
      setIsExpanded(false);
      setVisibleCount(0);
    }
  };

  if (!isMounted) {
    return (
      <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
        <Bell className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Notifications</span>
      </Button>
    );
  }

  const displayedNotifications = isExpanded
    ? notifications
    : notifications.slice(0, COLLAPSED_COUNT);

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
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
          <Button variant="ghost" size="sm" className="text-xs h-8 px-2" onClick={handleMarkAllRead}>
            <CheckCheck className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        </div>
        <ScrollArea className={isExpanded ? "max-h-[500px] overflow-y-auto" : "max-h-[300px] overflow-y-auto"} style={{ transition: "max-height 0.3s ease" }}>
          <div className="p-2">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">No notifications yet.</p>
            ) : (
              <div className="space-y-1">
                {displayedNotifications.map((notification, index) => {
                  const isNewlyRevealed = isExpanded && index >= COLLAPSED_COUNT;
                  const isVisible = !isNewlyRevealed || (index - COLLAPSED_COUNT) < visibleCount;

                  const isFadingOut = fadingOutIds.has(notification.id);

                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-all ${!notification.read ? "bg-accent/30" : ""}`}
                      style={{
                        opacity: isFadingOut
                          ? 0
                          : isNewlyRevealed
                            ? (isVisible ? 1 : 0)
                            : 1,
                        transform: isFadingOut
                          ? "translateX(-30px) scale(0.95)"
                          : isNewlyRevealed
                            ? isVisible
                              ? "translateY(0)"
                              : "translateY(12px)"
                            : "none",
                        maxHeight: isFadingOut ? "0px" : "200px",
                        padding: isFadingOut ? "0 12px" : undefined,
                        marginBottom: isFadingOut ? "0" : undefined,
                        overflow: "hidden",
                        transition: "opacity 0.3s ease, transform 0.3s ease, max-height 0.3s ease 0.1s, padding 0.3s ease 0.1s, margin 0.3s ease 0.1s",
                      }}
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
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
        {notifications.length > COLLAPSED_COUNT && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={handleViewAll}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show less
                </>
              ) : (
                `View all notifications (${notifications.length - COLLAPSED_COUNT} more)`
              )}
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


