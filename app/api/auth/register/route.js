import { registerUser, generateToken } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';

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

    // Send Welcome Email asynchronously to avoid blocking the main registration thread
    try {
      const welcomeHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); }
    .header { background: linear-gradient(135deg, #10b981, #059669); padding: 36px; text-align: center; }
    .logo { color: #ffffff; font-size: 26px; font-weight: 800; text-decoration: none; letter-spacing: -0.5px; }
    .content { padding: 40px 36px; line-height: 1.6; font-size: 15px; }
    .welcome-card { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
    .welcome-title { font-size: 18px; font-weight: 700; color: #047857; margin-bottom: 6px; }
    .button-container { text-align: center; margin: 32px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.2); }
    .feature-list { margin: 24px 0; padding: 0; list-style: none; }
    .feature-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; font-size: 14.5px; color: #334155; }
    .feature-icon { color: #10b981; font-weight: bold; }
    .footer { padding: 24px 36px; text-align: center; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="logo">🐍 Cobbra</span>
    </div>
    <div class="content">
      <p style="margin-top: 0; font-size: 16px;">Olá, <strong>${name}</strong>!</p>
      
      <p style="color: #334155;">Seja muito bem-vindo ao <strong>Cobbra</strong>! Estamos muito felizes por você escolher a nossa plataforma para automatizar a sua gestão financeira e acabar de vez com a inadimplência no seu negócio.</p>
      
      <div class="welcome-card">
        <div class="welcome-title">🎉 Sua conta está ativa!</div>
        <p style="margin: 0; font-size: 13.5px; color: #065f46;">Você iniciou o seu período de teste grátis de 7 dias com acesso completo às nossas melhores funcionalidades.</p>
      </div>

      <h4 style="color: #0f172a; font-size: 16px; margin: 28px 0 12px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">Dicas de início rápido:</h4>
      <ul class="feature-list">
        <li class="feature-item">
          <span class="feature-icon">✓</span>
          <span><strong>Cadastre sua Chave Pix</strong> nas Configurações para receber seus pagamentos direto no seu banco e com taxa zero.</span>
        </li>
        <li class="feature-item">
          <span class="feature-icon">✓</span>
          <span><strong>Pareie seu WhatsApp</strong> em "Configurações > Integrações" escaneando o QR Code ao vivo para disparar lembretes móveis.</span>
        </li>
        <li class="feature-item">
          <span class="feature-icon">✓</span>
          <span><strong>Cadastre seu primeiro cliente</strong> e lance uma cobrança teste para experimentar a nossa régua de cobrança automatizada.</span>
        </li>
      </ul>
      
      <div class="button-container">
        <a href="https://cobbra.ai/login" class="button" target="_blank">Acessar Meu Painel Cobbra</a>
      </div>
      
      <p style="font-size: 13.5px; color: #64748b; margin-top: 24px;">
        Se precisar de ajuda ou tiver alguma dúvida sobre a plataforma, basta responder diretamente a este e-mail ou falar com a Catarina AI, nossa assistente inteligente de suporte integrada no seu painel.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">Equipe Cobbra — Automatizando seu fluxo de caixa 🐍</p>
      <p style="margin: 6px 0 0 0;">Suporte oficial: <a href="mailto:suporte@cobbra.com.br" style="color: #10b981; text-decoration: none;">suporte@cobbra.com.br</a></p>
    </div>
  </div>
</body>
</html>
      `;

      sendEmail({
        to: email,
        subject: 'Bem-vindo ao Cobbra! 🐍🎉',
        html: welcomeHtml
      }).catch(err => console.error('[REGISTRATION WELCOME EMAIL ERROR]', err));
    } catch (welcomeErr) {
      console.error('[WELCOME EMAIL INITIALIZATION ERROR]', welcomeErr);
    }

    const response = Response.json({ success: true, user }, { status: 201 });
    
    response.headers.set('Set-Cookie', 
      `cobroo_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
    );

    return response;
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
