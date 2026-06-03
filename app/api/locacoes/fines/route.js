import { getUserFromRequest } from '@/lib/auth';
import { run, query, queryOne, generateId } from '@/lib/db';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    // Fetch all traffic fines with vehicle details and automatic matched driver details
    const fines = query(`
      SELECT f.*, v.model, v.plate, cl.name as client_name, cl.phone as client_phone, c.id as charge_id
      FROM traffic_fines f
      JOIN vehicles v ON f.vehicle_id = v.id
      LEFT JOIN contracts_rentals cr ON f.contract_id = cr.id
      LEFT JOIN clients cl ON cr.client_id = cl.id
      LEFT JOIN charges c ON c.client_id = cl.id AND c.description LIKE '%' || v.plate || '%' AND c.description LIKE '%Multa%'
      WHERE v.user_id = ?
      ORDER BY f.infraction_date DESC
    `, [user.id]);

    return Response.json({ fines });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { vehicle_id, infraction_date, description, amount, points } = body;

    if (!vehicle_id || !infraction_date || !description || !amount) {
      return Response.json({ error: 'Todos os campos são obrigatórios para lançar multa.' }, { status: 400 });
    }

    const vehicle = queryOne("SELECT * FROM vehicles WHERE user_id = ? AND id = ?", [user.id, vehicle_id]);
    if (!vehicle) return Response.json({ error: 'Veículo não encontrado.' }, { status: 404 });

    // Auto-match active driver by infraction date/time in contracts
    let matchingContract = queryOne(`
      SELECT * FROM contracts_rentals 
      WHERE vehicle_id = ? 
        AND start_date <= ? 
        AND (end_date IS NULL OR end_date >= ?) 
      LIMIT 1
    `, [vehicle_id, infraction_date, infraction_date]);

    let clientId = matchingContract?.client_id || null;
    let contractId = matchingContract?.id || null;

    // Fallback: search for active charges of this plate
    if (!clientId) {
      const plateQuery = `%(${vehicle.plate.toUpperCase()})%`;
      const preExistingCharge = queryOne(
        "SELECT client_id FROM charges WHERE user_id = ? AND vehicle_info LIKE ? LIMIT 1",
        [user.id, plateQuery]
      );
      if (preExistingCharge) {
        clientId = preExistingCharge.client_id;
      }
    }

    const fineId = generateId();
    const parsedAmount = parseFloat(amount);
    const markupAmount = parsedAmount * 1.20; // 20% Administrative markup

    run(`
      INSERT INTO traffic_fines (
        id, vehicle_id, contract_id, infraction_date, description, amount, points, driver_indicated, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'pending')
    `, [fineId, vehicle_id, contractId, infraction_date, description.trim(), parsedAmount, parseInt(points) || 0]);

    let waMessage = '';
    let client = null;

    if (clientId) {
      client = queryOne("SELECT * FROM clients WHERE id = ? AND user_id = ?", [clientId, user.id]);
      
      const due = new Date();
      due.setDate(due.getDate() + 7); // 7 days to pay fine
      const dueStr = due.toISOString().split('T')[0];

      // Auto-generate the regression charge in charges table
      const chargeId = generateId();
      run(`
        INSERT INTO charges (
          id, user_id, client_id, amount, description, due_date, status, payment_method
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 'pix')
      `, [
        chargeId, user.id, clientId, markupAmount, 
        `Reembolso Multa: ${description.trim()} (${vehicle.plate.toUpperCase()})`, dueStr
      ]);

      // Update CNH points log in client notes
      if (points) {
        const pointsStr = `\n⚠️ Multa recebida em ${new Date(infraction_date).toLocaleDateString('pt-BR')} (${description.trim()}): +${points} pontos na CNH.`;
        run("UPDATE clients SET notes = COALESCE(notes, '') || ? WHERE id = ?", [pointsStr, clientId]);
      }

      // Generate the 100% editable Whatsapp message template
      waMessage = `Olá, *${client?.name?.split(' ')[0]}*! 🚗

Identificamos uma infração de trânsito no veículo *${vehicle.model}* (Placa *${vehicle.plate.toUpperCase()}*) no dia *${new Date(infraction_date).toLocaleDateString('pt-BR')}*.

*Infração:* ${description.trim()}
*Pontos CNH:* ${points || 0}
*Valor c/ Taxa Admin (20%):* R$ ${markupAmount.toFixed(2)}
*Vencimento do Reembolso:* ${due.toLocaleDateString('pt-BR')}

Por favor, realize o reembolso da multa e efetue a indicação do condutor conforme rito de contrato.

Agradecemos a parceria! 🐍`;
    }

    return Response.json({ 
      success: true, 
      id: fineId, 
      matched: !!clientId, 
      client_name: client?.name || null,
      client_phone: client?.phone || null,
      wa_message: waMessage 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { id, driver_indicated, status } = body;

    if (!id) return Response.json({ error: 'ID da multa é obrigatório.' }, { status: 400 });

    const fine = queryOne(`
      SELECT f.* FROM traffic_fines f
      JOIN vehicles v ON f.vehicle_id = v.id
      WHERE v.user_id = ? AND f.id = ?
    `, [user.id, id]);

    if (!fine) return Response.json({ error: 'Multa não encontrada.' }, { status: 404 });

    if (driver_indicated !== undefined) {
      run("UPDATE traffic_fines SET driver_indicated = ? WHERE id = ?", [parseInt(driver_indicated) || 0, id]);
    }
    if (status !== undefined) {
      run("UPDATE traffic_fines SET status = ? WHERE id = ?", [status, id]);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
