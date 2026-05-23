import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne, run, generateId } from '@/lib/db';

// GET /api/clientes - List clients
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const health = searchParams.get('health');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM clients WHERE user_id = ?';
    let countSql = 'SELECT COUNT(*) as total FROM clients WHERE user_id = ?';
    const params = [user.id];
    const countParams = [user.id];

    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      countSql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (health) {
      sql += ' AND health_score = ?';
      countSql += ' AND health_score = ?';
      params.push(health);
      countParams.push(health);
    }

    const { total } = queryOne(countSql, countParams);
    sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const clients = query(sql, params);
    return Response.json({ clients, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/clientes - Create client
export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { name, email, phone, document, category, tags, notes, company_name, birthday, address } = await request.json();
    if (!name) return Response.json({ error: 'Nome é obrigatório' }, { status: 400 });

    const id = generateId();
    run(
      `INSERT INTO clients (id, user_id, name, email, phone, document, category, tags, notes, company_name, birthday, address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        user.id,
        name,
        email || null,
        phone || null,
        document || null,
        category || null,
        tags || null,
        notes || null,
        company_name || null,
        birthday || null,
        address || null
      ]
    );

    run('INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [generateId(), user.id, 'client_created', 'client', id, `Cliente ${name} cadastrado`]);

    const client = queryOne('SELECT * FROM clients WHERE id = ?', [id]);
    return Response.json({ client }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
