import { getUserFromRequest } from '@/lib/auth';
import { run, query, queryOne, generateId } from '@/lib/db';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('id');

    if (vehicleId) {
      const vehicle = queryOne("SELECT * FROM vehicles WHERE user_id = ? AND id = ?", [user.id, vehicleId]);
      if (!vehicle) return Response.json({ error: 'Veículo não encontrado' }, { status: 404 });
      return Response.json({ vehicle });
    }

    const vehicles = query("SELECT * FROM vehicles WHERE user_id = ? ORDER BY created_at DESC", [user.id]);
    return Response.json({ vehicles });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { model, plate, color, year, renavam, chassis, current_km, investor_name, investor_split_rate, oil_change_interval_km, insurance_policy, insurance_expires_at, ipva_status, licensing_status, licensing_expiration } = body;

    if (!model || !plate || !color) {
      return Response.json({ error: 'Modelo, Placa e Cor são obrigatórios.' }, { status: 400 });
    }

    // Check if plate already exists
    const plateExists = queryOne("SELECT id FROM vehicles WHERE plate = ?", [plate.toUpperCase().trim()]);
    if (plateExists) {
      return Response.json({ error: 'Já existe um veículo cadastrado com esta placa.' }, { status: 400 });
    }

    const id = generateId();
    run(`
      INSERT INTO vehicles (
        id, user_id, model, plate, color, year, renavam, chassis, current_km, 
        investor_name, investor_split_rate, oil_change_interval_km, last_oil_change_km, 
        insurance_policy, insurance_expires_at, ipva_status, licensing_status, licensing_expiration
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, user.id, model.trim(), plate.toUpperCase().trim(), color.trim(), 
      parseInt(year) || null, renavam ? renavam.trim() : null, chassis ? chassis.trim() : null, 
      parseInt(current_km) || 0, investor_name ? investor_name.trim() : null, 
      investor_split_rate ? parseFloat(investor_split_rate) : null, 
      parseInt(oil_change_interval_km) || 10000, parseInt(current_km) || 0,
      insurance_policy ? insurance_policy.trim() : null, insurance_expires_at || null,
      ipva_status || 'PAGO', licensing_status || 'EM DIA', licensing_expiration || null
    ]);

    return Response.json({ success: true, id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { id, status, current_km, last_oil_change_km, oil_change_interval_km, insurance_policy, insurance_expires_at, model, color, year, renavam, chassis, investor_name, investor_split_rate, ipva_status, licensing_status, licensing_expiration } = body;

    if (!id) return Response.json({ error: 'ID do veículo é obrigatório.' }, { status: 400 });

    const vehicle = queryOne("SELECT * FROM vehicles WHERE user_id = ? AND id = ?", [user.id, id]);
    if (!vehicle) return Response.json({ error: 'Veículo não encontrado.' }, { status: 404 });

    // Update dynamically
    if (status !== undefined) {
      run("UPDATE vehicles SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, id]);
    }
    if (current_km !== undefined) {
      run("UPDATE vehicles SET current_km = ?, updated_at = datetime('now') WHERE id = ?", [parseInt(current_km) || 0, id]);
    }
    if (last_oil_change_km !== undefined) {
      run("UPDATE vehicles SET last_oil_change_km = ?, updated_at = datetime('now') WHERE id = ?", [parseInt(last_oil_change_km) || 0, id]);
    }
    if (oil_change_interval_km !== undefined) {
      run("UPDATE vehicles SET oil_change_interval_km = ?, updated_at = datetime('now') WHERE id = ?", [parseInt(oil_change_interval_km) || 10000, id]);
    }
    if (insurance_policy !== undefined) {
      run("UPDATE vehicles SET insurance_policy = ?, updated_at = datetime('now') WHERE id = ?", [insurance_policy, id]);
    }
    if (insurance_expires_at !== undefined) {
      run("UPDATE vehicles SET insurance_expires_at = ?, updated_at = datetime('now') WHERE id = ?", [insurance_expires_at, id]);
    }
    if (model !== undefined) {
      run("UPDATE vehicles SET model = ?, updated_at = datetime('now') WHERE id = ?", [model, id]);
    }
    if (color !== undefined) {
      run("UPDATE vehicles SET color = ?, updated_at = datetime('now') WHERE id = ?", [color, id]);
    }
    if (year !== undefined) {
      run("UPDATE vehicles SET year = ?, updated_at = datetime('now') WHERE id = ?", [year, id]);
    }
    if (renavam !== undefined) {
      run("UPDATE vehicles SET renavam = ?, updated_at = datetime('now') WHERE id = ?", [renavam, id]);
    }
    if (chassis !== undefined) {
      run("UPDATE vehicles SET chassis = ?, updated_at = datetime('now') WHERE id = ?", [chassis, id]);
    }
    if (investor_name !== undefined) {
      run("UPDATE vehicles SET investor_name = ?, updated_at = datetime('now') WHERE id = ?", [investor_name, id]);
    }
    if (investor_split_rate !== undefined) {
      run("UPDATE vehicles SET investor_split_rate = ?, updated_at = datetime('now') WHERE id = ?", [investor_split_rate, id]);
    }
    if (ipva_status !== undefined) {
      run("UPDATE vehicles SET ipva_status = ?, updated_at = datetime('now') WHERE id = ?", [ipva_status, id]);
    }
    if (licensing_status !== undefined) {
      run("UPDATE vehicles SET licensing_status = ?, updated_at = datetime('now') WHERE id = ?", [licensing_status, id]);
    }
    if (licensing_expiration !== undefined) {
      run("UPDATE vehicles SET licensing_expiration = ?, updated_at = datetime('now') WHERE id = ?", [licensing_expiration, id]);
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
    const vehicleId = searchParams.get('id');

    if (!vehicleId) return Response.json({ error: 'ID do veículo é obrigatório.' }, { status: 400 });

    const vehicle = queryOne("SELECT id FROM vehicles WHERE user_id = ? AND id = ?", [user.id, vehicleId]);
    if (!vehicle) return Response.json({ error: 'Veículo não encontrado.' }, { status: 404 });

    run("DELETE FROM vehicles WHERE id = ?", [vehicleId]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
