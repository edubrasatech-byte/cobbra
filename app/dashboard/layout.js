'use client';
import { useState, useEffect, useId } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Chatbot, { formatMessageText } from '../components/Chatbot';
import Sidebar from '../components/dashboard/Sidebar';
import MobileNav from '../components/dashboard/MobileNav';
import TopBar from '../components/dashboard/TopBar';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '💳', label: 'Cobbra Pay' },
  { href: '/dashboard/cobrancas', icon: '💰', label: 'Cobranças' },
  { href: '/dashboard/custodia', icon: '🔒', label: 'Custódia' },
  { href: '/dashboard/cobranca-diaria', icon: '📅', label: 'Recorrentes' },
  { href: '/dashboard/calendario', icon: '🗓️', label: 'Calendário' },
  { href: '/dashboard/clientes', icon: '👥', label: 'Clientes' },
  { href: '/dashboard/relatorios', icon: '📈', label: 'Relatórios' },
  { href: '/dashboard/lembretes', icon: '🔔', label: 'Lembretes' },
  { href: '/dashboard/configuracoes', icon: '⚙️', label: 'Ajustes' },
  { href: '/dashboard/atualizacoes', icon: '🔄', label: 'Atualizações' },
];

const LEADS_ITEM = { href: '/dashboard/leads', icon: '🔍', label: 'Prospecção' };
const ADMIN_ITEM = { href: '/dashboard/admin', icon: '🛡️', label: 'Admin' };

const NAV_ICONS = {
  '/dashboard': (colorClass) => (
    <svg className={colorClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <rect x="6" y="14" width="3" height="1" />
    </svg>
  ),
  '/dashboard/leads': (colorClass) => (
    <svg className={colorClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
      <line x1="11" y1="8" x2="11" y2="14" />
    </svg>
  ),
  '/dashboard/cobrancas': (colorClass) => (
    <svg className={colorClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  '/dashboard/custodia': (colorClass) => (
    <svg className={colorClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  '/dashboard/cobranca-diaria': (colorClass) => (
    <svg className={colorClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6" />
      <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  ),
  '/dashboard/calendario': (colorClass) => (
    <svg className={colorClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  '/dashboard/clientes': (colorClass) => (
    <svg className={colorClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  '/dashboard/relatorios': (colorClass) => (
    <svg className={colorClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  '/dashboard/lembretes': (colorClass) => (
    <svg className={colorClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  '/dashboard/configuracoes': (colorClass) => (
    <svg className={colorClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  '/dashboard/atualizacoes': (colorClass) => (
    <svg className={colorClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6" />
      <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  ),
  '/dashboard/locacoes': (colorClass) => (
    <svg className={colorClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  ),
  '/dashboard/emprestimos': (colorClass) => (
    <svg className={colorClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  '/dashboard/obras': (colorClass) => (
    <svg className={colorClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 22h20" />
      <path d="M8 22V8" />
      <path d="M16 22V8" />
      <path d="M4 12h16" />
      <path d="M4 16h16" />
      <path d="M8 4l8-2v4Z" />
    </svg>
  ),
  '/dashboard/admin': (colorClass) => (
    <svg className={colorClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  '/dashboard/veiculos': (colorClass) => (
    <svg className={colorClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M12 2v9M8 5h8" />
    </svg>
  ),
  '/dashboard/manutencoes': (colorClass) => (
    <svg className={colorClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
};

// ========== MINI SNAKE MASCOT LOGO ==========
function MiniSnake({ size = 40, style = {} }) {
  const gradId = 'miniGradLayout-' + useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={style}>
      <g transform="translate(1.5, 1.5)">
        <path d="M8 30 C4 28, 3 22, 8 18 C13 14, 20 13, 25 17 C30 21, 33 18, 33 13 C33 9, 29 7, 26 9" stroke={`url(#${gradId})`} strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="24" cy="8" r="5" fill={`url(#${gradId})`} />
        <circle cx="23" cy="7" r="1.2" fill="white" />
        <circle cx="26" cy="7" r="1.2" fill="white" />
        <circle cx="23.2" cy="7.3" r="0.7" fill="#0f172a" />
        <circle cx="26.2" cy="7.3" r="0.7" fill="#0f172a" />
      </g>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const horizontalPadding = isDesktop ? '40px' : '16px';

  // Copilot States
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResponse, setCopilotResponse] = useState(null);
  const [showCopilotModal, setShowCopilotModal] = useState(false);
  const [copilotError, setCopilotError] = useState('');
  const [copilotSuccessMsg, setCopilotSuccessMsg] = useState('');
  const [allClients, setAllClients] = useState([]);

  // Search, profile modal and rebate states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientCharges, setClientCharges] = useState([]);
  const [loadingCharges, setLoadingCharges] = useState(false);
  const [showRebateModal, setShowRebateModal] = useState(false);
  const [rebateCharge, setRebateCharge] = useState(null);
  const [rebateAmount, setRebateAmount] = useState('');
  const [rebateMsg, setRebateMsg] = useState('');

  // Load clients for the Copilot selector
  useEffect(() => {
    if (showCopilotModal) {
      fetch('/api/clientes?limit=200')
        .then(r => r.json())
        .then(data => setAllClients(data.clients || []))
        .catch(() => {});
    }
  }, [showCopilotModal]);

  // Command+K listener to trigger AI Copilot
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCopilotModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function handleCopilotSubmit(commandText) {
    if (!commandText || !commandText.trim()) return;
    setCopilotLoading(true);
    setCopilotError('');
    setCopilotSuccessMsg('');
    setShowCopilotModal(true);
    setCopilotResponse(null);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: commandText })
      });
      const data = await res.json();
      if (res.ok) {
        setCopilotResponse(data);
        if (data.intent === 'view_stats') {
          router.push('/dashboard/relatorios');
          setTimeout(() => {
            setShowCopilotModal(false);
            setCopilotInput('');
          }, 2000);
        } else if (data.intent === 'view_clients') {
          router.push('/dashboard/clientes');
          setTimeout(() => {
            setShowCopilotModal(false);
            setCopilotInput('');
          }, 2000);
        } else if (data.intent === 'view_calendar') {
          router.push('/dashboard/calendario');
          setTimeout(() => {
            setShowCopilotModal(false);
            setCopilotInput('');
          }, 2000);
        }
      } else {
        setCopilotError(data.error || 'Erro ao processar comando com Copilot');
      }
    } catch (e) {
      setCopilotError('Erro de conexão ao servidor.');
    } finally {
      setCopilotLoading(false);
    }
  }

  async function executeCopilotAction() {
    if (!copilotResponse) return;
    setCopilotLoading(true);
    setCopilotError('');
    
    const { intent, client_id, amount, due_date, description } = copilotResponse;

    if (!client_id) {
      setCopilotError('Por favor, selecione um cliente para lançar a cobrança.');
      setCopilotLoading(false);
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setCopilotError('Por favor, insira um valor válido maior que zero.');
      setCopilotLoading(false);
      return;
    }

    try {
      if (intent === 'create_charge') {
        const res = await fetch('/api/cobrancas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id,
            amount: parseFloat(amount),
            due_date,
            description: description || 'Cobrança via AI Copilot',
            recurrence: 'once',
            reminder_channel: 'both',
            payment_method: 'pix',
            daily_interest_rate: 0
          })
        });
        const data = await res.json();
        if (res.ok) {
          setCopilotSuccessMsg('Cobrança lançada com sucesso! 🐍🎉');
          window.dispatchEvent(new Event('refresh-notifications'));
          setCopilotInput('');
          setTimeout(() => {
            setShowCopilotModal(false);
            setCopilotResponse(null);
            if (pathname === '/dashboard' || pathname === '/dashboard/cobrancas') {
              window.location.reload();
            }
          }, 2000);
        } else {
          setCopilotError(data.error || 'Erro ao criar cobrança.');
        }
      } else if (intent === 'create_daily_billing') {
        const res = await fetch('/api/cobranca-diaria', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id,
            amount: parseFloat(amount),
            description: description || 'Faturamento Diário via AI Copilot',
            interest_rate: 0,
            status: 'active'
          })
        });
        const data = await res.json();
        if (res.ok) {
          setCopilotSuccessMsg('Faturamento diário configurado com sucesso! 📅🐍');
          window.dispatchEvent(new Event('refresh-notifications'));
          setCopilotInput('');
          setTimeout(() => {
            setShowCopilotModal(false);
            setCopilotResponse(null);
            if (pathname === '/dashboard/cobranca-diaria') {
              window.location.reload();
            }
          }, 2000);
        } else {
          setCopilotError(data.error || 'Erro ao criar faturamento diário.');
        }
      }
    } catch (e) {
      setCopilotError('Erro de conexão ao servidor.');
    } finally {
      setCopilotLoading(false);
    }
  }

  // Search effect
  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      fetch(`/api/clientes?search=${encodeURIComponent(searchTerm)}&limit=5`)
        .then(r => r.json())
        .then(data => setSearchResults(data.clients || []))
        .catch(() => setSearchResults([]));
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const [clientDocs, setClientDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const loadClientDocs = async (clientId) => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/clientes/${clientId}/documents`);
      const data = await res.json();
      setClientDocs(data.documents || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione apenas arquivos PDF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Tamanho máximo permitido: 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const res = await fetch(`/api/clientes/${selectedClient.id}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name.replace('.pdf', ''),
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_base64: base64
          })
        });
        if (res.ok) {
          alert('PDF anexado com sucesso!');
          loadClientDocs(selectedClient.id);
        } else {
          const err = await res.json();
          alert(err.error || 'Erro ao fazer upload do PDF.');
        }
      } catch (err) {
        console.error(err);
        alert('Erro de conexão ao enviar PDF.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePdfDownload = async (docId, fileName) => {
    try {
      const res = await fetch(`/api/clientes/${selectedClient.id}/documents/${docId}`);
      const data = await res.json();
      if (data.document && data.document.file_base64) {
        const base64 = data.document.file_base64;
        const linkSource = `data:application/pdf;base64,${base64}`;
        const downloadLink = document.createElement("a");
        downloadLink.href = linkSource;
        downloadLink.download = fileName;
        downloadLink.click();
      } else {
        alert('Erro ao recuperar o arquivo PDF.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao baixar PDF.');
    }
  };

  const handlePdfDelete = async (docId) => {
    if (!confirm('Deseja realmente excluir este documento PDF?')) return;
    try {
      const res = await fetch(`/api/clientes/${selectedClient.id}/documents/${docId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('PDF removido com sucesso!');
        loadClientDocs(selectedClient.id);
      } else {
        alert('Erro ao excluir documento.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao excluir PDF.');
    }
  };

  const handleClientAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Tamanho máximo da imagem: 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      try {
        const res = await fetch(`/api/clientes/${selectedClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...selectedClient,
            avatar_url: base64
          })
        });
        if (res.ok) {
          alert('Foto do cliente atualizada!');
          refreshSelectedClientInHeader(selectedClient.id);
        } else {
          const err = await res.json();
          alert(err.error || 'Erro ao atualizar foto.');
        }
      } catch (err) {
        console.error(err);
        alert('Erro de conexão ao salvar foto.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRefundCharge = async (chargeId) => {
    if (!confirm('Deseja realmente estornar esta cobrança? O valor será deduzido do seu saldo e o status será marcado como reembolsado.')) return;
    try {
      const res = await fetch(`/api/cobrancas/${chargeId}/refund`, {
        method: 'POST'
      });
      if (res.ok) {
        alert('Cobrança estornada com sucesso!');
        refreshSelectedClientInHeader(selectedClient.id);
        fetch(`/api/cobrancas?client_id=${selectedClient.id}`)
          .then(r => r.json())
          .then(data => setClientCharges(data.charges || []));
      } else {
        const err = await res.json();
        alert(err.error || 'Falha ao estornar cobrança.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao realizar estorno.');
    }
  };

  // Load client charges and docs when client is selected
  useEffect(() => {
    if (selectedClient) {
      setLoadingCharges(true);
      fetch(`/api/cobrancas?client_id=${selectedClient.id}`)
        .then(r => r.json())
        .then(data => {
          setClientCharges(data.charges || []);
          setLoadingCharges(false);
        })
        .catch(() => setLoadingCharges(false));
      loadClientDocs(selectedClient.id);
    } else {
      setClientCharges([]);
      setClientDocs([]);
    }
  }, [selectedClient]);

  const refreshSelectedClientInHeader = async (clientId) => {
    try {
      const res = await fetch(`/api/clientes?limit=100`);
      const data = await res.json();
      const updatedClient = (data.clients || []).find(c => c.id === clientId);
      if (updatedClient) {
        setSelectedClient(updatedClient);
      }
    } catch (e) {
      console.error(e);
    }
  };

  async function payChargeInHeader(chargeId, clientId) {
    await fetch(`/api/cobrancas/${chargeId}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ status: 'paid' }) 
    });
    setLoadingCharges(true);
    const r = await fetch(`/api/cobrancas?client_id=${clientId}`);
    const data = await r.json();
    setClientCharges(data.charges || []);
    setLoadingCharges(false);
    
    refreshSelectedClientInHeader(clientId);
    window.dispatchEvent(new Event('refresh-notifications'));
  }

  async function handleRebateSubmit(e) {
    e.preventDefault();
    if (!rebateCharge || !rebateAmount || parseFloat(rebateAmount) <= 0) return;
    
    const res = await fetch(`/api/cobrancas/${rebateCharge.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rebateAmount: parseFloat(rebateAmount) })
    });

    if (res.ok) {
      setShowRebateModal(false);
      setRebateAmount('');
      setRebateCharge(null);
      setRebateMsg('Abatimento de pagamento efetuado! 💸');
      setTimeout(() => setRebateMsg(''), 3000);
      
      if (selectedClient) {
        setLoadingCharges(true);
        const r = await fetch(`/api/cobrancas?client_id=${selectedClient.id}`);
        const data = await r.json();
        setClientCharges(data.charges || []);
        setLoadingCharges(false);
        refreshSelectedClientInHeader(selectedClient.id);
      }
      window.dispatchEvent(new Event('refresh-notifications'));
    }
  }

  const getPayerScore = c => {
    const limitGood = user?.score_limit_good ?? 0.2;
    const limitRegular = user?.score_limit_regular ?? 0.4;
    
    if (!c.total_charged || c.total_charged === 0) {
      return { l: 'Excelente', c: 'text-emerald-400', bg: 'bg-emerald-500/10', s: '⭐⭐⭐⭐⭐' };
    }
    const overdueRatio = c.total_overdue / c.total_charged;
    if (c.total_overdue === 0) {
      return { l: 'Excelente', c: 'text-emerald-400', bg: 'bg-emerald-500/10', s: '⭐⭐⭐⭐⭐' };
    } else if (overdueRatio < limitGood) {
      return { l: 'Bom', c: 'text-teal-400', bg: 'bg-teal-500/10', s: '⭐⭐⭐⭐' };
    } else if (overdueRatio < limitRegular) {
      return { l: 'Regular', c: 'text-amber-400', bg: 'bg-amber-500/10', s: '⭐⭐⭐' };
    } else {
      return { l: 'Alto Risco', c: 'text-rose-400', bg: 'bg-rose-500/10', s: '⭐' };
    }
  };

  const calcInterest = c => {
    if (c.status === 'paid' || c.status === 'cancelled') return 0;
    if (!c.daily_interest_rate || c.daily_interest_rate <= 0) return 0;
    const due = new Date(c.due_date);
    const today = new Date();
    if (due >= today) return 0;
    const days = Math.max(0, Math.floor((today - due) / (1000 * 60 * 60 * 24)));
    return c.amount * (c.daily_interest_rate / 100) * days;
  };

  const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const fetchUser = () => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.user) {
        setUser(data.user);
        if (data.user.onboarding_completed === 0 && pathname !== '/dashboard/onboarding') {
          router.push('/dashboard/onboarding');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    }).catch(() => { router.push('/login'); setLoading(false); });
  };

  useEffect(() => {
    fetchUser();
    window.addEventListener('userAvatarUpdated', fetchUser);
    return () => window.removeEventListener('userAvatarUpdated', fetchUser);
  }, [router, pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const dynamicNavItems = [...NAV_ITEMS];
  
  if (user?.business_niche === 'locacao_veiculos') {
    dynamicNavItems.splice(3, 0, { href: '/dashboard/locacoes', icon: '🚗', label: 'Locações' });
    dynamicNavItems.splice(4, 0, { href: '/dashboard/veiculos', icon: '🔑', label: 'Veículos' });
    dynamicNavItems.splice(5, 0, { href: '/dashboard/manutencoes', icon: '🛠️', label: 'Manutenções' });
  } else if (user?.business_niche === 'emprestimo') {
    dynamicNavItems.splice(3, 0, { href: '/dashboard/emprestimos', icon: '💸', label: 'Empréstimos' });
  } else if (user?.business_niche === 'construcao_civil') {
    dynamicNavItems.splice(1, 0, { href: '/dashboard/obras', icon: '🏗️', label: 'Obras' });
  }

  const navItems = user?.role === 'admin_senior' || user?.role === 'admin'
    ? [...dynamicNavItems, LEADS_ITEM, ADMIN_ITEM] : dynamicNavItems;

  const pageTitle = navItems.find(i => i.href === pathname)?.label || 'Visão Geral';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070913] text-slate-100 font-sans p-6">
        <div className="flex flex-col items-center justify-center text-center max-w-xs w-full">
          <div className="mb-8 animate-bounce select-none flex items-center justify-center w-24 h-24 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-2xl shadow-emerald-500/10">
            <MiniSnake size={54} />
          </div>
          <div className="flex justify-center items-center mb-6">
            <div className="w-10 h-10 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-200 text-xs font-bold tracking-widest uppercase">Carregando Cobbra</p>
          <p className="text-slate-500 text-[10px] mt-1.5 font-semibold">Preparando seu ambiente financeiro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-base-theme text-primary-theme font-sans antialiased overflow-x-hidden">
      
      {/* 🖥️ Desktop Collapsible Slim Sidebar */}
      <Sidebar 
        user={user}
        pathname={pathname}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        handleLogout={handleLogout}
        NAV_ITEMS={navItems}
        NAV_ICONS={NAV_ICONS}
      />

      {/* 📱 Mobile Side Navigation Drawer */}
      <MobileNav 
        user={user}
        pathname={pathname}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        handleLogout={handleLogout}
        NAV_ITEMS={navItems}
        NAV_ICONS={NAV_ICONS}
      />

      {/* 🚀 Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-hidden pb-20 md:pb-0">
        
        {/* 🧼 Minimalist Flat Header */}
        <TopBar 
          pageTitle={pageTitle}
          setMobileSidebarOpen={setMobileSidebarOpen}
          chatbotOpen={chatbotOpen}
          setChatbotOpen={setChatbotOpen}
          user={user}
          horizontalPadding={horizontalPadding}
          copilotInput={copilotInput}
          setCopilotInput={setCopilotInput}
          handleCopilotSubmit={handleCopilotSubmit}
          searchResults={searchResults}
          setSearchResults={setSearchResults}
          setSelectedClient={setSelectedClient}
          setShowCopilotModal={setShowCopilotModal}
        />

        {/* 📋 Main Scrollable Content Area */}
        <main 
          className="flex-1 w-full max-w-full overflow-y-auto overflow-x-hidden px-6 md:px-12 pt-10 pb-24 md:pb-8"
          style={{ 
            paddingLeft: horizontalPadding, 
            paddingRight: horizontalPadding,
            paddingTop: isDesktop ? '48px' : '36px',
            paddingBottom: isDesktop ? '32px' : '96px'
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Nubank/Revolut Style) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-modal-theme backdrop-blur-sm border-t border-theme z-40 flex items-center justify-around md:hidden shadow-2xl">
        {[
          { href: '/dashboard', label: 'Início' },
          { href: '/dashboard/cobrancas', label: 'Cobranças' },
          { href: '/dashboard/clientes', label: 'Clientes' },
          { href: '/dashboard/configuracoes', label: 'Ajustes' },
        ].map(item => {
          const isActive = pathname === item.href;
          return (
            <a 
              key={item.href} 
              href={item.href} 
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors relative ${
                isActive ? "text-emerald-500 font-bold" : "text-secondary-theme hover:text-primary-theme"
              }`}
            >
              <span className="mb-1 flex items-center justify-center">
                {NAV_ICONS[item.href] ? NAV_ICONS[item.href](isActive ? "w-4.5 h-4.5 text-emerald-500" : "w-4.5 h-4.5 text-secondary-theme") : null}
              </span>
              <span className="text-[8px] uppercase tracking-wider font-semibold">{item.label}</span>
              {isActive && <span className="absolute bottom-0 w-6 h-0.5 bg-emerald-500 rounded-full" />}
            </a>
          );
        })}
      </nav>

      {/* Stripe-style Global Client Details Modal Drawer */}
      {selectedClient && (
        <div 
          className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm z-50 flex items-center justify-center md:items-stretch md:justify-end p-4 md:p-0"
          onClick={() => setSelectedClient(null)}
        >
          {/* Drawer / Modal Container */}
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-modal-theme rounded-2xl md:rounded-none md:rounded-l-3xl p-6 md:p-8 w-full max-w-xl md:h-screen overflow-y-auto border border-theme md:border-y-0 md:border-r-0 md:border-l shadow-2xl flex flex-col"
          >
            
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-theme pb-5 mb-5 flex-shrink-0">
              <div className="flex gap-4 items-center">
                <div className="relative group w-12 h-12 flex-shrink-0 select-none">
                  {selectedClient.avatar_url ? (
                    <img src={selectedClient.avatar_url} alt={selectedClient.name} className="w-12 h-12 rounded-full object-cover border border-theme" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-lg">
                      {selectedClient.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[9px] text-white font-bold">
                    Alterar
                    <input type="file" accept="image/*" onChange={handleClientAvatarUpload} className="hidden" />
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary-theme">{selectedClient.name}</h3>
                  <p className="text-xs text-secondary-theme mt-1">
                    {selectedClient.category || 'Geral'} • {selectedClient.phone || 'Sem celular'}
                  </p>
                  <p className="text-[11px] text-muted-theme mt-0.5">{selectedClient.email || 'Sem e-mail'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="w-8 h-8 rounded-full bg-input-theme hover:bg-surface-theme border border-theme text-secondary-theme flex items-center justify-center transition-colors">×</button>
            </div>

            {/* Score and Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6" style={{ marginBottom: '32px' }}>
              <div className="bg-card-theme rounded-2xl p-4 border border-theme flex flex-col gap-1.5 justify-center">
                <span className="text-[10px] text-muted-theme uppercase font-semibold">Score Pagador</span>
                <span className={`text-xs font-extrabold ${getPayerScore(selectedClient).c}`}>{getPayerScore(selectedClient).l}</span>
              </div>
              <div className="bg-card-theme rounded-2xl p-4 border border-theme flex flex-col gap-1.5">
                <span className="text-[10px] text-muted-theme uppercase font-semibold">Cobrado</span>
                <span className="text-xs font-extrabold text-primary-theme block">{fmt(selectedClient.total_charged)}</span>
              </div>
              <div className="bg-card-theme rounded-2xl p-4 border border-theme flex flex-col gap-1.5">
                <span className="text-[10px] text-muted-theme uppercase font-semibold">Quitado</span>
                <span className="text-xs font-extrabold text-emerald-500 block">{fmt(selectedClient.total_paid)}</span>
              </div>
              <div className={`rounded-2xl p-4 border flex flex-col gap-1.5 ${
                selectedClient.total_overdue > 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-card-theme border-theme'
              }`} style={{ height: '100%' }}>
                <span className="text-[10px] text-muted-theme uppercase font-semibold">Em Aberto</span>
                <span className={`text-xs font-extrabold block ${selectedClient.total_overdue > 0 ? 'text-rose-400' : 'text-secondary-theme'}`}>{fmt(selectedClient.total_overdue)}</span>
              </div>
            </div>

            {/* Debts list / History */}
            <h4 className="text-sm font-bold text-primary-theme mb-3" style={{ marginTop: '12px', marginBottom: '16px' }}>Histórico Financeiro</h4>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {loadingCharges ? (
                <p className="text-secondary-theme text-xs text-center py-6">Carregando faturas...</p>
              ) : clientCharges.length === 0 ? (
                <p className="text-muted-theme text-xs text-center py-6">Nenhuma cobrança registrada.</p>
              ) : (
                clientCharges.map(c => {
                  const interest = calcInterest(c);
                  return (
                    <div key={c.id} className="bg-surface-theme border border-theme rounded-xl p-4 flex justify-between items-center hover:border-emerald-500/20 transition-colors">
                      <div className="min-w-0 pr-4">
                        <p className="text-xs font-bold text-primary-theme truncate">{c.description || 'Cobrança Avulsa'}</p>
                        <p className="text-[10px] text-secondary-theme mt-1">
                          Vencimento: {new Date(c.due_date).toLocaleDateString('pt-BR')}
                        </p>
                        {interest > 0 && (
                          <span className="text-[10px] text-amber-500 font-semibold block mt-1">
                            Aviso: Juros acumulados: {fmt(interest)} (+{c.daily_interest_rate}%/dia)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-black text-primary-theme">{fmt(c.amount + interest)}</p>
                        </div>
                        {c.status !== 'paid' && c.status !== 'cancelled' ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => payChargeInHeader(c.id, selectedClient.id)} 
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-[10px] transition-colors cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button 
                              onClick={() => {
                                setRebateCharge(c);
                                setShowRebateModal(true);
                              }} 
                              className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-extrabold text-[10px] transition-colors cursor-pointer"
                            >
                              Abater
                            </button>
                          </div>
                        ) : c.status === 'paid' && (
                          <button 
                            onClick={() => handleRefundCharge(c.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-400 font-extrabold text-[10px] transition-all cursor-pointer"
                          >
                            Estornar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Footer notes */}
            {selectedClient.notes && (
              <div className="mt-4 p-3 bg-input-theme rounded-xl border border-theme flex-shrink-0 text-left">
                <span className="text-[10px] text-muted-theme font-bold uppercase block mb-1">Notas Internas</span>
                <p className="text-[11px] text-secondary-theme leading-normal">{selectedClient.notes}</p>
              </div>
            )}

            {/* PDF Documents and Archive Panel */}
            <div className="mt-4 p-4 bg-card-theme rounded-2xl border border-theme space-y-3 flex-shrink-0 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-theme/40">
                <h4 className="text-xs font-black text-primary-theme uppercase tracking-wider flex items-center gap-1.5">
                  📁 Documentos e Arquivo PDF
                </h4>
                <label className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-bold text-[10px] cursor-pointer transition-all">
                  + Anexar PDF
                  <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
                </label>
              </div>

              {loadingDocs ? (
                <p className="text-[11px] text-muted-theme text-center py-2">Carregando documentos...</p>
              ) : clientDocs.length === 0 ? (
                <p className="text-[11px] text-muted-theme text-center py-2">Nenhum documento anexado ao perfil.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {clientDocs.map(doc => (
                    <div key={doc.id} className="p-2 rounded-xl bg-input-theme border border-theme/60 flex items-center justify-between gap-3 text-[11px]">
                      <div className="min-w-0 flex items-center gap-2">
                        <svg className="w-4 h-4 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                        <div className="min-w-0">
                          <p className="font-bold text-primary-theme truncate" title={doc.file_name}>{doc.name}</p>
                          <p className="text-[9px] text-muted-theme">{(doc.file_size / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button 
                          onClick={() => handlePdfDownload(doc.id, doc.file_name)}
                          className="p-1 text-emerald-400 hover:text-emerald-300 font-bold transition-all text-[10px]"
                          title="Baixar PDF"
                        >
                          Baixar
                        </button>
                        <button 
                          onClick={() => handlePdfDelete(doc.id)}
                          className="p-1 text-rose-400 hover:text-rose-300 font-bold transition-all text-[10px]"
                          title="Excluir PDF"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Minimalist Rebate Modal Form */}
      {showRebateModal && rebateCharge && (
        <div 
          className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => {
            setShowRebateModal(false);
            setRebateCharge(null);
          }}
        >
          <div onClick={e => e.stopPropagation()} className="bg-modal-theme border border-theme rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-bold text-primary-theme mb-1">Abatimento de Fatura</h3>
            <p className="text-xs text-secondary-theme mb-4 leading-relaxed">
              Deduza uma quantia paga avulso da cobrança <strong className="text-primary-theme">{rebateCharge.description}</strong>.
            </p>
            <form onSubmit={handleRebateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-secondary-theme font-semibold mb-1.5">Valor do Abatimento (R$) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  max={rebateCharge.amount}
                  value={rebateAmount}
                  onChange={e => setRebateAmount(e.target.value)}
                  placeholder="Ex: 50.00"
                  className="w-full py-2 px-3 text-sm bg-input-theme border border-theme text-primary-theme rounded-lg outline-none focus:border-emerald-500 transition-colors"
                  required
                />
                <span className="block text-[10px] text-muted-theme mt-1">
                  Saldo pendente na fatura: {fmt(rebateCharge.amount)}
                </span>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowRebateModal(false);
                    setRebateCharge(null);
                  }} 
                  className="px-4 py-2 rounded-lg bg-surface-theme border border-theme text-secondary-theme text-xs font-semibold hover:bg-card-hover-theme hover:text-primary-theme transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {rebateMsg && (
        <div className="fixed top-20 right-6 bg-emerald-500 text-slate-950 px-5 py-3 rounded-xl text-xs font-bold z-50 shadow-lg shadow-emerald-500/20">
          {rebateMsg}
        </div>
      )}

      {/* Minimalist Copilot AI Drawer/Modal */}
      {showCopilotModal && (
        <div 
          className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm z-[50] flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => {
            if (!copilotLoading) {
              setShowCopilotModal(false);
              setCopilotResponse(null);
            }
          }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-modal-theme rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md border-t md:border border-theme shadow-2xl flex flex-col max-h-[95vh] md:max-h-[85vh] overflow-hidden animate-fadeInUp"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-theme pb-4 mb-4 flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-xl shadow shadow-emerald-500/10">
                <svg className="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l3.582-1.79A8.96 8.96 0 119.813 15.904z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary-theme">Catarina AI Copilot</h3>
                <p className="text-[10px] text-secondary-theme">Comandos rápidos em linguagem natural</p>
              </div>
            </div>

            {/* Scrollable Container to prevent squeezing */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 my-2 scrollbar-none flex-shrink flex-grow min-h-0 text-left">
              
              {/* Loading state */}
              {copilotLoading && (
                <div className="py-8 text-center flex flex-col items-center justify-center flex-shrink-0">
                  <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4 flex-shrink-0"></div>
                  <p className="text-primary-theme text-xs font-semibold">Catarina está processando seu comando...</p>
                  <p className="text-muted-theme text-[10px] mt-1">Validando intenções e estruturando dados...</p>
                </div>
              )}

              {/* Error state */}
              {copilotError && !copilotLoading && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-4 text-left flex-shrink-0">
                  <p className="text-rose-400 text-xs font-medium">Erro: {copilotError}</p>
                </div>
              )}

              {/* Success state */}
              {copilotSuccessMsg && !copilotLoading && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 text-center flex-shrink-0">
                  <p className="text-emerald-500 text-xs font-bold">{copilotSuccessMsg}</p>
                </div>
              )}

              {/* Initial input for mobile or quick typing */}
              {!copilotResponse && !copilotLoading && !copilotSuccessMsg && (
                <div className="space-y-4 pt-2 flex-shrink-0">
                  <div className="relative">
                    <input
                      autoFocus
                      placeholder="Ex: Cobre R$ 150 de Carlos Eduardo amanhã..."
                      value={copilotInput}
                      onChange={e => {
                        setCopilotInput(e.target.value);
                        setSearchTerm(e.target.value);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleCopilotSubmit(copilotInput);
                        }
                      }}
                      className="w-full py-3 pl-4 pr-12 text-xs bg-input-theme border border-theme text-primary-theme placeholder-muted-theme rounded-xl outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      onClick={() => handleCopilotSubmit(copilotInput)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xs transition-all cursor-pointer"
                    >
                      ➔
                    </button>
                  </div>

                  {/* Voice / Text Suggestions */}
                  <div>
                    <span className="text-[9px] text-muted-theme font-bold uppercase tracking-wider block mb-2">Comandos Sugeridos</span>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        'Cobre R$ 150 de Carlos Eduardo amanhã',
                        'Configurar recorrente de R$ 90 para Carlos Eduardo',
                        'Ver relatórios de faturamento',
                        'Como está a adimplência hoje?'
                      ].map((suggestion, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setCopilotInput(suggestion);
                            handleCopilotSubmit(suggestion);
                          }}
                          className="px-3 py-2 rounded-xl bg-card-theme border border-theme hover:bg-surface-theme hover:text-emerald-500 text-[10px] text-secondary-theme font-semibold text-left transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l3.582-1.79A8.96 8.96 0 119.813 15.904z" />
                          </svg>
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowCopilotModal(false)}
                    className="w-full py-3 bg-card-theme border border-theme text-secondary-theme rounded-xl text-xs font-bold hover:bg-card-hover-theme transition-all mt-4 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* Content Form when structured response received */}
              {copilotResponse && !copilotLoading && !copilotSuccessMsg && (
                <div className="space-y-4 flex-shrink-0">
                  <p className="text-secondary-theme text-xs leading-relaxed bg-surface-theme p-3 rounded-lg border border-theme">
                    {formatMessageText(copilotResponse.responseMessage)}
                  </p>

                  {(copilotResponse.intent === 'create_charge' || copilotResponse.intent === 'create_daily_billing') ? (
                    <div className="space-y-3">
                      
                      {/* Client Selection */}
                      <div className="flex-shrink-0">
                        <label className="block text-[10px] text-muted-theme font-bold uppercase mb-1">Cliente Associado</label>
                        <select
                          value={copilotResponse.client_id || ''}
                          onChange={e => setCopilotResponse(prev => ({ ...prev, client_id: e.target.value }))}
                          className="w-full py-2 px-3 text-xs bg-input-theme border border-theme text-primary-theme rounded-lg outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="">-- Selecione o Cliente --</option>
                          {allClients.map(cl => (
                            <option key={cl.id} value={cl.id}>{cl.name}</option>
                          ))}
                        </select>
                        {!copilotResponse.client_id && (
                          <span className="text-[10px] text-amber-500 block mt-1">
                            Aviso: Não consegui mapear o cliente. Selecione na lista!
                          </span>
                        )}
                      </div>

                      {/* Amount & Due Date */}
                      <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                        <div>
                          <label className="block text-[10px] text-muted-theme font-bold uppercase mb-1">Valor (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={copilotResponse.amount || ''}
                            onChange={e => setCopilotResponse(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            className="w-full py-2 px-3 text-xs bg-input-theme border border-theme text-primary-theme rounded-lg outline-none focus:border-emerald-500"
                          />
                        </div>

                        {/* Due Date (for single charge) */}
                        {copilotResponse.intent === 'create_charge' && (
                          <div>
                            <label className="block text-[10px] text-muted-theme font-bold uppercase mb-1">Vencimento</label>
                            <input
                              type="date"
                              value={copilotResponse.due_date || ''}
                              onChange={e => setCopilotResponse(prev => ({ ...prev, due_date: e.target.value }))}
                              className="w-full py-2 px-3 text-xs bg-input-theme border border-theme text-primary-theme rounded-lg outline-none focus:border-emerald-500"
                            />
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div className="flex-shrink-0">
                        <label className="block text-[10px] text-muted-theme font-bold uppercase mb-1">Descrição</label>
                        <input
                          type="text"
                          value={copilotResponse.description || ''}
                          onChange={e => setCopilotResponse(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full py-2 px-3 text-xs bg-input-theme border border-theme text-primary-theme rounded-lg outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-theme text-xs flex-shrink-0">
                      Nenhuma ação de banco de dados pendente para esta intenção.
                    </div>
                  )}

                  {/* Footer Buttons */}
                  <div className="flex gap-3 justify-end pt-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setCopilotResponse(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-card-theme border border-theme text-secondary-theme text-xs font-semibold hover:bg-surface-theme cursor-pointer"
                    >
                      Voltar
                    </button>
                    
                    {(copilotResponse.intent === 'create_charge' || copilotResponse.intent === 'create_daily_billing') && (
                      <button
                        onClick={executeCopilotAction}
                        className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer"
                      >
                        Confirmar e Lançar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating support chatbot */}
      <Chatbot isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />
    </div>
  );
}
