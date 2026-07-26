import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);

async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    console.log('Payload:', payload);
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;
  const isAuthPage = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register');
  const isAdminPage = pathname.startsWith('/admin');

  // For auth pages (login and register)
  if (isAuthPage) {
    if (token) {
      try {
        const payload = await verifyToken(token);
        if (payload) {
          // If user is admin or vendor, redirect to admin dashboard
          if (payload.user.role === 'ADMIN' || payload.user.role === 'VENDOR') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
          }
          // If regular user, redirect to user dashboard
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } catch (error) {
        console.error('Auth page verification error:', error);
      }
    }
    return NextResponse.next();
  }

  // For protected pages
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  try {
    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Check admin access
    if (isAdminPage && payload.user.role !== 'ADMIN' && payload.user.role !== 'VENDOR') {
      // If user is not admin or vendor, redirect to user dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } catch (error) {
    console.error('Protected page verification error:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/bookings/:path*',
    '/profile/:path*',
    '/auth/login',
    '/auth/register',
  ],
} 