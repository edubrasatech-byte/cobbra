import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne, run, generateId } from '@/lib/db';

// GET /api/cobranca-diaria
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const dailyBills = query(
      `SELECT d.*, c.name as client_name, c.health_score 
       FROM daily_billing d 
       LEFT JOIN clients c ON d.client_id = c.id 
       WHERE d.user_id = ? 
       ORDER BY c.name ASC`,
      [user.id]
    );

    // Also load user score rates config
    const userData = queryOne(
      'SELECT interest_rate_excellent, interest_rate_regular, interest_rate_risk FROM users WHERE id = ?',
      [user.id]
    );

    return Response.json({ dailyBills, config: userData });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/cobranca-diaria
export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { id, client_id, amount, description, interest_rate, status, end_date, exclude_saturdays, exclude_sundays_holidays } = body;

    if (!client_id || !amount) {
      return Response.json({ error: 'Cliente e valor são obrigatórios' }, { status: 400 });
    }

    const userPlan = user.plan || 'starter';

    // Verify client belongs to user
    const client = queryOne('SELECT id, name FROM clients WHERE id = ? AND user_id = ?', [client_id, user.id]);
    if (!client) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const excSat = exclude_saturdays ? 1 : 0;
    const excSunHol = exclude_sundays_holidays ? 1 : 0;

    if (id) {
      // Update specific config by ID
      if (userPlan === 'starter') {
        return Response.json({ error: 'Faturamento diário indisponível no plano Starter. Faça upgrade!' }, { status: 403 });
      }

      if (userPlan === 'crescimento' && status === 'active') {
        const activeData = queryOne(
          `SELECT COUNT(*) as count FROM daily_billing 
           WHERE user_id = ? AND status = 'active' AND id != ?`,
          [user.id, id]
        );
        if (activeData && activeData.count >= 1) {
          return Response.json(
            { error: 'O plano Crescimento permite apenas 1 faturamento diário ativo simultaneamente. Pause o outro antes de ativar este ou faça upgrade!' },
            { status: 403 }
          );
        }
      }

      run(
        `UPDATE daily_billing SET 
          amount = ?, 
          description = ?, 
          interest_rate = ?, 
          status = ?, 
          end_date = ?,
          exclude_saturdays = ?,
          exclude_sundays_holidays = ?,
          updated_at = datetime('now') 
         WHERE id = ? AND user_id = ?`,
        [amount, description || '', interest_rate || 0, status || 'active', end_date || null, excSat, excSunHol, id, user.id]
      );
      
      run('INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [generateId(), user.id, 'daily_billing_updated', 'client', client_id, `Faturamento diário atualizado para ${client.name} - R$ ${Number(amount).toFixed(2)}/dia`]
      );

      return Response.json({ success: true, message: 'Faturamento diário atualizado' });
    } else {
      // Create new config
      if (userPlan === 'starter') {
        return Response.json({ error: 'O faturamento diário está disponível a partir do plano Crescimento. Faça upgrade para poder ativar!' }, { status: 403 });
      }

      if (userPlan === 'crescimento') {
        const activeData = queryOne(
          `SELECT COUNT(*) as count FROM daily_billing 
           WHERE user_id = ? AND status = 'active'`,
          [user.id]
        );
        if (activeData && activeData.count >= 1) {
          return Response.json(
            { error: 'O plano Crescimento permite apenas 1 faturamento diário ativo simultaneamente. Faça upgrade para o plano Cobra Pro para ter faturamentos diários ilimitados!' },
            { status: 403 }
          );
        }
      }

      // Check if client already has 2 configurations (Cobra Pro maximum of 2)
      const existingCount = queryOne('SELECT COUNT(*) as count FROM daily_billing WHERE client_id = ? AND user_id = ?', [client_id, user.id]);
      if (existingCount && existingCount.count >= 2) {
        return Response.json({ error: 'Este cliente já possui o limite máximo de 2 faturamentos diários configurados.' }, { status: 400 });
      }

      const newId = generateId();
      run(
        `INSERT INTO daily_billing (id, user_id, client_id, amount, description, interest_rate, status, end_date, exclude_saturdays, exclude_sundays_holidays)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, user.id, client_id, amount, description || '', interest_rate || 0, status || 'active', end_date || null, excSat, excSunHol]
      );

      run('INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
        [generateId(), user.id, 'daily_billing_created', 'client', client_id, `Faturamento diário ativado para ${client.name} - R$ ${Number(amount).toFixed(2)}/dia`]
      );

      return Response.json({ success: true, message: 'Faturamento diário configurado com sucesso' }, { status: 201 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/cobranca-diaria
export async function PUT(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { interest_rate_excellent, interest_rate_regular, interest_rate_risk } = body;

    run(
      `UPDATE users SET 
        interest_rate_excellent = ?, 
        interest_rate_regular = ?, 
        interest_rate_risk = ?, 
        updated_at = datetime('now') 
       WHERE id = ?`,
      [
        interest_rate_excellent !== undefined ? parseFloat(interest_rate_excellent) : 0.1,
        interest_rate_regular !== undefined ? parseFloat(interest_rate_regular) : 0.3,
        interest_rate_risk !== undefined ? parseFloat(interest_rate_risk) : 0.5,
        user.id
      ]
    );

    run('INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [generateId(), user.id, 'user_rates_updated', 'user', user.id, `Taxas de juros por score atualizadas`]
    );

    return Response.json({ success: true, message: 'Taxas por score atualizadas com sucesso' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
