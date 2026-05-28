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
      
      finalContractText = `CONTRATO PARTICULAR DE LOCAÇÃO DE VEÍCULO AUTOMOTOR PARA FINS COMERCIAIS

LOCADOR: ${user.business_name || 'Administradora de Frotas Integrada'}
LOCATÁRIO: ${client.name} | CPF/CNPJ: ${client.document || 'Não cadastrado'} | WhatsApp: ${client.phone || 'Não cadastrado'}

CLÁUSULA 1 - DO OBJETO E VEÍCULO
O objeto deste instrumento é a locação temporária do veículo automotor caracterizado como:
- VEÍCULO: ${vehicle_info}
1.1. O LOCATÁRIO declara receber o veículo em perfeitas condições de uso, segurança, higiene e conservação, com pneus e estepe regulamentares, comprometendo-se a devolvê-lo no mesmo estado.
1.2. É terminantemente PROIBIDA a sublocação, empréstimo, cessão ou transferência da posse do veículo a terceiros sob qualquer pretexto, sob pena de rescisão contratual imediata e multa penal de R$ 2.000,00, sem prejuízo de perdas e danos.

CLÁUSULA 2 - DO PREÇO, CAUÇÃO E REGRAS FINANCEIRAS
2.1. O LOCATÁRIO pagará ao LOCADOR o valor ajustado de R$ ${Number(amount).toFixed(2)} (${recurrenceLabel}) para a utilização do veículo.
2.2. O vencimento acordado do aluguel é em ${dueStr}.
2.3. A TÍTULO DE CAUÇÃO/GARANTIA LOCATÍCIA, o LOCATÁRIO realiza neste ato o depósito de R$ ${Number(deposit_amount || 0).toFixed(2)}. Fica o LOCADOR autorizado a reter este valor total ou parcialmente para abatimento de danos mecânicos, avarias de lataria, furos de pneus, multas de trânsito ou saldos de aluguéis em atraso.
2.4. Caso não haja avarias ou débitos, a caução será devolvida integralmente no prazo de 15 (quinze) dias após a devolução física do veículo.

CLÁUSULA 3 - DAS INFRAÇÕES DE TRÂNSITO E MULTAS
3.1. Todas as infrações de trânsito cometidas durante o período de vigência deste contrato são de responsabilidade exclusiva e integral do LOCATÁRIO.
3.2. O LOCATÁRIO desde já autoriza e outorga poderes para que o LOCADOR efetue a indicação de condutor junto aos órgãos de trânsito (Detran, PRF, etc.).
3.3. O valor nominal de qualquer multa será reembolsado pelo LOCATÁRIO acrescido de uma taxa administrativa de 20% (vinte por cento), autorizando-se o lançamento automático de cobrança ou abatimento do saldo de caução.

CLÁUSULA 4 - DO INADIMPLEMENTO E PROTOCOLO DE RETOMADA
4.1. O atraso no pagamento do aluguel semanal ou mensal por prazo superior a 24 (vinte e quatro) horas constitui inadimplemento grave (Mora).
4.2. EM CASO DE MORA, fica o LOCADOR plenamente autorizado, de forma extrajudicial e independentemente de notificação prévia:
  a) A efetuar o BLOQUEIO FÍSICO DO MOTOR e o RASTREAMENTO do veículo via satélite/GPRS;
  b) A realizar a RETOMADA E REINTEGRAÇÃO de posse imediata do veículo onde quer que este se encontre, correndo por conta exclusiva do LOCATÁRIO todas as despesas com chaveiro, guincho, reboque e depósito oficial.

CLÁUSULA 5 - DA MANUTENÇÃO E REVISÕES
5.1. O LOCATÁRIO compromete-se a parar o veículo e notificar imediatamente o LOCADOR para a realização de troca de óleo e revisões periódicas obrigatórias a cada 10.000 KM rodados.
5.2. O descumprimento do agendamento de revisões ou a negligência com avisos de painel (temperatura, óleo, freios) gerará multa civil de R$ 500,00, além da responsabilidade integral por eventual dano mecânico ao motor.
5.3. Danos decorrentes de mau uso, negligência ou sinistro (colisão) sem cobertura de seguro serão arcados integralmente pelo LOCATÁRIO, incluindo lucros cessantes pelo período que o carro permanecer imobilizado na oficina.

CLÁUSULA 6 - DA DEVOLUÇÃO E CLÁUSULA PENAL
6.1. O veículo deverá ser devolvido impreterivelmente na data limite pactuada de ${dueStr}.
6.2. A não devolução do veículo no prazo acordado sem autorização expressa por escrito do LOCADOR constituirá CRIME DE APROPRIAÇÃO INDÉBITA (Art. 168 do Código Penal Brasileiro), autorizando o LOCADOR a registrar boletim de ocorrência policial e acionar as autoridades de segurança pública para fins de busca, apreensão e prisão do infrator.`;
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
