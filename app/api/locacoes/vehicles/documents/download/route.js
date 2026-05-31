import { getUserFromRequest } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('id');

    if (!docId) return Response.json({ error: 'Falta o ID do documento.' }, { status: 400 });

    const doc = queryOne("SELECT * FROM vehicle_documents WHERE id = ?", [docId]);
    if (!doc) return Response.json({ error: 'Documento não encontrado.' }, { status: 404 });

    // Compatibilidade retroativa: detectar se o valor é um caminho de arquivo
    // (novo formato: "/uploads/uuid.pdf") ou base64 legado ("data:..." ou base64 puro)
    if (doc.file_base64 && doc.file_base64.startsWith('/uploads/')) {
      // Novo formato: ler arquivo do disco e converter de volta para base64
      const filePath = path.join(process.cwd(), 'public', doc.file_base64);

      if (!fs.existsSync(filePath)) {
        return Response.json({ error: 'Arquivo não encontrado no disco.' }, { status: 404 });
      }

      const fileBuffer = fs.readFileSync(filePath);
      const base64Content = fileBuffer.toString('base64');

      return Response.json({
        doc: {
          ...doc,
          file_base64: base64Content
        }
      });
    }

    // Legado: base64 armazenado diretamente no banco — retorna como está
    return Response.json({ doc });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
