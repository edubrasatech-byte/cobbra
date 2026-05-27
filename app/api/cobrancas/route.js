import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne, run, generateId } from '@/lib/db';

// GET /api/cobrancas - List charges
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('client_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    let sql = `SELECT c.*, cl.name as client_name, cl.email as client_email, cl.phone as client_phone 
               FROM charges c 
               LEFT JOIN clients cl ON c.client_id = cl.id 
               WHERE c.user_id = ?`;
    let countSql = `SELECT COUNT(*) as total FROM charges c LEFT JOIN clients cl ON c.client_id = cl.id WHERE c.user_id = ?`;
    const params = [user.id];
    const countParams = [user.id];

    if (status) {
      sql += ` AND c.status = ?`;
      countSql += ` AND c.status = ?`;
      params.push(status);
      countParams.push(status);
    }

    if (clientId) {
      sql += ` AND c.client_id = ?`;
      countSql += ` AND c.client_id = ?`;
      params.push(clientId);
      countParams.push(clientId);
    }

    if (search) {
      sql += ` AND (c.description LIKE ? OR cl.name LIKE ?)`;
      countSql += ` AND (c.description LIKE ? OR cl.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const { total } = queryOne(countSql, countParams);
    
    sql += ` ORDER BY c.due_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const charges = query(sql, params);

    return Response.json({
      charges,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/cobrancas - Create charge
export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { client_id, amount, description, due_date, recurrence, reminder_channel, payment_method, daily_interest_rate, vehicle_info, loan_info, contract_text, deposit_amount } = body;

    if (!client_id || !amount || !due_date) {
      return Response.json({ error: 'Cliente, valor e vencimento são obrigatórios' }, { status: 400 });
    }

    // Limit check by user plan
    const userPlan = user.plan || 'starter';
    if (userPlan === 'starter' || userPlan === 'crescimento') {
      const activeData = queryOne(
        `SELECT COUNT(*) as active_count FROM charges 
         WHERE user_id = ? AND status IN ('pending', 'reminder_sent', 'overdue')`,
        [user.id]
      );
      const activeCount = activeData?.active_count || 0;

      if (userPlan === 'starter' && activeCount >= 20) {
        return Response.json(
          { error: 'Você atingiu o limite máximo de 20 cobranças simultâneas ativas do plano Starter. Faça upgrade para cadastrar mais!' },
          { status: 403 }
        );
      }

      if (userPlan === 'crescimento' && activeCount >= 50) {
        return Response.json(
          { error: 'Você atingiu o limite máximo de 50 cobranças simultâneas ativas do plano Crescimento. Faça upgrade para o plano Cobra Pro para ter cobranças ilimitadas!' },
          { status: 403 }
        );
      }
    }

    // Starter plan forces reminder_channel to 'email' (no WhatsApp)
    const finalReminderChannel = userPlan === 'starter' ? 'email' : (reminder_channel || 'both');

    // Verify client belongs to user
    const client = queryOne('SELECT * FROM clients WHERE id = ? AND user_id = ?', [client_id, user.id]);
    if (!client) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Handle robust legal contract generation for vehicle rentals
    let finalContractText = contract_text || null;
    if (vehicle_info && !finalContractText) {
      const recurrenceLabel = recurrence === 'weekly' ? 'SEMANAL' : recurrence === 'monthly' ? 'MENSAL' : 'DIÁRIA';
      const todayStr = new Date().toLocaleDateString('pt-BR');
      const dueStr = new Date(due_date).toLocaleDateString('pt-BR');
      
      finalContractText = `CONTRATO DE ADESÃO DE LOCAÇÃO DE VEÍCULO AUTOMOTOR

LOCADOR: ${user.business_name || 'Administradora de Frotas Integrada'}
LOCATÁRIO: ${client.name} | CPF/CNPJ: ${client.document || 'Não cadastrado'} | WhatsApp: ${client.phone || 'Não cadastrado'}

CLÁUSULA 1 - DO OBJETO E VEÍCULO
O objeto deste instrumento é a locação temporária do veículo automotor caracterizado como:
- VEÍCULO: ${vehicle_info}
O veículo é entregue em perfeito estado de conservação, funcionamento, limpeza e com tanque de combustível cheio, devendo ser devolvido nas mesmas condições.

CLÁUSULA 2 - DO PREÇO, CRONOGRAMA E PAGAMENTO
2.1. O locatário pagará ao locador o valor ajustado de R$ ${Number(amount).toFixed(2)} (${recurrenceLabel}) para a utilização do veículo.
2.2. O vencimento acordado do aluguel é em ${dueStr}.
2.3. O ATRASO NO PAGAMENTO SUPERIOR A 24 (VINTE E QUATRO) HORAS constitui inadimplemento contratual imediato e grave (Mora).
2.4. EM CASO DE MORA, fica o locador plenamente autorizado, de forma extrajudicial e sem necessidade de aviso prévio:
  a) A efetuar o BLOQUEIO FÍSICO e RASTREAMENTO do veículo por via remota;
  b) A realizar a BUSCA E APREENSÃO imediata do veículo onde quer que este se encontre, arcando o locatário com todas as custas de guincho e depósito.
2.5. A TÍTULO DE CAUÇÃO/GARANTIA LOCATÍCIA, o locatário realiza neste ato o depósito de R$ ${Number(deposit_amount || 0).toFixed(2)}, valor este que será restituído integralmente ao locatário após o término do contrato e devolução do veículo em perfeito estado de conservação e sem infrações pendentes.

CLÁUSULA 3 - DA RESPONSABILIDADE CIVIL E CRIMINAL
3.1. O locatário assume integral responsabilidade civil e criminal por quaisquer danos causados ao veículo, a si próprio ou a terceiros durante o período de posse.
3.2. Todas as infrações de trânsito cometidas no período da locação são de responsabilidade exclusiva do locatário, autorizando o locador a efetuar a indicação de condutor e cobrança regressiva dos valores das multas acrescidas de 20% de taxa administrativa.

CLÁUSULA 4 - DA DEVOLUÇÃO E RENOVAÇÃO
4.1. O veículo deverá ser devolvido impreterivelmente na data limite pactuada de ${dueStr}.
4.2. A não devolução na data limite e a ausência de prorrogação formal autorizam o locador a registrar boletim de ocorrência policial por apropriação indébita.

Contrato gerado eletronicamente em ${todayStr}.
Sujeito a alterações negociadas diretamente com a Catarina IA.`;
    }

    const id = generateId();
    run(
      `INSERT INTO charges (id, user_id, client_id, amount, description, due_date, recurrence, reminder_channel, payment_method, daily_interest_rate, vehicle_info, loan_info, contract_text, deposit_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, user.id, client_id, amount, description || '', due_date, recurrence || 'once', finalReminderChannel, payment_method || 'pix', daily_interest_rate || 0, vehicle_info || null, loan_info || null, finalContractText, parseFloat(deposit_amount || 0)]
    );


    // Update client total_charged
    run("UPDATE clients SET total_charged = total_charged + ?, updated_at = datetime('now') WHERE id = ?", [amount, client_id]);

    // Log activity
    const clientData = queryOne('SELECT name FROM clients WHERE id = ?', [client_id]);
    run(
      'INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [generateId(), user.id, 'charge_created', 'charge', id, `Cobrança criada para ${clientData?.name} - R$ ${amount.toFixed(2)}`]
    );
    // Notification
    run('INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [generateId(), user.id, 'info', '📝 Nova cobrança criada', `Cobrança de R$ ${amount.toFixed(2)} para ${clientData?.name} com vencimento em ${due_date}`, 'charge', id]
    );

    const charge = queryOne('SELECT c.*, cl.name as client_name FROM charges c LEFT JOIN clients cl ON c.client_id = cl.id WHERE c.id = ?', [id]);
    return Response.json({ charge }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
