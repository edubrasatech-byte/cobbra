import { loginUser } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/local-rate-limit';

export async function POST(request) {
  try {
    // Check local in-memory rate limiting (Frente 4/Security)
    const ip = getClientIp(request);
    const { allowed, remaining, resetTime } = checkRateLimit(ip, 5, 60000); // 5 attempts per minute
    if (!allowed) {
      return Response.json(
        { error: 'Muitas tentativas de login de um mesmo dispositivo. Tente novamente mais tarde.' }, 
        { status: 429, headers: { 'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString() } }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const { token, user } = await loginUser({ email, password });

    const response = Response.json({ success: true, user }, { status: 200 });
    
    // Set cookie
    const isProd = process.env.NODE_ENV === 'production';
    response.headers.set('Set-Cookie', 
      `cobroo_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${isProd ? '; Secure' : ''}`
    );

    return response;
  } catch (error) {
    return Response.json({ error: error.message }, { status: 401 });
  }
}
