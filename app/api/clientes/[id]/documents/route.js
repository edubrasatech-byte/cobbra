import { getUserFromRequest } from '@/lib/auth';
import { query, run, generateId, queryOne } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const MIME_EXTENSION_MAP = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

function ensureUploadsDir() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}

function parseBase64(raw, defaultExt = 'pdf') {
  const dataUriMatch = raw.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUriMatch) {
    const mime = dataUriMatch[1];
    const ext = MIME_EXTENSION_MAP[mime] || mime.split('/')[1] || defaultExt;
    return { ext, buffer: Buffer.from(dataUriMatch[2], 'base64') };
  }
  return { ext: defaultExt, buffer: Buffer.from(raw, 'base64') };
}

// GET /api/clientes/[id]/documents - List client documents metadata
export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { id: client_id } = await params;

    // Check if client exists and belongs to user
    const client = queryOne('SELECT id FROM clients WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [client_id, user.id]);
    if (!client) return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });

    const docs = query(
      'SELECT id, name, file_name, file_type, file_size, created_at FROM client_documents WHERE client_id = ? AND user_id = ? ORDER BY created_at DESC',
      [client_id, user.id]
    );

    return Response.json({ documents: docs }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/clientes/[id]/documents - Upload/Index a new document for a client
export async function POST(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { id: client_id } = await params;

    // Check if client exists
    const client = queryOne('SELECT id FROM clients WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [client_id, user.id]);
    if (!client) return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });

    const body = await request.json();
    const { name, file_name, file_type, file_size, file_base64 } = body;

    if (!name || !file_name || !file_type || !file_base64) {
      return Response.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    // Validar tipo de arquivo
    const mappedExt = MIME_EXTENSION_MAP[file_type];
    if (!mappedExt) {
      return Response.json({ error: 'Tipo de arquivo não permitido. Apenas PDF, JPG, JPEG, PNG, GIF e WEBP são suportados.' }, { status: 400 });
    }

    const { ext, buffer } = parseBase64(file_base64, mappedExt);

    // Validar tamanho do arquivo decodificado no servidor (max 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return Response.json({ error: 'O arquivo excede o limite de tamanho permitido de 10MB.' }, { status: 400 });
    }

    const docId = generateId();

    const uploadsDir = ensureUploadsDir();
    const diskFileName = `${docId}.${ext}`;
    const filePath = path.join(uploadsDir, diskFileName);

    fs.writeFileSync(filePath, buffer);
    const relativePath = `/uploads/${diskFileName}`;

    run(
      `INSERT INTO client_documents (id, user_id, client_id, name, file_name, file_type, file_size, file_base64)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [docId, user.id, client_id, name, file_name, file_type, parseInt(file_size || 0), relativePath]
    );

    const newDoc = {
      id: docId,
      name,
      file_name,
      file_type,
      file_size: parseInt(file_size || 0),
      created_at: new Date().toISOString()
    };

    return Response.json({ success: true, document: newDoc }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
