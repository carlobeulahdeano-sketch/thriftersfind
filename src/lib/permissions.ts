import { UserPermissions } from "./types";

export function hasPermission(
    pathname: string,
    permissions: UserPermissions | null | undefined,
    role: string | null | undefined
): boolean {
    if (!role) return false;

    const formattedRole = role?.toLowerCase() || '';
    const isSuperAdmin = formattedRole === 'super admin' || formattedRole === 'superadmin';

    // Super Admin has granular control but with a safety net for critical features
    if (isSuperAdmin) {
        if (pathname.startsWith('/users') ||
            pathname.startsWith('/settings') ||
            pathname.startsWith('/profile') ||
            pathname.startsWith('/admin')) {
            return true;
        }
    }

    // Public patterns that everyone can access (profile is always visible)
    if (pathname === '/profile' || pathname.startsWith('/profile/')) {
        return true;
    }

    // Dashboard handling
    if (pathname === '/dashboard' || pathname === '/' || pathname === '') {
        return !!permissions?.dashboard;
    }

    // Sales handling
    if (pathname.startsWith('/sales')) {
        return !!permissions?.sales;
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
