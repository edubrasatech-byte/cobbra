import { registerUser, generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password) {
      return Response.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    }

    const user = await registerUser({ name, email, password, phone });
    const token = generateToken(user);

    const response = Response.json({ success: true, user }, { status: 201 });
    
    response.headers.set('Set-Cookie', 
      `cobroo_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
    );

    return response;
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
