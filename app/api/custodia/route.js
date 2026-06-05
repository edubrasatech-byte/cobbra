import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne, run, generateId } from '@/lib/db';

// GET /api/custodia - List custody contracts & metrics
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    // 1. Fetch all custody contracts for this user
    const contracts = query(
      `SELECT c.*, cl.name as client_name, cl.email as client_email, cl.phone as client_phone
       FROM capital_custody c
       JOIN clients cl ON c.client_id = cl.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [user.id]
    );

    // 2. Fetch history records for all user's contracts
    const history = query(
      `SELECT h.*, c.client_id, cl.name as client_name
       FROM capital_custody_history h
       JOIN capital_custody c ON h.custody_id = c.id
       JOIN clients cl ON c.client_id = cl.id
       WHERE c.user_id = ?
       ORDER BY h.created_at DESC LIMIT 100`,
      [user.id]
    );

    // 3. Compute metrics for active contracts
    let totalLocado = 0;
    let saldoAtualLocado = 0;
    let taxaDiariaTotal = 0;
    let ativosCount = 0;

    contracts.forEach(contract => {
      if (contract.status === 'active') {
        ativosCount++;
        totalLocado += contract.principal_amount;
        saldoAtualLocado += contract.current_principal;

        // Proportional daily fee logic (same as daily-billing cron)
        let calculatedFee = contract.daily_fee;
        if (contract.current_principal < contract.principal_amount && contract.principal_amount > 0) {
          calculatedFee = contract.daily_fee * (contract.current_principal / contract.principal_amount);
          calculatedFee = Math.round(calculatedFee * 100) / 100;
        }
        taxaDiariaTotal += calculatedFee;
      }
    });

    return Response.json({
      contracts,
      history,
      metrics: {
        totalLocado,
        saldoAtualLocado,
        taxaDiariaTotal,
        ativosCount
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/custodia - Create a new custody contract
export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const {
      client_id,
      principal_amount,
      daily_fee,
      billing_frequency,
      collateral_info,
      custom_message_template,
      late_interest_rate
    } = body;

    if (!client_id || !principal_amount || !daily_fee) {
      return Response.json({ error: 'Cliente, valor principal e taxa diária são obrigatórios' }, { status: 400 });
    }

    const parsedPrincipal = parseFloat(principal_amount);
    const parsedDailyFee = parseFloat(daily_fee);
    const parsedLateRate = late_interest_rate !== undefined ? parseFloat(late_interest_rate) / 100 : 0.01; // Front-end passes percentage (e.g. 1%), convert to rate (0.01)

    if (isNaN(parsedPrincipal) || parsedPrincipal <= 0) {
      return Response.json({ error: 'Valor principal deve ser maior que zero' }, { status: 400 });
    }
    if (isNaN(parsedDailyFee) || parsedDailyFee <= 0) {
      return Response.json({ error: 'Taxa diária deve ser maior que zero' }, { status: 400 });
    }

    // Verify client belongs to user
    const client = queryOne('SELECT * FROM clients WHERE id = ? AND user_id = ?', [client_id, user.id]);
    if (!client) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const id = generateId();

    // Insert custody contract
    run(
      `INSERT INTO capital_custody (id, user_id, client_id, principal_amount, current_principal, daily_fee, billing_frequency, collateral_info, custom_message_template, late_interest_rate, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        id,
        user.id,
        client_id,
        parsedPrincipal,
        parsedPrincipal, // current_principal starts at principal_amount
        parsedDailyFee,
        billing_frequency || 'daily',
        collateral_info || null,
        custom_message_template || null,
        parsedLateRate
      ]
    );

    // Register history: lease_start
    run(
      `INSERT INTO capital_custody_history (id, custody_id, type, amount, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [generateId(), id, 'lease_start', parsedPrincipal, `Contrato iniciado: Capital locado de R$ ${parsedPrincipal.toFixed(2)} com taxa diária de R$ ${parsedDailyFee.toFixed(2)}`]
    );

    // Log Activity
    run(
      'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [generateId(), user.id, 'custody_created', 'custody', id, `Contrato de custódia de capital criado para ${client.name} - R$ ${parsedPrincipal.toFixed(2)}`]
    );

    // Notification
    run(
      'INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [generateId(), user.id, 'info', '🔒 Nova Custódia de Capital', `Custódia de R$ ${parsedPrincipal.toFixed(2)} ativa para ${client.name}`, 'custody', id]
    );

    const contract = queryOne(
      `SELECT c.*, cl.name as client_name
       FROM capital_custody c
       JOIN clients cl ON c.client_id = cl.id
       WHERE c.id = ?`,
      [id]
    );

    return Response.json({ contract }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
