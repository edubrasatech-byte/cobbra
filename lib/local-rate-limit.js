// Lightweight, zero-dependency in-memory rate limiter for Next.js API Routes (Frente 4/Security)
const tracker = new Map();

// Clean up old entries every 5 minutes to prevent memory leaks
if (typeof global !== 'undefined') {
  if (!global.rateLimitInterval) {
    global.rateLimitInterval = setInterval(() => {
      const now = Date.now();
      for (const [ip, data] of tracker.entries()) {
        if (now > data.resetTime) {
          tracker.delete(ip);
        }
      }
    }, 300000);
  }
}

/**
 * Checks if a given IP has exceeded its request limits
 * @param {string} ip - Client IP address
 * @param {number} limit - Max requests allowed in window
 * @param {number} windowMs - Window size in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetTime: number }}
 */
export function checkRateLimit(ip, limit = 5, windowMs = 60000) {
  const now = Date.now();
  
  if (!tracker.has(ip)) {
    const data = {
      count: 1,
      resetTime: now + windowMs
    };
    tracker.set(ip, data);
    return { allowed: true, remaining: limit - 1, resetTime: data.resetTime };
  }

  const data = tracker.get(ip);

  // If window passed, reset
  if (now > data.resetTime) {
    data.count = 1;
    data.resetTime = now + windowMs;
    return { allowed: true, remaining: limit - 1, resetTime: data.resetTime };
  }

  data.count += 1;

  if (data.count > limit) {
    return { allowed: false, remaining: 0, resetTime: data.resetTime };
  }

  return { allowed: true, remaining: limit - data.count, resetTime: data.resetTime };
}

/**
 * Helper to extract client IP from Next.js request
 * @param {Request} request 
 * @returns {string}
 */
export function getClientIp(request) {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
