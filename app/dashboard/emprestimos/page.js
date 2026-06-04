'use client';
import { useState, useEffect } from 'react';

export default function EmprestimosPage() {
  const [loans, setLoans] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // WhatsApp Connection & Profile State
  const [user, setUser] = useState(null);
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappQrCode, setWhatsappQrCode] = useState('');
  const [waError, setWaError] = useState('');
  const [showWaPairModal, setShowWaPairModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    amount: '',
    dueDate: '',
    interestRate: '0.1', // Default 0.1% a day juros
    loan_info: 'Contrato de Empréstimo Pessoal'
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchEmprestimos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cobrancas?limit=100');
      const data = await res.json();
      
      // Filter charges that are loans (have loan_info)
      const loanCharges = (data.charges || []).filter(c => c.loan_info !== null && c.loan_info !== '');
      
      setLoans(loanCharges);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clientes?limit=200');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (e) {}
  };

  // WhatsApp connection check
  const fetchWaStatus = async () => {
    try {
      const r = await fetch('/api/whatsapp/connect');
      const data = await r.json();
      if (data.status) {
        setWhatsappStatus(data.status);
        setWhatsappPhone(data.phone || '');
        if (data.qrCode) setWhatsappQrCode(data.qrCode);
        if (data.error) setWaError(data.error);
      }
    } catch (e) {}
  };

  const fetchUser = async () => {
    try {
      const r = await fetch('/api/auth/me');
      const data = await r.json();
      if (data.user) setUser(data.user);
    } catch (e) {}
  };

  useEffect(() => {
    fetchEmprestimos();
    fetchClients();
    fetchUser();
    fetchWaStatus();
  }, []);

  // WhatsApp scanning status polling
  useEffect(() => {
    let interval;
    if (whatsappStatus === 'scanning' && showWaPairModal) {
      interval = setInterval(() => {
        fetch('/api/whatsapp/connect')
          .then(r => r.json())
          .then(data => {
            if (data.status === 'connected') {
              setWhatsappStatus('connected');
              setWhatsappPhone(data.phone || '');
              clearInterval(interval);
              showNotification('WhatsApp conectado com sucesso! 📱');
              setShowWaPairModal(false);
            } else if (data.status === 'scanning') {
              if (data.qrCode) setWhatsappQrCode(data.qrCode);
              if (data.error) setWaError(data.error);
            } else if (data.status === 'disconnected') {
              setWhatsappStatus('disconnected');
              setWhatsappQrCode('');
              setWaError('');
              clearInterval(interval);
            }
          })
          .catch(() => {});
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [whatsappStatus, showWaPairModal]);

  const showNotification = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 4000);
  };

  // Simplified / Z-API start pair
  const handleStartWaConnection = async () => {
    setWhatsappStatus('connecting');
    setWaError('');
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      const data = await res.json();
      if (data.qrCode) {
        setWhatsappQrCode(data.qrCode);
        setWhatsappStatus('scanning');
      } else if (data.status === 'connected') {
        setWhatsappStatus('connected');
        setWhatsappPhone(data.phone || '');
        showNotification('WhatsApp já está conectado! 📱');
        setShowWaPairModal(false);
      } else {
        setWhatsappStatus('scanning');
      }
      if (data.error) setWaError(data.error);
    } catch (e) {
      setWhatsappStatus('disconnected');
      alert('Erro de conexão com o disparador central.');
    }
  };



  const handleRegisterLoan = async (e) => {
    e.preventDefault();
    if (!form.clientName || !form.amount || !form.dueDate) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create client first or find existing
      let clientId = '';
      const existingClient = clients.find(c => c.name.toLowerCase() === form.clientName.toLowerCase());

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const clientRes = await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.clientName,
            email: form.clientEmail || `${form.clientName.toLowerCase().replace(/\s+/g, '')}@emprestimo.com.br`,
            phone: form.clientPhone || '(11) 99999-9999',
            category: 'Mutualista',
            notes: `Contrato de crédito: ${form.loan_info}`
          })
        });
        const clientData = await clientRes.json();
        if (!clientRes.ok) throw new Error(clientData.error || 'Erro ao criar tomador de crédito');
        clientId = clientData.client.id;
      }

      // 2. Create Charge with loan_info
      const chargeRes = await fetch('/api/cobrancas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          amount: parseFloat(form.amount),
          due_date: form.dueDate,
          description: form.loan_info,
          recurrence: 'once',
          reminder_channel: 'both',
          payment_method: 'pix',
          daily_interest_rate: parseFloat(form.interestRate),
          loan_info: form.loan_info
        })
      });
      const chargeData = await chargeRes.json();
      if (!chargeRes.ok) throw new Error(chargeData.error || 'Erro ao lançar crédito');

      showNotification('💸 Carteira de Empréstimos atualizada e cobrança Pix gerada!');
      setShowModal(false);
      setForm({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        amount: '',
        dueDate: '',
        interestRate: '0.1',
        loan_info: 'Contrato de Empréstimo Pessoal'
      });
      fetchEmprestimos();
      fetchClients();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calcInterest = (l) => {
    if (l.status !== 'overdue') return 0;
    const due = new Date(l.due_date);
    const today = new Date();
    if (due >= today) return 0;
    const diffMs = today - due;
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const rate = l.daily_interest_rate || 0.1;
    return l.amount * (rate / 100) * days;
  };

  const getPayerRisk = (l) => {
    if (l.status === 'paid') return { l: 'Quitado ✅', c: '#10b981', bg: 'rgba(16,185,129,0.08)' };
    if (l.status === 'pending') return { l: 'Risco Baixo 👍', c: '#3b82f6', bg: 'rgba(59,130,246,0.08)' };
    const due = new Date(l.due_date);
    const today = new Date();
    const diffMs = today - due;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (days <= 5) return { l: 'Atraso Leve 🟡', c: '#f59e0b', bg: 'rgba(245,158,11,0.08)' };
    return { l: 'Risco Crítico ⚡⚠️', c: '#ef4444', bg: 'rgba(239,68,68,0.08)' };
  };

  const triggerAlert = async (l) => {
    try {
      showNotification(`📱 Enviando notificação de cobrança rígida para ${l.client_name}...`);
      
      const interest = calcInterest(l);
      const totalAmount = l.amount + interest;
      
      const customMessage = l.status === 'overdue'
        ? `ATENÇÃO ${l.client_name} ⚡: Seu contrato *${l.loan_info}* no valor de R$ ${Number(l.amount).toFixed(2)} está vencido desde ${new Date(l.due_date).toLocaleDateString('pt-BR')}. Com juros acumulados de R$ ${Number(interest).toFixed(2)}, o montante atualizado é R$ ${Number(totalAmount).toFixed(2)}. Regularize já pelo Pix copia e cola no link: {link}`
        : `Olá ${l.client_name}. Lembramos que sua parcela de R$ ${Number(l.amount).toFixed(2)} vence dia ${new Date(l.due_date).toLocaleDateString('pt-BR')}. Segue o Pix copia e cola para pagamento: {link}`;

      // Check if it's a demo card
      if (l.id.startsWith('loan-demo')) {
        setTimeout(() => {
          showNotification(`✅ [DEMO] Lembrete de crédito enviado para ${l.client_name}!`);
        }, 1500);
        return;
      }

      // Actual dispatch
      const res = await fetch('/api/lembretes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charge_id: l.id, // Fixed snake_case payload
          channel: 'whatsapp',
          message: customMessage
        })
      });
      
      if (res.ok) {
        showNotification(`✅ Lembrete de crédito disparado no WhatsApp!`);
      } else {
        const err = await res.json();
        showNotification(`⚠️ Falha ao disparar lembrete: ${err.error}`);
      }
    } catch (e) {
      showNotification(`⚠️ Erro ao comunicar com Evolution API.`);
    }
  };

  // Stats
  const totalLent = loans.reduce((acc, curr) => acc + (curr.status !== 'cancelled' ? curr.amount : 0), 0);
  const totalAccruedInterest = loans.reduce((acc, curr) => acc + calcInterest(curr), 0);
  const totalOverdue = loans.reduce((acc, curr) => acc + (curr.status === 'overdue' ? curr.amount : 0), 0);

  const cardStyle = {
    background: 'var(--bg-surface)',
    borderRadius: 20,
    border: '1px solid var(--border-color)',
    padding: isMobile ? '14px' : '20px'
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Toast */}
      {msg && (
        <div style={{ 
          position: 'fixed', 
          top: 80, 
          right: 32, 
          background: '#10b981', 
          color: 'var(--text-primary)', 
          padding: '12px 24px', 
          borderRadius: 12, 
          fontSize: 13.5, 
          fontWeight: 700, 
          zIndex: 1001, 
          boxShadow: '0 4px 14px rgba(16,185,129,0.3)' 
        }}>
          {msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 0, justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>💰 Gestão de Crédito & Empréstimos</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>Controle carteiras alocadas, calcule acúmulo diário de juros e mitigue risco de inadimplência.</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          style={{
            width: isMobile ? '100%' : 'auto',
            padding: '12px 18px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
          }}
        >
          ➕ Lançar Empréstimo
        </button>
      </div>

      {/* WhatsApp Connection Induction Card */}
      {whatsappStatus !== 'connected' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 20,
          padding: '20px',
          marginBottom: 24,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.05)',
          animation: 'fadeInUp 0.5s ease'
        }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 32, filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))' }}>📱</span>
            <div>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#10b981', letterSpacing: '-0.2px' }}>
                Conecte seu próprio WhatsApp comercial!
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#a7f3d0', lineHeight: 1.45 }}>
                Evite que seus mutuários recebam cobranças de um número genérico do sistema. Conectando seu aparelho, os lembretes saem com <strong>sua foto e seu nome</strong> e as respostas vão direto para você!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowWaPairModal(true);
              handleStartWaConnection();
            }}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: '#070913',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
              transition: 'transform 0.2s'
            }}
          >
            🔗 Conectar WhatsApp Próprio
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: '12px 16px', borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Capital Emprestado</span>
          <h3 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', margin: '2px 0 0 0' }}>R$ {totalLent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div style={{ ...cardStyle, padding: '12px 16px', borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Inadimplência Riscada</span>
          <h3 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', margin: '2px 0 0 0' }}>R$ {totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div style={{ ...cardStyle, padding: '12px 16px', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Juros Diários Acumulados</span>
          <h3 style={{ fontSize: 24, fontWeight: 900, color: '#10b981', margin: '2px 0 0 0' }}>R$ {totalAccruedInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      {/* Credit Portfolio table */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', marginBottom: 16 }}>Carteira de Mutuários</h3>
        
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {loans.map((l, idx) => {
              const interest = calcInterest(l);
              const risk = getPayerRisk(l);
              return (
                <div 
                  key={l.id || idx} 
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 16,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >
                  {/* Card Header: Loan + Risk */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{l.loan_info}</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: 11, color: 'var(--text-muted)' }}>Vencimento: {new Date(l.due_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 20, color: risk.c, background: risk.bg, fontWeight: 700 }}>
                      {risk.l}
                    </span>
                  </div>

                  {/* Card Details: Borrower, Nominal, Interest */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '10px 0' }}>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>MUTUÁRIO</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{l.client_name}</p>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l.client_phone}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>CRÉDITO</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>R$ {Number(l.amount).toFixed(2)}</p>
                      <p style={{ margin: '1px 0 0 0', fontSize: 10, color: interest > 0 ? '#ef4444' : '#64748b', fontWeight: 600 }}>
                        Juros: {interest > 0 ? `+R$ ${interest.toFixed(2)}` : 'R$ 0,00'}
                      </p>
                      <span style={{ fontSize: 9, color: '#a7f3d0' }}>({l.daily_interest_rate || 0.1}% / dia)</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div style={{ display: 'flex' }}>
                    <button 
                      onClick={() => triggerAlert(l)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        color: '#10b981',
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ Notificar WhatsApp
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ padding: '12px 10px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>📋 Contrato / Detalhes</th>
                  <th style={{ padding: '12px 10px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>👥 Mutuário</th>
                  <th style={{ padding: '12px 10px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>💰 Valor Nominal</th>
                  <th style={{ padding: '12px 10px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>⚡ Juros Diários</th>
                  <th style={{ padding: '12px 10px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>📈 Juros Acumulados</th>
                  <th style={{ padding: '12px 10px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>🏷️ Nível de Risco</th>
                  <th style={{ padding: '12px 10px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((l, idx) => {
                  const interest = calcInterest(l);
                  const risk = getPayerRisk(l);
                  return (
                    <tr key={l.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '16px 10px', fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{l.loan_info}</td>
                      <td style={{ padding: '16px 10px', fontSize: 13.5, color: 'var(--text-secondary)' }}>
                        <p style={{ margin: 0, fontWeight: 600 }}>{l.client_name}</p>
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{l.client_phone}</span>
                      </td>
                      <td style={{ padding: '16px 10px', fontSize: 13.5, color: 'var(--text-secondary)', fontWeight: 700 }}>
                        R$ {Number(l.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '16px 10px', fontSize: 13.5, color: 'var(--text-secondary)' }}>
                        {l.daily_interest_rate || 0.1}% / dia
                      </td>
                      <td style={{ padding: '16px 10px', fontSize: 13.5, color: interest > 0 ? '#ef4444' : '#64748b', fontWeight: 700 }}>
                        {interest > 0 ? `R$ ${interest.toFixed(2)}` : 'R$ 0,00'}
                      </td>
                      <td style={{ padding: '16px 10px' }}>
                        <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, color: risk.c, background: risk.bg, fontWeight: 700 }}>
                          {risk.l}
                        </span>
                      </td>
                      <td style={{ padding: '16px 10px', textAlign: 'right' }}>
                        <button 
                          onClick={() => triggerAlert(l)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(16,185,129,0.08)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            color: '#10b981',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          ⚡ Notificar WhatsApp
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Loan Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(12, 14, 26, 0.96)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <div style={{
            width: '100%',
            maxWidth: 500,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#ffffff' }}>💸 Lançar Crédito / Empréstimo</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterLoan} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Nome do Mutuário</label>
                <input 
                  type="text" 
                  value={form.clientName} 
                  onChange={e => setForm({...form, clientName: e.target.value})} 
                  placeholder="Nome completo do cliente" 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>WhatsApp Mutuário</label>
                  <input 
                    type="tel" 
                    value={form.clientPhone} 
                    onChange={e => setForm({...form, clientPhone: e.target.value})} 
                    placeholder="(11) 99999-9999" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>E-mail (opcional)</label>
                  <input 
                    type="email" 
                    value={form.clientEmail} 
                    onChange={e => setForm({...form, clientEmail: e.target.value})} 
                    placeholder="email@cliente.com" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Descrição do Contrato / Finalidade</label>
                <input 
                  type="text" 
                  value={form.loan_info} 
                  onChange={e => setForm({...form, loan_info: e.target.value})} 
                  placeholder="Ex: Empréstimo Pessoal - Parcela 1/3" 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Valor Emprestado (R$)</label>
                  <input 
                    type="number" 
                    value={form.amount} 
                    onChange={e => setForm({...form, amount: e.target.value})} 
                    placeholder="Ex: 5000.00" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Taxa Juros Diários (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={form.interestRate} 
                    onChange={e => setForm({...form, interestRate: e.target.value})} 
                    placeholder="Ex: 0.1 (0.1% ao dia)" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                    required 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Data Limite de Vencimento</label>
                <input 
                  type="date" 
                  value={form.dueDate} 
                  onChange={e => setForm({...form, dueDate: e.target.value})} 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none' }}
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Registrar Empréstimo 💸
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Pairing Modal */}
      {showWaPairModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(12, 14, 26, 0.98)',
          zIndex: 1010,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <div style={{
            width: '100%',
            maxWidth: 480,
            background: 'var(--bg-surface)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 20px 40px rgba(0,0,0,0.9), 0 0 30px rgba(16,185,129,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: '#ffffff', margin: 0 }}>
                📱 Conectar Seu WhatsApp
              </h3>
              <button 
                onClick={() => setShowWaPairModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', marginLeft: 'auto' }}
              >
                ✕
              </button>
            </div>

            {whatsappStatus === 'connecting' && (
              <div style={{ padding: '30px 0', textAlign: 'center' }}>
                <div style={{ border: '3.5px solid rgba(16,185,129,0.1)', borderTop: '3.5px solid #10b981', borderRadius: '50%', width: 44, height: 44, margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>Gerando Sessão de WhatsApp...</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Conectando com o servidor de mensagens. Aguarde alguns instantes.</p>
              </div>
            )}

            {whatsappStatus === 'scanning' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ textAlign: 'left', background: 'var(--bg-input)', borderRadius: 16, padding: 18, border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: '#10b981', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>Como parear:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ background: '#10b981', color: '#070913', width: 18, height: 18, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>1</span>
                      <span>Abra o <strong>WhatsApp</strong> no seu celular.</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ background: '#10b981', color: '#070913', width: 18, height: 18, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>2</span>
                      <span>Acesse <strong>Aparelhos Conectados</strong> e clique em <strong>Conectar um Aparelho</strong>.</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ background: '#10b981', color: '#070913', width: 18, height: 18, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>3</span>
                      <span>Aponte a câmera para o QR Code abaixo:</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                  <div style={{ background: '#fff', padding: 14, borderRadius: 16, border: '4px solid #10b981', display: 'inline-block' }}>
                    {whatsappQrCode ? (
                      <img src={whatsappQrCode} alt="WhatsApp QR Code" style={{ width: 200, height: 200, display: 'block' }} />
                    ) : waError ? (
                      <div style={{ width: 200, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', borderRadius: 12, padding: 12 }}>
                        <span style={{ fontSize: 24, marginBottom: 8 }}>⚠️</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textAlign: 'center', lineHeight: '1.4' }}>{waError}</span>
                      </div>
                    ) : (
                      <div style={{ width: 200, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 12 }}>
                        <div style={{ border: '3px solid rgba(16,185,129,0.1)', borderTop: '3px solid #10b981', borderRadius: '50%', width: 32, height: 32, marginBottom: 12, animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>Obtendo QR Code...</span>
                      </div>
                    )}
                  </div>
                </div>


              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
