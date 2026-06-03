import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    if (clientId) {
      // Return specific client balance and statement
      const client = queryOne(
        'SELECT id, name, email, phone, wallet_balance, withdrawal_count, asaas_customer_id FROM clients WHERE id = ? AND user_id = ?',
        [clientId, user.id]
      );

      if (!client) {
        return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
      }

      // Fetch client transactions (ledger)
      const transactions = query(
        'SELECT * FROM transactions WHERE client_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 50',
        [clientId, user.id]
      );

      // Fetch bank transfers (withdrawals)
      const transfers = query(
        'SELECT * FROM bank_transfers WHERE client_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 50',
        [clientId, user.id]
      );

      // Consolidate into a single timeline
      const timeline = [
        ...transactions.map(t => ({
          id: t.id,
          type: t.type === 'income' ? 'credit' : 'debit',
          category: 'Transação',
          amount: t.amount,
          method: t.payment_method || 'Pix',
          description: t.notes || 'Movimentação de carteira',
          date: t.created_at
        })),
        ...transfers.map(tf => ({
          id: tf.id,
          type: 'debit',
          category: 'Saque',
          amount: tf.amount,
          fee: tf.fee,
          netAmount: tf.net_amount,
          status: tf.status,
          method: 'Pix',
          description: `Saque Pix solicitado (Chave: ${tf.pix_key})`,
          date: tf.created_at
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      return Response.json({
        client,
        wallet_balance: client.wallet_balance || 0,
        withdrawal_count: client.withdrawal_count || 0,
        timeline
      });
    } else {
      // Return list of all client balances for dashboard overview
      const clients = query(
        'SELECT id, name, email, phone, wallet_balance, withdrawal_count FROM clients WHERE user_id = ? ORDER BY name ASC',
        [user.id]
      );

      const totalBalance = clients.reduce((sum, c) => sum + (c.wallet_balance || 0), 0);

      return Response.json({
        totalBalance,
        clients
      });
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
