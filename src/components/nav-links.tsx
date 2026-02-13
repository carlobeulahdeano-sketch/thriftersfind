
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  LineChart,
  Settings,
  User,
  ShieldCheck,
  Package,
  Boxes,
  PhilippinePeso,
  ChevronDown,
  Database,
  Download,
  MapPin,
  Shield,
  Computer,
  CalendarClock,
  Warehouse,
  TrendingUp,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { UserPermissions } from "@/lib/types";
import { hasPermission } from "@/lib/permissions";

const links = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard />,
    permission: "dashboard",
  },
  {
    href: "/batches",
    label: "Batches",
    icon: <Package />,
    permission: "batches",
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: <Boxes />,
    permission: "inventory",
  },
  {
    href: "/orders",
    label: "Orders",
    icon: <ShoppingCart />,
    permission: "orders",
  },

  {
    href: "/customers",
    label: "Customers",
    icon: <Users />,
    permission: "customers",
  },
  {
    href: "/stations",
    label: "Courier & Pickup Stations",
    icon: <MapPin />,
    permission: "stations",
  },

  {
    href: "/warehouses",
    label: "Warehouses",
    icon: <Warehouse />,
    permission: "warehouses",
  },

  {
    href: "/pre-orders",
    label: "Pre orders",
    icon: <ShoppingCart />,
    permission: "preOrders",
  },

  {
    href: "/reports",
    label: "Reports",
    icon: <LineChart />,
    permission: "reports",
  },

  {
    href: "/sales",
    label: "Sales",
    icon: <TrendingUp />,
    permission: "sales",
  },

  {
    href: "/users",
    label: "Users",
    icon: <ShieldCheck />,
    permission: "users",
  },

  {
    href: "/profile",
    label: "Profile",
    icon: <User />,
    permission: null, // Always visible
  },
  {
    href: "/settings",
    label: "Settings",
    icon: <Settings />,
    permission: "settings",
  },
];

interface NavLinksProps {
  permissions?: UserPermissions;
  role?: string;
}

export function NavLinks({ permissions, role }: NavLinksProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [adminManageOpen, setAdminManageOpen] = React.useState(false);
  const [preOrdersOpen, setPreOrdersOpen] = React.useState(false);



  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    // Auto-open Settings accordion if on a settings-related page
    if (pathname.startsWith('/settings')) {
      setSettingsOpen(true);
    }
    if (pathname.startsWith('/admin')) {
      setAdminManageOpen(true);
    }
    if (pathname.startsWith('/pre-orders')) {
      setPreOrdersOpen(true);
    }
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  if (!isMounted) return null;

  const isSuperAdmin = role?.toLowerCase() === 'super admin';
  const isStaff = role?.toLowerCase() === 'staff';



  const filteredLinks = links.filter(link => {
    return hasPermission(link.href, permissions, role);
  });

  return (
    <SidebarMenu>
      {filteredLinks.map((link) => {
        // Special handling for Pre-orders - make it collapsible
        if (link.href === '/pre-orders') {
          return (
            <Collapsible
              key={link.href}
              open={preOrdersOpen}
              onOpenChange={setPreOrdersOpen}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={link.label}
                    isActive={isActive(link.href)}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenu className="pl-4 border-l ml-4 mt-1">
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === '/pre-orders/all'}
                        tooltip="All Pre-orders"
                      >
                        <Link href="/pre-orders/all">
                          <span>Orders</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === '/pre-orders/inventory'}
                        tooltip="Pre-order Inventory"
                      >
                        <Link href="/pre-orders/inventory">
                          <span>Item List</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        }

        // Special handling for Settings - make it collapsible
        if (link.href === '/settings') {
          return (
            <Collapsible
              key={link.href}
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={link.label}
                    isActive={isActive(link.href)}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenu className="pl-4 border-l ml-4 mt-1">
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive('/settings/import-database')}
                        tooltip="Import Database"
                      >
                        <Link href="/settings/import-database">
                          <Database className="h-4 w-4" />
                          <span>Import Database</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive('/settings/download-database')}
                        tooltip="Download Database"
                      >
                        <Link href="/settings/download-database">
                          <Download className="h-4 w-4" />
                          <span>Download Database</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        }

        // Regular menu items
        return (
          <SidebarMenuItem key={link.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive(link.href)}
              tooltip={link.label}
            >
              <Link href={link.href}>
                {link.icon}
                <span>{link.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}



      {/* Admin Manage Section - Only visible for Super Admin */}
      {/* Admin Manage Section - Only visible users with adminManage permission */}
      {(permissions?.adminManage) && (
        <>
          <div className="my-2 border-t border-sidebar-border" />
          <Collapsible
            open={adminManageOpen}
            onOpenChange={setAdminManageOpen}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Admin Manage">
                  <Shield className="h-4 w-4" />
                  <span>Admin Manage</span>
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenu className="pl-4 border-l ml-4 mt-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Sales Logs"
                      isActive={isActive('/admin/sales-logs')}
                    >
                      <Link href="/admin/sales-logs">
                        <span>Sales Logs</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Admin Logs"
                      isActive={isActive('/admin/admin-logs')}
                    >
                      <Link href="/admin/admin-logs">
                        <span>Admin Logs</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Inventory Logs"
                      isActive={isActive('/admin/inventory-logs')}
                    >
                      <Link href="/admin/inventory-logs">
                        <span>Inventory Logs</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </>
      )}
    </SidebarMenu>
  );
}
