import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function basicAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.substring(6);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  const validUsername = process.env.BASIC_AUTH_USER || 'admin';
  const validPassword = process.env.BASIC_AUTH_PASSWORD || 'password123';

  return username === validUsername && password === validPassword;
}

function checkIPAllowed(request: NextRequest): boolean {
  const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',').map(ip => ip.trim()) || [];
  
  // If no IPs specified, allow all (development mode)
  if (allowedIPs.length === 0 || allowedIPs[0] === '') {
    return true;
  }

  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   request.headers.get('x-forwarded') ||
                   '127.0.0.1';

  return allowedIPs.includes(clientIP);
}

export function middleware(request: NextRequest) {
  // Skip auth for API routes that don't need protection
  if (request.nextUrl.pathname.startsWith('/api/health')) {
    return NextResponse.next();
  }

  // Check IP allowlist
  if (!checkIPAllowed(request)) {
    return new NextResponse('Access denied from this IP', { 
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  // Check Basic Auth
  if (!basicAuth(request)) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="ThreadBot Admin Panel"',
        'Content-Type': 'text/plain',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};