import { NextResponse } from 'next/server';
import { queryOne, run, generateId } from '@/lib/db';
import { generateToken, JWT_SECRET } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';
import jwt from 'jsonwebtoken';

// GET /api/auth/magic-link - Processa e valida o Magic Link
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return new Response('Token inválido ou ausente.', { status: 400 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, { issuer: 'cobbra-magic-link' });
    } catch (err) {
      return new Response('O link de acesso expirou (limite de 15 minutos) ou é inválido. Por favor, solicite um novo link de login.', { status: 400 });
    }

    if (!decoded || decoded.type !== 'magic-link' || !decoded.userId) {
      return new Response('Link de formato inválido.', { status: 400 });
    }

    const user = queryOne(
      'SELECT id, name, email, role, status, plan, onboarding_completed FROM users WHERE id = ?', 
      [decoded.userId]
    );

    if (!user) {
      return new Response('Usuário correspondente não foi localizado.', { status: 404 });
    }

    if (user.status === 'blocked') {
      return new Response('Esta conta está bloqueada no sistema. Entre em contato com o suporte Cobbra.', { status: 403 });
    }

    // Gerar token JWT padrão de 7 dias de sessão do Cobbra
    const sessionToken = generateToken(user);

    // Redireciona o usuário para o dashboard instalando o cookie de login
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set('cobroo_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/'
    });

    return response;
  } catch (error) {
    return new Response(`Erro crítico de autenticação: ${error.message}`, { status: 500 });
  }
}

// POST /api/auth/magic-link - Gera e dispara o Magic Link
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, phone } = body;

    if (!email && !phone) {
      return Response.json({ error: 'Forneça o E-mail ou o número do WhatsApp.' }, { status: 400 });
    }

    let user = null;
    if (email) {
      user = queryOne('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    } else {
      const cleanPhone = phone.replace(/\D/g, '');
      // Busca parcial (considerando DDI se cadastrado ou não)
      user = queryOne('SELECT * FROM users WHERE phone LIKE ?', [`%${cleanPhone}%`]);
    }

    if (!user) {
      return Response.json({ error: 'Nenhuma conta ativa foi localizada com estes dados.' }, { status: 404 });
    }

    if (user.status === 'blocked') {
      return Response.json({ error: 'Sua conta está suspensa. Contate o suporte para desbloqueio.' }, { status: 403 });
    }

    // Gerar token do Magic Link válido por 15 minutos com emissor exclusivo
    const magicToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'magic-link' },
      JWT_SECRET,
      { expiresIn: '15m', issuer: 'cobbra-magic-link' }
    );

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const magicUrl = `${baseUrl}/api/auth/magic-link?token=${magicToken}`;

    const valorMensagemWhatsApp = `Olá, ${user.name}! 💚 Aqui está seu link de acesso de segurança para entrar na plataforma Cobbra:\n\n🔗 *Acessar o Painel:* ${magicUrl}\n\nEste link expira em 15 minutos e só pode ser usado uma única vez. Bons negócios! 🚀🐍`;

    let emailSent = false;
    let whatsappQueued = false;

    // Disparo por E-mail (via Resend ou SMTP)
    if (email || user.email) {
      const emailTarget = email ? email.trim().toLowerCase() : user.email;
      
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif; max-width: 600px; margin: 40px auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 26px; font-weight: 800; color: #10b981; letter-spacing: -0.5px;">🐍 Cobbra</span>
          </div>
          <h2 style="color: #0f172a; margin-bottom: 16px; font-size: 20px; font-weight: 700; text-align: center;">Seu link de acesso rápido 🔑</h2>
          <p style="font-size: 14.5px; color: #334155; line-height: 1.6; text-align: center;">
            Olá, <strong>${user.name}</strong>! Clique no botão abaixo para entrar instantaneamente na sua conta do Cobbra de forma 100% segura, sem precisar de senha:
          </p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${magicUrl}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #070913; padding: 14px 28px; text-decoration: none; font-weight: 800; border-radius: 10px; display: inline-block; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.25); font-size: 14px;">
              🔑 Entrar no Painel Cobbra
            </a>
          </div>
          <p style="font-size: 12.5px; color: #64748b; line-height: 1.6; text-align: center;">
            Se o botão acima não funcionar, copie e cole o link a seguir no seu navegador:
          </p>
          <div style="font-family: monospace; font-size: 11.5px; color: #047857; background: #f0fdf4; border: 1px dashed #86efac; border-radius: 8px; padding: 12px; word-break: break-all; text-align: center; line-height: 1.4;">
            ${magicUrl}
          </div>
          <hr style="margin-top: 36px; border: 0; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5; margin-bottom: 0;">
            Este link é válido por 15 minutos e de uso único. Caso você não tenha solicitado este e-mail, nenhuma ação é necessária e sua senha permanece segura.
          </p>
        </div>
      `;

      try {
        await sendEmail({
          to: emailTarget,
          subject: 'Acesso Rápido (Magic Link) — Cobbra',
          html: emailHtml
        });
        emailSent = true;
      } catch (err) {
        console.error('[MAGIC LINK EMAIL FAIL]', err);
      }
    }

    // Disparo por WhatsApp (via whatsapp_queue)
    if (phone || user.phone) {
      const phoneTarget = phone ? phone.replace(/\D/g, '') : user.phone.replace(/\D/g, '');
      const finalPhone = phoneTarget.startsWith('55') ? phoneTarget : `55${phoneTarget}`;
      
      try {
        const queueId = generateId();
        run(
          `INSERT INTO whatsapp_queue (id, user_id, phone, message, status, max_attempts)
           VALUES (?, ?, ?, ?, 'pending', 3)`,
          [queueId, user.id, finalPhone, valorMensagemWhatsApp]
        );
        whatsappQueued = true;
      } catch (err) {
        console.error('[MAGIC LINK WHATSAPP FAIL]', err);
      }
    }

    return Response.json({
      success: true,
      message: 'Link de login enviado com sucesso!',
      channels: {
        email: emailSent,
        whatsapp: whatsappQueued
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
