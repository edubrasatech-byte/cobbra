import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Simple protection check (optional query token or header check)
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const cronSecret = process.env.CRON_SECRET || 'cobbra-cron-key-135';

  if (token && token !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  try {
    // 1. Fetch all active clients
    const clients = db.prepare("SELECT id, user_id FROM clients WHERE deleted_at IS NULL").all();
    let updatedCount = 0;

    // Use a transaction for fast batch updates
    const updateTx = db.transaction(() => {
      for (const client of clients) {
        // Fetch user custom limits or default to standard limits
        const user = db.prepare("SELECT score_limit_good, score_limit_regular FROM users WHERE id = ?").get(client.user_id);
        const limitGood = user?.score_limit_good ?? 0.2;
        const limitRegular = user?.score_limit_regular ?? 0.4;

        // Calculate totals dynamically from actual charges
        const stats = db.prepare(`
          SELECT 
            COALESCE(SUM(amount), 0) as total_charged,
            COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_paid,
            COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0) as total_overdue
          FROM charges 
          WHERE client_id = ?
        `).get(client.id);

        const { total_charged, total_paid, total_overdue } = stats;

        // Calculate dynamic health score
        let healthScore = 'good';
        if (total_charged > 0 && total_overdue > 0) {
          const overdueRatio = total_overdue / total_charged;
          if (overdueRatio < limitGood) {
            healthScore = 'good';
          } else if (overdueRatio < limitRegular) {
            healthScore = 'warning';
          } else {
            healthScore = 'critical';
          }
        }

        // Update both the cached stats and health score in client table
        db.prepare(`
          UPDATE clients 
          SET 
            total_charged = ?,
            total_paid = ?,
            total_overdue = ?,
            health_score = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `).run(total_charged, total_paid, total_overdue, healthScore, client.id);

        updatedCount++;
      }
    });

    updateTx();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully recalculated and updated health scores for ${updatedCount} clients!`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[CRON SCORE UPDATE ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
