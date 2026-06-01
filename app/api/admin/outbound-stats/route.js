import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne, run } from '@/lib/db';

// GET /api/admin/outbound-stats — Métricas em tempo real e listagem de leads da fila
export async function GET(request) {
  try {
    const currentUser = getUserFromRequest(request);
    if (!currentUser) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Apenas administradores têm acesso a métricas de prospecção
    if (currentUser.role !== 'admin' && currentUser.role !== 'senior' && currentUser.role !== 'admin_senior') {
      return Response.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const statusFilter = searchParams.get('status');
    const nicheFilter = searchParams.get('niche');
    const search = searchParams.get('search');

    // 1. Contagens Globais de Fila
    const totalLeads = queryOne("SELECT COUNT(*) as count FROM leads_prospects").count;
    const readyCount = queryOne("SELECT COUNT(*) as count FROM leads_prospects WHERE status = 'ready_to_send'").count;
    const sentCount = queryOne("SELECT COUNT(*) as count FROM leads_prospects WHERE status = 'sent'").count;
    const failedCount = queryOne("SELECT COUNT(*) as count FROM leads_prospects WHERE status = 'failed'").count;

    // 2. Agrupados por Nicho
    const nicheStats = query(`
      SELECT niche, 
             COUNT(*) as total,
             SUM(CASE WHEN status = 'ready_to_send' THEN 1 ELSE 0 END) as ready,
             SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
             SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM leads_prospects
      GROUP BY niche
    `);

    // 3. Agrupados por Cidade
    const cityStats = query(`
      SELECT city, 
             COUNT(*) as total,
             SUM(CASE WHEN status = 'ready_to_send' THEN 1 ELSE 0 END) as ready,
             SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
             SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM leads_prospects
      GROUP BY city
      ORDER BY total DESC
      LIMIT 10
    `);

    // 4. Montar a query da tabela paginada de leads
    let sql = `SELECT id, name, phone, niche, city, status, custom_message, created_at 
               FROM leads_prospects WHERE 1=1`;
    let countSql = 'SELECT COUNT(*) as total FROM leads_prospects WHERE 1=1';
    const params = [];
    const countParams = [];

    if (statusFilter) {
      sql += ' AND status = ?';
      countSql += ' AND status = ?';
      params.push(statusFilter);
      countParams.push(statusFilter);
    }

    if (nicheFilter) {
      sql += ' AND niche = ?';
      countSql += ' AND niche = ?';
      params.push(nicheFilter);
      countParams.push(nicheFilter);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR city LIKE ?)';
      countSql += ' AND (name LIKE ? OR phone LIKE ? OR city LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
      countParams.push(s, s, s);
    }

    const { total } = queryOne(countSql, countParams);
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const leads = query(sql, params);

    return Response.json({
      summary: {
        total: totalLeads,
        ready: readyCount,
        sent: sentCount,
        failed: failedCount
      },
      nicheStats,
      cityStats,
      leads,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('[OUTBOUND STATS API ERROR]', error);
    return Response.json({ error: 'Erro interno ao consultar dados da fila' }, { status: 500 });
  }
}

// POST /api/admin/outbound-stats — Ações administrativas de fila (Ex: resetar falhas, calibrar mensagens)
export async function POST(request) {
  try {
    const currentUser = getUserFromRequest(request);
    if (!currentUser) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'senior' && currentUser.role !== 'admin_senior') {
      return Response.json({ error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'RESET_FAILED') {
      // Retorna todos os leads em estado 'failed' para 'ready_to_send' para nova tentativa
      const result = run("UPDATE leads_prospects SET status = 'ready_to_send' WHERE status = 'failed'");
      return Response.json({ 
        success: true, 
        message: `Sucesso! Reiniciados ${result.changes} leads falhos de volta para a fila pronta.` 
      });
    }

    if (action === 'RECALIBRATE') {
      // Força a substituição do domínio e inclusão da precificação flat de R$ 49,90 nas mensagens
      const prospects = query("SELECT id, custom_message FROM leads_prospects WHERE status = 'ready_to_send'");
      let updatedCount = 0;

      for (const p of prospects) {
        if (!p.custom_message) continue;
        let msg = p.custom_message;
        const original = msg;

        // Domínio
        msg = msg.replace(/cobbra\.ai/gi, 'cobbra.com.br');
        msg = msg.replace(/Cobbra\.ai/gi, 'Cobbra.com.br');

        // Régua
        msg = msg.replace(/régua de cobrança/gi, 'sequência inteligente de lembretes');
        msg = msg.replace(/régua/gi, 'sequência de lembretes');
        msg = msg.replace(/réguas/gi, 'sequências de lembretes');

        // Preço Flat
        if (!msg.includes('R$ 49,90') && !msg.includes('49,90')) {
          if (msg.includes('https://cobbra.com.br/login')) {
            msg = msg.replace(
              'https://cobbra.com.br/login',
              `https://cobbra.com.br/login\n\n*(Você testa grátis por 3 dias sem cadastrar cartão. Se gostar, o plano completo com tudo liberado e sem taxas Pix é de apenas R$ 49,90/mês!)*`
            );
          } else if (msg.includes('👉 Registrar Grátis:')) {
            msg = msg.replace(
              '👉 Registrar Grátis:',
              `👉 Registrar Grátis: https://cobbra.com.br/login\n\n*(Você testa grátis por 3 dias sem cadastrar cartão. Se gostar, o plano completo com tudo liberado e sem taxas Pix é de apenas R$ 49,90/mês!)*`
            );
          }
        }

        if (msg !== original) {
          run("UPDATE leads_prospects SET custom_message = ? WHERE id = ?", [msg, p.id]);
          updatedCount++;
        }
      }

      // Corrigir capitalização de "• sequência"
      run(`
        UPDATE leads_prospects 
        SET custom_message = replace(custom_message, '• sequência', '• Sequência') 
        WHERE status = 'ready_to_send' AND custom_message LIKE '%• sequência%'
      `);

      return Response.json({
        success: true,
        message: `Fila calibrada! Foram atualizadas ${updatedCount} abordagens de leads prontos com o domínio oficial e os R$ 49,90/mês.`
      });
    }

    return Response.json({ error: 'Ação inválida ou não especificada' }, { status: 400 });

  } catch (error) {
    console.error('[OUTBOUND ACTION API ERROR]', error);
    return Response.json({ error: 'Erro ao executar ação administrativa' }, { status: 500 });
  }
}
