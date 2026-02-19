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

    // Normalize pathname by removing trailing slash (unless it's just '/')
    const normalizedPath = pathname !== '/' && pathname.endsWith('/')
        ? pathname.slice(0, -1)
        : pathname;

    // Public patterns that everyone can access (profile is always visible)
    if (normalizedPath === '/profile' || normalizedPath.startsWith('/profile/')) {
        return true;
    }

    // Dashboard handling
    if (normalizedPath === '/dashboard' || normalizedPath === '/' || normalizedPath === '') {
        return !!permissions?.dashboard;
    }

    // Sales handling
    if (normalizedPath.startsWith('/sales')) {
        return !!permissions?.sales;
    }

    // Admin Manage Section
    if (normalizedPath.startsWith('/admin')) {
        return !!permissions?.adminManage;
    }

    // Core Features
    if (normalizedPath.startsWith('/orders')) return !!permissions?.orders;
    if (normalizedPath.startsWith('/batches')) return !!permissions?.batches;
    if (normalizedPath.startsWith('/inventory')) return !!permissions?.inventory;
    if (normalizedPath.startsWith('/customers')) return !!permissions?.customers;
    if (normalizedPath.startsWith('/stations')) return !!permissions?.stations;
    if (normalizedPath.startsWith('/warehouses')) return !!permissions?.warehouses;
    if (normalizedPath.startsWith('/pre-orders')) return !!permissions?.preOrders;
    if (normalizedPath.startsWith('/reports')) return !!permissions?.reports;
    if (normalizedPath.startsWith('/users')) return !!permissions?.users;
    if (normalizedPath.startsWith('/settings')) return !!permissions?.settings;

    // Default to true if path is not recognized (though everything should be covered)
    return true;
}
