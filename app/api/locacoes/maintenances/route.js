import { getUserFromRequest } from '@/lib/auth';
import { run, query, queryOne, generateId } from '@/lib/db';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const maintenanceId = searchParams.get('id');
    const vehicleId = searchParams.get('vehicle_id');

    if (maintenanceId) {
      const maintenance = queryOne(`
        SELECT m.*, v.model, v.plate 
        FROM maintenance_records m
        JOIN vehicles v ON m.vehicle_id = v.id
        WHERE v.user_id = ? AND m.id = ?
      `, [user.id, maintenanceId]);
      if (!maintenance) return Response.json({ error: 'Manutenção não encontrada' }, { status: 404 });
      return Response.json({ maintenance });
    }

    let sql = `
      SELECT m.*, v.model, v.plate, cl.name as client_name
      FROM maintenance_records m
      JOIN vehicles v ON m.vehicle_id = v.id
      LEFT JOIN contracts_rentals cr ON m.contract_id = cr.id
      LEFT JOIN clients cl ON cr.client_id = cl.id
      WHERE v.user_id = ?
    `;
    const params = [user.id];

    if (vehicleId) {
      sql += " AND m.vehicle_id = ?";
      params.push(vehicleId);
    }

    sql += " ORDER BY m.created_at DESC";
    const maintenances = query(sql, params);
    return Response.json({ maintenances });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { vehicle_id, description, total_cost, responsibility, driver_share_amount, driver_charge_mode, reminder_date } = body;

    if (!vehicle_id || !description || !total_cost || !responsibility) {
      return Response.json({ error: 'Veículo, descrição, custo total e responsabilidade são obrigatórios.' }, { status: 400 });
    }

    const vehicle = queryOne("SELECT * FROM vehicles WHERE user_id = ? AND id = ?", [user.id, vehicle_id]);
    if (!vehicle) return Response.json({ error: 'Veículo não encontrado.' }, { status: 404 });

    // Auto-match active contract/client if vehicle is rented
    const activeContract = queryOne(`
      SELECT * FROM contracts_rentals 
      WHERE vehicle_id = ? AND status = 'active' 
      LIMIT 1
    `, [vehicle_id]);

    const contractId = activeContract?.id || null;
    const clientId = activeContract?.client_id || null;

    const maintenanceId = generateId();
    const cost = parseFloat(total_cost);
    const shareAmt = parseFloat(driver_share_amount) || 0;

    run(`
      INSERT INTO maintenance_records (
        id, vehicle_id, contract_id, description, total_cost, responsibility, 
        driver_share_amount, driver_charge_mode, reminder_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      maintenanceId, vehicle_id, contractId, description.trim(), cost, responsibility, 
      shareAmt, driver_charge_mode || 'direct_charge', reminder_date || null
    ]);

    // If owner responsibility, insert transaction as an expense (Item 11 integration)
    if (responsibility === 'owner' || responsibility === 'split') {
      const expenseAmt = responsibility === 'owner' ? cost : (cost - shareAmt);
      if (expenseAmt > 0) {
        run(`
          INSERT INTO transactions (id, user_id, vehicle_id, amount, type, notes)
          VALUES (?, ?, ?, ?, 'expense', ?)
        `, [generateId(), user.id, vehicle_id, expenseAmt, `Despesa de manutenção: ${description.trim()} (${vehicle.plate})`]);
      }
    }

    // Auto-generate invoice/charge if driver is responsible and direct charge is chosen (Item 10/11 integration)
    let generatedChargeId = null;
    if (clientId && (responsibility === 'driver' || responsibility === 'split')) {
      const chargeAmt = responsibility === 'driver' ? cost : shareAmt;
      
      if (chargeAmt > 0 && driver_charge_mode === 'direct_charge') {
        generatedChargeId = generateId();
        const due = new Date();
        due.setDate(due.getDate() + 5); // 5 days due
        const dueStr = due.toISOString().split('T')[0];

        run(`
          INSERT INTO charges (
            id, user_id, client_id, amount, description, due_date, status, payment_method, vehicle_info
          ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 'pix', ?)
        `, [
          generatedChargeId, user.id, clientId, chargeAmt, 
          `Cobrança de Coparticipação: ${description.trim()} (${vehicle.plate.toUpperCase()})`, dueStr, 
          `${vehicle.model} (${vehicle.plate.toUpperCase()})`
        ]);

        // Log notification
        const clientData = queryOne('SELECT name FROM clients WHERE id = ?', [clientId]);
        run('INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [generateId(), user.id, 'info', '🛠️ Coparticipação de manutenção cobrada', `Cobrança de R$ ${chargeAmt.toFixed(2)} gerada para ${clientData?.name}`, 'charge', generatedChargeId]);
      } else if (chargeAmt > 0 && driver_charge_mode === 'deduct_deposit') {
        // Abate direto da caução acumulada se houver registro de escrow
        const escrow = queryOne('SELECT * FROM escrow_deposits WHERE contract_id = ?', [contractId]);
        if (escrow) {
          const newEscrowBalance = Math.max(0, escrow.balance_paid - chargeAmt);
          run('UPDATE escrow_deposits SET balance_paid = ?, updated_at = datetime("now") WHERE id = ?', [newEscrowBalance, escrow.id]);
          
          // Log transactions deduct
          run('INSERT INTO transactions (id, user_id, client_id, vehicle_id, amount, type, notes) VALUES (?, ?, ?, ?, ?, "refund", ?)',
            [generateId(), user.id, clientId, vehicle_id, chargeAmt, `Débito de Avaria na Caução: ${description.trim()}`]);
        }
      }
    }

    return Response.json({ success: true, id: maintenanceId, charge_id: generatedChargeId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { id, description, total_cost, responsibility, driver_share_amount, driver_charge_mode, reminder_date } = body;

    if (!id) return Response.json({ error: 'ID da manutenção é obrigatório.' }, { status: 400 });

    const maintenance = queryOne(`
      SELECT m.* FROM maintenance_records m
      JOIN vehicles v ON m.vehicle_id = v.id
      WHERE v.user_id = ? AND m.id = ?
    `, [user.id, id]);

    if (!maintenance) return Response.json({ error: 'Manutenção não encontrada.' }, { status: 404 });

    if (description !== undefined) {
      run("UPDATE maintenance_records SET description = ? WHERE id = ?", [description, id]);
    }
    if (total_cost !== undefined) {
      run("UPDATE maintenance_records SET total_cost = ? WHERE id = ?", [parseFloat(total_cost) || 0, id]);
    }
    if (responsibility !== undefined) {
      run("UPDATE maintenance_records SET responsibility = ? WHERE id = ?", [responsibility, id]);
    }
    if (driver_share_amount !== undefined) {
      run("UPDATE maintenance_records SET driver_share_amount = ? WHERE id = ?", [parseFloat(driver_share_amount) || 0, id]);
    }
    if (driver_charge_mode !== undefined) {
      run("UPDATE maintenance_records SET driver_charge_mode = ? WHERE id = ?", [driver_charge_mode, id]);
    }
    if (reminder_date !== undefined) {
      run("UPDATE maintenance_records SET reminder_date = ? WHERE id = ?", [reminder_date, id]);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const maintenanceId = searchParams.get('id');

    if (!maintenanceId) return Response.json({ error: 'ID da manutenção é obrigatório.' }, { status: 400 });

    const maintenance = queryOne(`
      SELECT m.id FROM maintenance_records m
      JOIN vehicles v ON m.vehicle_id = v.id
      WHERE v.user_id = ? AND m.id = ?
    `, [user.id, maintenanceId]);

    if (!maintenance) return Response.json({ error: 'Manutenção não encontrada.' }, { status: 404 });

    run("DELETE FROM maintenance_records WHERE id = ?", [maintenanceId]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
