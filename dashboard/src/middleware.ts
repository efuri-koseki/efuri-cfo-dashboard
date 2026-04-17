import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const clientId = request.cookies.get('client_id')?.value;
    const pathname = request.nextUrl.pathname;

    // If accessing the login page 
    if (pathname === '/login') {
        if (clientId) {
            // Already logged in, redirect to their dashboard
            return NextResponse.redirect(new URL(`/${clientId}`, request.url));
        }
        return NextResponse.next();
    }

    // For any other path:
    // If not logged in, redirect to login
    if (!clientId) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If logged in, but accessing root. Redirect to their dashboard.
    if (pathname === '/') {
        return NextResponse.redirect(new URL(`/${clientId}`, request.url));
    }

    // Check if the path segment matches their client ID
    const pathSegment = pathname.split('/')[1];
    if (pathSegment && pathSegment !== clientId) {
        // They are trying to access another client's dashboard!
        return NextResponse.redirect(new URL(`/${clientId}`, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'], // match all request except api and next statics
};
