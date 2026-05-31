/**
 * COBBRA.AI - Finance Rules & Calculations Module
 * Centraliza o motor de cálculo de juros simples diários e classificação de risco do pagador.
 */

/**
 * Calcula o juro acumulado simples diário de uma cobrança/empréstimo vencido.
 * @param {Object} item - Objeto contendo amount, status, due_date e daily_interest_rate
 * @returns {number} - Valor dos juros calculados
 */
function calcInterest(item) {
  if (!item) return 0;
  if (item.status === 'paid' || item.status === 'cancelled') return 0;
  
  const dailyRate = item.daily_interest_rate !== undefined ? item.daily_interest_rate : 0.1; // Default 0.1% ao dia
  if (dailyRate <= 0) return 0;

  const due = new Date(item.due_date);
  const today = new Date();
  
  // Zera as horas para calcular estritamente por dias corridos
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (due >= today) return 0;

  const diffMs = today.getTime() - due.getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  
  return item.amount * (dailyRate / 100) * days;
}

/**
 * Retorna o nível de risco do pagador baseado nos dias de atraso.
 * @param {Object} item - Objeto contendo status e due_date
 * @returns {Object} - Rótulo (l), cor (c) e cor de background (bg)
 */
function getPayerRisk(item) {
  if (!item) return { l: 'Não identificado', c: '#64748b', bg: 'rgba(100,116,139,0.08)' };
  if (item.status === 'paid') return { l: 'Quitado ✅', c: '#10b981', bg: 'rgba(16,185,129,0.08)' };
  if (item.status === 'pending') return { l: 'Risco Baixo 👍', c: '#3b82f6', bg: 'rgba(59,130,246,0.08)' };
  
  const due = new Date(item.due_date);
  const today = new Date();
  
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (due >= today) return { l: 'Risco Baixo 👍', c: '#3b82f6', bg: 'rgba(59,130,246,0.08)' };

  const diffMs = today.getTime() - due.getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  
  if (days <= 5) return { l: 'Atraso Leve 🟡', c: '#f59e0b', bg: 'rgba(245,158,11,0.08)' };
  return { l: 'Risco Crítico ⚡⚠️', c: '#ef4444', bg: 'rgba(239,68,68,0.08)' };
}

module.exports = {
  calcInterest,
  getPayerRisk
};
