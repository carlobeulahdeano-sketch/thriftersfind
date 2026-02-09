import { UserPermissions } from "./types";

export function hasPermission(
    pathname: string,
    permissions: UserPermissions | null | undefined,
    role: string | null | undefined
): boolean {
    if (!role) return false;

    const isStaff = role.toLowerCase() === 'staff';
    const isSuperAdmin = role.toLowerCase() === 'super admin';

    // Public patterns that everyone can access (profile is always visible)
    if (pathname === '/profile' || pathname.startsWith('/profile/')) {
        return true;
    }

    // Special case: Dashboard is restricted for Staff
    if (pathname === '/dashboard' || pathname === '/' || pathname === '') {
        return !isStaff;
    }

    // Special case: Sales is restricted for Staff
    if (pathname.startsWith('/sales')) {
        return !isStaff;
    }

    // Admin Manage Section
    if (pathname.startsWith('/admin')) {
        return !!permissions?.adminManage;
    }

    // Core Features
    if (pathname.startsWith('/orders')) return !!permissions?.orders;
    if (pathname.startsWith('/batches')) return !!permissions?.batches;
    if (pathname.startsWith('/inventory')) return !!permissions?.inventory;
    if (pathname.startsWith('/customers')) return !!permissions?.customers;
    if (pathname.startsWith('/stations')) return !!permissions?.stations;
    if (pathname.startsWith('/warehouses')) return !!permissions?.warehouses;
    if (pathname.startsWith('/pre-orders')) return !!permissions?.preOrders;
    if (pathname.startsWith('/reports')) return !!permissions?.reports;
    if (pathname.startsWith('/users')) return !!permissions?.users;
    if (pathname.startsWith('/settings')) return !!permissions?.settings;

    // Default to true if path is not recognized (though everything should be covered)
    return true;
}
