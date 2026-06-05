import { getUserFromRequest } from '@/lib/auth';
import { queryOne, run } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// GET /api/clientes/[id]/documents/[docId] - Download or view PDF file
export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { id: client_id, docId } = await params;

    const doc = queryOne(
      'SELECT file_name, file_type, file_base64 FROM client_documents WHERE id = ? AND client_id = ? AND user_id = ?',
      [docId, client_id, user.id]
    );

    if (!doc) {
      return Response.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    let buffer;
    if (doc.file_base64.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', doc.file_base64);
      if (fs.existsSync(filePath)) {
        buffer = fs.readFileSync(filePath);
      } else {
        return Response.json({ error: 'Arquivo não encontrado no disco' }, { status: 404 });
      }
    } else {
      buffer = Buffer.from(doc.file_base64, 'base64');
    }

    return new Response(buffer, {
      headers: {
        'Content-Type': doc.file_type || 'application/pdf',
        'Content-Disposition': `inline; filename="${encodeURIComponent(doc.file_name)}"`,
        'Cache-Control': 'private, max-age=86400'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/clientes/[id]/documents/[docId] - Delete a document
export async function DELETE(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { id: client_id, docId } = await params;

    const doc = queryOne(
      'SELECT id, file_base64 FROM client_documents WHERE id = ? AND client_id = ? AND user_id = ?',
      [docId, client_id, user.id]
    );

    if (!doc) {
      return Response.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    if (doc.file_base64 && doc.file_base64.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', doc.file_base64);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Failed to delete file from disk', e.message);
        }
      }
    }

    run('DELETE FROM client_documents WHERE id = ?', [docId]);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
