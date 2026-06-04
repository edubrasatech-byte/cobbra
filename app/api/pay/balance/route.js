import { getUserFromRequest } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

/**
 * GET /api/pay/balance
 * Retorna o saldo da carteira Cobbra Pay do assinante logado,
 * a timeline consolidada de movimentações (receitas e saques)
 * e a lista de motoristas disponíveis para cobrança rápida.
 */
export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar dados atualizados de carteira do assinante (users)
    const userData = queryOne(
      'SELECT wallet_balance, withdrawal_count FROM users WHERE id = ?',
      [user.id]
    );

    if (!userData) {
      return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar lista de clientes/motoristas para o modal de cobrança rápida
    const clientsList = query(
      'SELECT id, name, email, phone, wallet_balance FROM clients WHERE user_id = ? AND deleted_at IS NULL ORDER BY name ASC',
      [user.id]
    );

    // Buscar todas as transações financeiras (entradas e saídas manuais)
    const transactions = query(
      `SELECT t.*, c.name as client_name 
       FROM transactions t 
       LEFT JOIN clients c ON t.client_id = c.id 
       WHERE t.user_id = ? 
       ORDER BY t.created_at DESC LIMIT 50`,
      [user.id]
    );

    // Buscar saques externos (bank_transfers)
    const transfers = query(
      'SELECT * FROM bank_transfers WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [user.id]
    );

    // Consolidar em uma única timeline estilo extrato bancário
    const timeline = [
      ...transactions.map(t => ({
        id: t.id,
        type: t.type === 'income' ? 'credit' : 'debit',
        category: t.type === 'income' ? 'Recebimento' : 'Ajuste',
        amount: t.amount,
        method: t.payment_method || 'Pix',
        description: t.type === 'income' 
          ? `Recebido de ${t.client_name || 'Cliente'}` 
          : (t.notes || 'Ajuste de carteira'),
        notes: t.notes || '',
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
        description: `Saque Pix efetuado`,
        notes: `Chave: ${tf.pix_key} (${tf.pix_key_type})`,
        date: tf.created_at
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 100);

    return Response.json({
      wallet_balance: userData.wallet_balance || 0,
      withdrawal_count: userData.withdrawal_count || 0,
      clients: clientsList,
      timeline
    });

  } catch (error) {
    console.error('Error fetching balance:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
