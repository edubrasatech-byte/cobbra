'use client';
import { useState, useEffect } from 'react';

export default function EmprestimosPage() {
  const [loans, setLoans] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
      
      if (loanCharges.length > 0) {
        setLoans(loanCharges);
      } else {
        // Fallbacks/Demo data to show immediately to prospective loan managers!
        setLoans([
          {
            id: 'loan-demo-001',
            client_name: 'Roberto Camargo',
            client_phone: '(11) 98888-3333',
            amount: 5000.00,
            due_date: new Date(Date.now() - 432000000).toISOString().split('T')[0], // 5 days ago
            daily_interest_rate: 0.2, // 0.2% a day
            loan_info: 'Empréstimo Pessoal - Parcela 1/3',
            status: 'overdue',
            recurrence: 'once'
          },
          {
            id: 'loan-demo-002',
            client_name: 'Karina Mendes',
            client_phone: '(11) 91111-2222',
            amount: 2500.00,
            due_date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // in 2 days
            daily_interest_rate: 0.15,
            loan_info: 'Microcrédito Comercial - Parcela Única',
            status: 'pending',
            recurrence: 'once'
          },
          {
            id: 'loan-demo-003',
            client_name: 'Juliana Portes',
            client_phone: '(11) 97777-5555',
            amount: 1500.00,
            due_date: new Date(Date.now() - 864000000).toISOString().split('T')[0],
            daily_interest_rate: 0.1,
            loan_info: 'Financiamento Equipamento - Parcela 2/6',
            status: 'paid',
            recurrence: 'monthly'
          }
        ]);
      }
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

  useEffect(() => {
    fetchEmprestimos();
    fetchClients();
  }, []);

  const showNotification = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 4000);
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
          chargeId: l.id,
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
    background: '#0C0E1A',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.04)',
    padding: '20px'
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
          color: '#fff', 
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
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Controle carteiras alocadas, calcule acúmulo diário de juros e mitigue risco de inadimplência.</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          style={{
            width: isMobile ? '100%' : 'auto',
            padding: '12px 18px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
          }}
        >
          ➕ Lançar Empréstimo
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: '12px 16px', borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Capital Emprestado</span>
          <h3 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', margin: '2px 0 0 0' }}>R$ {totalLent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div style={{ ...cardStyle, padding: '12px 16px', borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Inadimplência Riscada</span>
          <h3 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', margin: '2px 0 0 0' }}>R$ {totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
        <div style={{ ...cardStyle, padding: '12px 16px', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Juros Diários Acumulados</span>
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
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>{l.loan_info}</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#64748b' }}>Vencimento: {new Date(l.due_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 20, color: risk.c, background: risk.bg, fontWeight: 700 }}>
                      {risk.l}
                    </span>
                  </div>

                  {/* Card Details: Borrower, Nominal, Interest */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '10px 0' }}>
                    <div>
                      <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>MUTUÁRIO</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: 12.5, fontWeight: 600, color: '#cbd5e1' }}>{l.client_name}</p>
                      <span style={{ fontSize: 10, color: '#64748b' }}>{l.client_phone}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>CRÉDITO</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: 12.5, fontWeight: 700, color: '#f1f5f9' }}>R$ {Number(l.amount).toFixed(2)}</p>
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
                  <th style={{ padding: '12px 10px', fontSize: 12, color: '#64748b', fontWeight: 700 }}>📋 Contrato / Detalhes</th>
                  <th style={{ padding: '12px 10px', fontSize: 12, color: '#64748b', fontWeight: 700 }}>👥 Mutuário</th>
                  <th style={{ padding: '12px 10px', fontSize: 12, color: '#64748b', fontWeight: 700 }}>💰 Valor Nominal</th>
                  <th style={{ padding: '12px 10px', fontSize: 12, color: '#64748b', fontWeight: 700 }}>⚡ Juros Diários</th>
                  <th style={{ padding: '12px 10px', fontSize: 12, color: '#64748b', fontWeight: 700 }}>📈 Juros Acumulados</th>
                  <th style={{ padding: '12px 10px', fontSize: 12, color: '#64748b', fontWeight: 700 }}>🏷️ Nível de Risco</th>
                  <th style={{ padding: '12px 10px', fontSize: 12, color: '#64748b', fontWeight: 700, textAlign: 'right' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((l, idx) => {
                  const interest = calcInterest(l);
                  const risk = getPayerRisk(l);
                  return (
                    <tr key={l.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '16px 10px', fontSize: 13.5, fontWeight: 700, color: '#f1f5f9' }}>{l.loan_info}</td>
                      <td style={{ padding: '16px 10px', fontSize: 13.5, color: '#cbd5e1' }}>
                        <p style={{ margin: 0, fontWeight: 600 }}>{l.client_name}</p>
                        <span style={{ fontSize: 10.5, color: '#64748b' }}>{l.client_phone}</span>
                      </td>
                      <td style={{ padding: '16px 10px', fontSize: 13.5, color: '#cbd5e1', fontWeight: 700 }}>
                        R$ {Number(l.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '16px 10px', fontSize: 13.5, color: '#cbd5e1' }}>
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
            background: '#0C0E1A',
            border: '1px solid rgba(255,255,255,0.06)',
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
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterLoan} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Nome do Mutuário</label>
                <input 
                  type="text" 
                  value={form.clientName} 
                  onChange={e => setForm({...form, clientName: e.target.value})} 
                  placeholder="Nome completo do cliente" 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>WhatsApp Mutuário</label>
                  <input 
                    type="tel" 
                    value={form.clientPhone} 
                    onChange={e => setForm({...form, clientPhone: e.target.value})} 
                    placeholder="(11) 99999-9999" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>E-mail (opcional)</label>
                  <input 
                    type="email" 
                    value={form.clientEmail} 
                    onChange={e => setForm({...form, clientEmail: e.target.value})} 
                    placeholder="email@cliente.com" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Descrição do Contrato / Finalidade</label>
                <input 
                  type="text" 
                  value={form.loan_info} 
                  onChange={e => setForm({...form, loan_info: e.target.value})} 
                  placeholder="Ex: Empréstimo Pessoal - Parcela 1/3" 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Valor Emprestado (R$)</label>
                  <input 
                    type="number" 
                    value={form.amount} 
                    onChange={e => setForm({...form, amount: e.target.value})} 
                    placeholder="Ex: 5000.00" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Taxa Juros Diários (%)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={form.interestRate} 
                    onChange={e => setForm({...form, interestRate: e.target.value})} 
                    placeholder="Ex: 0.1 (0.1% ao dia)" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }}
                    required 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>Data Limite de Vencimento</label>
                <input 
                  type="date" 
                  value={form.dueDate} 
                  onChange={e => setForm({...form, dueDate: e.target.value})} 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' }}
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Registrar Empréstimo 💸
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
