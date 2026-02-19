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
            <Sidebar collapsible="icon" className="border-r border-sidebar-border/50 bg-sidebar/50 backdrop-blur-xl print:hidden transition-all duration-300">
                <SidebarRail />
                <SidebarHeader className="h-14 flex items-center justify-center border-b border-sidebar-border/50">
                    <Logo className="text-sidebar-foreground" />
                </SidebarHeader>
                <SidebarContent className="py-4">
                    <NavLinks permissions={user?.permissions || undefined} role={user?.role?.name} />
                </SidebarContent>
                <SidebarFooter>
                    {/* Footer content if any */}
                </SidebarFooter>
            </Sidebar>
            <SidebarInset className="print:m-0 bg-background/50 backdrop-blur-sm">
                <header className="flex h-14 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50 px-4 print:hidden">
                    <SidebarTrigger className="hover:bg-primary/10 hover:text-primary transition-colors" />
                    <div className="flex-1">
                        <Breadcrumbs />
                    </div>
                    <div className="flex items-center gap-4">
                        <MessengerNav currentUser={user} />
                        <NotificationBell currentUser={user} />
                        <div className="w-px h-6 bg-border/50 mx-2" />
                        <ThemeToggle />
                        <UserNav user={user} />
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4 md:p-8 print:p-0 print:overflow-visible bg-gradient-to-br from-background via-background to-primary/5">
                    <div className="mx-auto max-w-7xl w-full">
                        {children}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
