import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const clientId = request.cookies.get('client_id')?.value;

    // If accessing the dashboard without a valid login, redirect to login
    if (!clientId && request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If accessing the login page while already logged in, redirect to dashboard
    if (clientId && request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/login'],
};
