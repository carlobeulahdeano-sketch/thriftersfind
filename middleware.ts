import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const session = request.cookies.get('session');

    // Define public routes that don't require authentication
    const isAuthPage = pathname.startsWith('/login');

    // Define routes that should be protected
    const isPublicAsset =
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/images') ||
        pathname.endsWith('.ico') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg');

    if (isPublicAsset) {
        return NextResponse.next();
    }

    // Skip redirection for POST requests (Server Actions)
    if (request.method === 'POST' && !session) {
        return NextResponse.next();
    }

    if (!session && !isAuthPage) {
        // Redirect to login if no session and trying to access protected page
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Pass the pathname to the app via headers
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
        '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
    ],
};
