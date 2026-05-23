// Utility functions for Cobroo

// Format currency in BRL
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Format date in Brazilian format
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
}

// Format datetime
function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR');
}

// Get relative time (e.g., "há 2 horas")
function getRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHour < 24) return `há ${diffHour}h`;
  if (diffDay < 30) return `há ${diffDay} dias`;
  return formatDate(dateStr);
}

// Status labels and colors
const STATUS_CONFIG = {
  pending: { label: 'Pendente', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  reminder_sent: { label: 'Lembrete Enviado', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  paid: { label: 'Pago', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  overdue: { label: 'Vencido', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  cancelled: { label: 'Cancelado', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' }
};

// Health score labels
const HEALTH_CONFIG = {
  good: { label: 'Bom pagador', color: '#10b981', icon: '😊' },
  warning: { label: 'Atenção', color: '#f59e0b', icon: '⚠️' },
  critical: { label: 'Inadimplente', color: '#ef4444', icon: '🚨' }
};

// Recurrence labels
const RECURRENCE_LABELS = {
  once: 'Única',
  weekly: 'Semanal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual'
};

// Channel labels
const CHANNEL_LABELS = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  both: 'WhatsApp + E-mail'
};

// Tone labels
const TONE_LABELS = {
  gentle: 'Gentil 💚',
  neutral: 'Neutro 📋',
  firm: 'Firme ⚡'
};

// Validate email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate phone
function isValidPhone(phone) {
  return /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(phone?.replace(/\s/g, ''));
}

// Generate a random color for avatars
function getAvatarColor(name) {
  const colors = ['#059669', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#ca8a04'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Get initials from name
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// API response helpers
function successResponse(data, status = 200) {
  return Response.json(data, { status });
}

function errorResponse(message, status = 400) {
  return Response.json({ error: message }, { status });
}

module.exports = {
  formatCurrency,
  formatDate,
  formatDateTime,
  getRelativeTime,
  STATUS_CONFIG,
  HEALTH_CONFIG,
  RECURRENCE_LABELS,
  CHANNEL_LABELS,
  TONE_LABELS,
  isValidEmail,
  isValidPhone,
  getAvatarColor,
  getInitials,
  successResponse,
  errorResponse
};
