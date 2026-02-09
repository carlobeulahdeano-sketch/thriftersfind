import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const session = request.cookies.get('session');
    const { pathname } = request.nextUrl;

    // Define public routes that don't require authentication
    const isAuthPage = pathname.startsWith('/login');

    // Define routes that should be protected
    // Note: (app) is a route group, so actual paths start with /dashboard, /inventory, etc.
    // We'll protect everything that isn't login or public assets
    const isPublicAsset = pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/images') ||
        pathname.endsWith('.ico') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg');

    if (isPublicAsset) {
        return NextResponse.next();
    }

    if (!session && !isAuthPage) {
        // Redirect to login if no session and trying to access protected page
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Removed automatic redirect from login to dashboard to prevent redirect loops 
    // when session cookies become stale (e.g. after DB reset).
    // The application layout handles unauthorized access.

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-pathname', pathname);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

// Config to limit middleware to specific paths
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
    ],
};
