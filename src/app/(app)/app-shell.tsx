"use client";


import React from "react";
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarInset,
    SidebarTrigger,
    SidebarFooter,
    SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { NavLinks } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";
import { MessengerNav } from "@/components/messenger-nav";
import { NotificationBell } from "@/components/notification-bell";
import Breadcrumbs from "@/components/breadcrumbs";
import { User } from "@/lib/types";

interface AppShellProps {
    children: React.ReactNode;
    user: User | null;
}

export function AppShell({ children, user }: AppShellProps) {
    return (
        <SidebarProvider suppressHydrationWarning>
            <Sidebar collapsible="icon" className="border-r border-sidebar-border print:hidden">
                <SidebarRail />
                <SidebarHeader>
                    <Logo className="text-sidebar-foreground" />
                </SidebarHeader>
                <SidebarContent>
                    <NavLinks permissions={user?.permissions || undefined} role={user?.role?.name} />
                </SidebarContent>
                <SidebarFooter>
                    {/* Footer content if any */}
                </SidebarFooter>
            </Sidebar>
            <SidebarInset className="print:m-0">
                <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 print:hidden">
                    <SidebarTrigger />
                    <div className="flex-1">
                        <Breadcrumbs />
                    </div>
                    <MessengerNav currentUser={user} />
                    <NotificationBell currentUser={user} />
                    <ThemeToggle />
                    <UserNav user={user} />
                </header>
                <main className="flex-1 overflow-auto p-4 md:p-8 print:p-0 print:overflow-visible">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
