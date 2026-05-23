import { NextResponse } from 'next/server';

// In-memory rate limiter (resets on deploy — good enough for Edge)
const rateMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute per IP
const AUTH_RATE_LIMIT_MAX = 10; // stricter for auth endpoints

function getRateLimitKey(ip, endpoint) {
  return `${ip}:${endpoint}`;
}

function checkRateLimit(key, max) {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateMap.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: max - 1 };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: max - entry.count };
}

// Clean up old entries every 5 minutes
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup > 5 * 60 * 1000) {
    for (const [key, entry] of rateMap.entries()) {
      if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateMap.delete(key);
      }
    }
    lastCleanup = now;
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Get client IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1';

  maybeCleanup();

  // Public routes that don't need authentication
  const publicRoutes = ['/', '/login', '/cadastro'];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isApiAuth = pathname.startsWith('/api/auth');
  const isStaticFile = pathname.startsWith('/_next') || pathname.startsWith('/images') || pathname.includes('.');

  // Rate limit auth endpoints more strictly (anti brute-force)
  if (isApiAuth) {
    const key = getRateLimitKey(ip, 'auth');
    const result = checkRateLimit(key, AUTH_RATE_LIMIT_MAX);
    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde 1 minuto e tente novamente.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(AUTH_RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }
  }

  // Rate limit all API endpoints
  if (pathname.startsWith('/api/') && !isApiAuth) {
    const key = getRateLimitKey(ip, 'api');
    const result = checkRateLimit(key, RATE_LIMIT_MAX);
    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Limite de requisições excedido. Tente novamente em 1 minuto.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }
  }

  if (isPublicRoute || isApiAuth || isStaticFile) {
    return NextResponse.next();
  }

  // Check for auth token on protected routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
    const token = request.cookies.get('cobroo_token')?.value;

    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Validate token format (basic check before full JWT verify in API)
    if (token.split('.').length !== 3) {
      const response = pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Token inválido' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('cobroo_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)',
  ],
};
