import { loginUser } from '@/lib/auth';

export async function POST(request) {
  try {
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
