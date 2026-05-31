import { getUserFromRequest } from '@/lib/auth';
import { run, query, queryOne, generateId } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// Mapa de MIME-type → extensão para detectar o tipo do arquivo
const MIME_EXTENSION_MAP = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

/**
 * Garante que o diretório de uploads exista no primeiro uso.
 */
function ensureUploadsDir() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Diretório /public/uploads criado com sucesso.');
  }
  return uploadsDir;
}

/**
 * Extrai extensão e bytes puros a partir de uma string base64.
 * Aceita tanto Data URI ("data:application/pdf;base64,AAAA...")
 * quanto base64 puro (sem prefixo).
 */
function parseBase64(raw) {
  const dataUriMatch = raw.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUriMatch) {
    const mime = dataUriMatch[1];
    const ext = MIME_EXTENSION_MAP[mime] || mime.split('/')[1] || 'bin';
    return { ext, buffer: Buffer.from(dataUriMatch[2], 'base64') };
  }
  // Base64 puro (sem prefixo) — assume PDF como padrão (contexto do módulo veicular)
  return { ext: 'pdf', buffer: Buffer.from(raw, 'base64') };
}

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicle_id');

    if (!vehicleId) return Response.json({ error: 'Falta o ID do veículo.' }, { status: 400 });

    const docs = query(
      "SELECT id, name, created_at FROM vehicle_documents WHERE vehicle_id = ? ORDER BY created_at DESC",
      [vehicleId]
    );

    return Response.json({ documents: docs });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { vehicle_id, name, file_base64 } = body;

    if (!vehicle_id || !name || !file_base64) {
      return Response.json({ error: 'ID do veículo, Nome do documento e arquivo PDF em base64 são obrigatórios.' }, { status: 400 });
    }

    const id = generateId();

    // Decodifica base64 e salva arquivo em disco ao invés do banco
    const uploadsDir = ensureUploadsDir();
    const { ext, buffer } = parseBase64(file_base64);
    const fileName = `${id}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    // Armazena apenas o caminho relativo na coluna (compatibilidade retroativa)
    const relativePath = `/uploads/${fileName}`;

    run(
      "INSERT INTO vehicle_documents (id, vehicle_id, name, file_base64) VALUES (?, ?, ?, ?)",
      [id, vehicle_id, name.trim(), relativePath]
    );

    return Response.json({ success: true, id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
