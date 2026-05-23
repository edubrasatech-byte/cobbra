import { getUserFromRequest } from '@/lib/auth';
import { query, run, generateId } from '@/lib/db';

// GET /api/notifications
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    const notifications = query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [user.id]
    );
    const unreadCount = query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0', [user.id]
    )[0]?.count || 0;
    return Response.json({ notifications, unreadCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/notifications - mark read
export async function PUT(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    if (body.markAllRead) {
      run('UPDATE notifications SET read = 1 WHERE user_id = ?', [user.id]);
    } else if (body.id) {
      run('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?', [body.id, user.id]);
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/notifications - clear history
export async function DELETE(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    run('DELETE FROM notifications WHERE user_id = ?', [user.id]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
