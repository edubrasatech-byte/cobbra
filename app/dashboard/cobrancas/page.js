'use client';
import { useState, useEffect } from 'react';

const STATUS = { 
  pending: { l: 'Pendente', c: '#f59e0b', b: 'rgba(245,158,11,0.15)' }, 
  reminder_sent: { l: 'Lembrete Enviado', c: '#3b82f6', b: 'rgba(59,130,246,0.15)' }, 
  paid: { l: 'Pago', c: '#10b981', b: 'rgba(16,185,129,0.15)' }, 
  overdue: { l: 'Vencido', c: '#ef4444', b: 'rgba(239,68,68,0.15)' }, 
  cancelled: { l: 'Cancelado', c: '#6b7280', b: 'rgba(107,114,128,0.15)' } 
};

export default function CobrancasPage() {
  const [charges, setCharges] = useState([]);
  const [clients, setClients] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    client_id: '', 
    amount: '', 
    description: '', 
    due_date: '', 
    recurrence: 'once', 
    reminder_channel: 'both', 
    payment_method: 'pix', 
    daily_interest_rate: '0' 
  });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success'); // 'success' | 'error' | 'loading' | 'info'
  const [cobrancaHumor, setCobrancaHumor] = useState('gentil');
  const [cobrancaAiLoading, setCobrancaAiLoading] = useState(false);

  const triggerToast = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    if (type !== 'loading') {
      setTimeout(() => {
        setMsg('');
      }, 4000);
    }
  };

  // Rebate states
  const [showRebateModal, setShowRebateModal] = useState(false);
  const [rebateCharge, setRebateCharge] = useState(null);
  const [rebateAmount, setRebateAmount] = useState('');

  // User & Contract states
  const [user, setUser] = useState(null);
  const [selectedChargeForContract, setSelectedChargeForContract] = useState(null);

  function loadCharges() {
    setLoading(true);
    let url = '/api/cobrancas?limit=50';
    if (filter) url += `&status=${filter}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setCharges(d.charges || []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  function handleReload() {
    if (filter === '' && search === '') {
      loadCharges();
    } else {
      setFilter('');
      setSearch('');
    }
    triggerToast('Tabela de cobranças recarregada! 🔄', 'success');
  }

  useEffect(() => { 
    loadCharges(); 
    fetch('/api/clientes?limit=100').then(r=>r.json()).then(d=>setClients(d.clients||[])); 
    fetch('/api/auth/me').then(r=>r.json()).then(d=>{ 
      if (d.user) {
        setUser(d.user); 
        if (d.user.plan === 'starter') {
          setForm(prev => ({ ...prev, reminder_channel: 'email' }));
        }
      }
    });
  }, []);

  useEffect(() => { 
    loadCharges(); 
  }, [filter, search]);

  async function createCharge(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/cobrancas', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          ...form, 
          amount: parseFloat(form.amount), 
          daily_interest_rate: parseFloat(form.daily_interest_rate || '0') 
        }) 
      });
      if (res.ok) { 
        setShowModal(false); 
        setForm({ 
          client_id: '', 
          amount: '', 
          description: '', 
          due_date: '', 
          recurrence: 'once', 
          reminder_channel: 'both', 
          payment_method: 'pix', 
          daily_interest_rate: '0' 
        }); 
        loadCharges(); 
        triggerToast('Cobrança criada com sucesso! 🐍', 'success'); 
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao criar cobrança.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão ao criar cobrança.');
    }
  }

  async function handleRedigirComIA() {
    if (!form.client_id) {
      alert('Por favor, selecione um cliente primeiro.');
      return;
    }
    if (!form.amount) {
      alert('Por favor, insira o valor da cobrança.');
      return;
    }
    if (!form.due_date) {
      alert('Por favor, defina a data de vencimento.');
      return;
    }

    const client = clients.find(c => c.id === form.client_id);
    const clientName = client ? client.name : 'Cliente';
    const amountVal = parseFloat(form.amount).toFixed(2);
    const formattedDate = new Date(form.due_date + 'T12:00:00').toLocaleDateString('pt-BR');

    setCobrancaAiLoading(true);

    const promptText = `Olá Catarina, por favor redija uma mensagem curta e educada de lembrete de cobrança no tom '${cobrancaHumor}' para o cliente '${clientName}' no valor de R$ ${amountVal} com vencimento em ${formattedDate}. Não inclua nenhum cabeçalho, introdução ou bloco de código markdown. Retorne apenas o texto exato da mensagem pronto para ser enviado! 🐍`;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptText })
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setForm(prev => ({ ...prev, description: data.text.trim() }));
      } else {
        alert('Catarina está ocupada no momento. Tente novamente! 🐍');
      }
    } catch (e) {
      alert('Erro de conexão ao gerar texto de cobrança.');
    } finally {
      setCobrancaAiLoading(false);
    }
  }

  async function updateStatus(id, status) {
    await fetch(`/api/cobrancas/${id}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ status }) 
    });
    loadCharges(); 
    triggerToast('Status de pagamento atualizado! 💰', 'success');
  }

  async function deleteCharge(id) {
    if (!confirm('Excluir esta cobrança?')) return;
    await fetch(`/api/cobrancas/${id}`, { method: 'DELETE' });
    loadCharges(); 
    triggerToast('Cobrança excluída com sucesso! 🗑️', 'success');
  }

  async function sendManualReminder(c, channel) {
    if (channel === 'whatsapp' && user?.plan === 'starter') {
      triggerToast('O disparo via WhatsApp está disponível a partir do plano Crescimento. Faça upgrade para utilizar!', 'error');
      return;
    }
    
    if (channel === 'email' && !c.client_email) {
      triggerToast('Este cliente não possui e-mail cadastrado para receber lembretes.', 'error');
      return;
    }

    if (!user?.pix_key) {
      if (!confirm('Atenção: Você ainda não cadastrou sua Chave Pix nas Configurações do seu perfil! O lembrete será enviado, mas sem o QR Code e código Copia e Cola para pagamento imediato. Deseja enviar assim mesmo?')) {
        return;
      }
    }

    
    triggerToast(`Enviando cobrança avulsa via ${channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}... 🚀`, 'loading');
    
    // Construct default message using charge's description
    const message = c.description || `Olá! Passando para lembrar sobre seu pagamento de R$ ${c.amount.toFixed(2)} com vencimento em ${new Date(c.due_date).toLocaleDateString('pt-BR')}.`;
    
    try {
      const res = await fetch('/api/lembretes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charge_id: c.id,
          channel: channel,
          message: message
        })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast(`Sucesso: Cobrança enviada com sucesso via ${channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}! 🚀`, 'success');
        loadCharges();
      } else {
        triggerToast(`Falha no envio: ${data.error || 'Erro inesperado no servidor.'}`, 'error');
      }
    } catch (e) {
      triggerToast(`Erro de conexão: ${e.message || 'Sem sinal com o servidor.'}`, 'error');
    }
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
      loadCharges();
      triggerToast('Abatimento parcial registrado com sucesso! 💸', 'success');
    }
  }

  const handlePrintContract = () => {
    const printContent = document.getElementById('printable-contract-sheet').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Contrato - Cobbra</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            h2 { text-align: center; text-transform: uppercase; margin-bottom: 30px; font-size: 20px; font-weight: 800; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
            h3 { font-size: 14px; text-transform: uppercase; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
            p { font-size: 13px; text-align: justify; margin-bottom: 14px; }
            strong { color: #0f172a; }
            .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .sig-line { border-top: 1px solid #1e293b; text-align: center; padding-top: 8px; font-size: 12px; font-weight: 600; margin-top: 40px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent}
        </body>
      </html>
    `);
    printWindow.document.close();
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
  const inputS = { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: 14, outline: 'none', fontFamily: 'Inter,sans-serif' };
  const selectS = { ...inputS, appearance: 'auto' };

  return (
    <div>
      {msg && (() => {
        let bg = '#10b981'; 
        let border = 'rgba(16,185,129,0.2)';
        let shadow = 'rgba(16,185,129,0.3)';
        let icon = '✅';

        if (msgType === 'error') {
          bg = '#ef4444'; 
          border = 'rgba(239,68,68,0.2)';
          shadow = 'rgba(239,68,68,0.3)';
          icon = '❌';
        } else if (msgType === 'loading') {
          bg = '#3b82f6'; 
          border = 'rgba(59,130,246,0.2)';
          shadow = 'rgba(59,130,246,0.3)';
          icon = '🔄';
        } else if (msgType === 'info') {
          bg = '#1e293b'; 
          border = 'rgba(255,255,255,0.08)';
          shadow = 'rgba(0,0,0,0.4)';
          icon = '💡';
        }

        return (
          <div style={{
            position: 'fixed', top: 80, right: 32, background: bg, border: `1px solid ${border}`,
            color: '#fff', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            zIndex: 1001, boxShadow: `0 8px 24px ${shadow}`, display: 'flex', alignItems: 'center',
            gap: 10, animation: 'fadeInUp 0.3s ease-out', transition: 'all 0.3s'
          }}>
            {msgType === 'loading' ? (
              <div style={{
                border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff',
                borderRadius: '50%', width: 14, height: 14, animation: 'spin 1s linear infinite'
              }} />
            ) : <span>{icon}</span>}
            <span>{msg}</span>
          </div>
        );
      })()}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input placeholder="Buscar cobranças..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputS, width: 260 }} />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...selectS, width: 180, color: '#e2e8f0' }}>
            <option style={{ color: '#0f172a' }} value="">Todos os status</option>
            {Object.entries(STATUS).map(([k, v]) => <option style={{ color: '#0f172a' }} key={k} value={k}>{v.l}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button 
            onClick={handleReload}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '12px 18px', color: '#cbd5e1', cursor: 'pointer',
              fontFamily: 'Inter', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(5,150,105,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            🔄 Recarregar
          </button>
          <button onClick={() => setShowModal(true)} style={{
            padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', boxShadow: '0 4px 14px rgba(5,150,105,0.3)', fontFamily: 'Inter,sans-serif'
          }}>+ Nova Cobrança</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#1e293b', borderRadius: 16, overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', width: '100%' }}>
        <table style={{ width: '100%', minWidth: 920, borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Cliente', 'Descrição', 'Valor Original', 'Juros Acumulados', 'Vencimento', 'Status', 'Canal', 'Ações'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {charges.map(c => {
              const interest = calcInterest(c);
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px', color: '#e2e8f0', fontWeight: 600 }}>{c.client_name || 'N/A'}</td>
                  <td style={{ padding: '14px 16px', color: '#94a3b8', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</td>
                  <td style={{ padding: '14px 16px', color: '#e2e8f0', fontWeight: 700 }}>{fmt(c.amount)}</td>
                  <td style={{ padding: '14px 16px', color: interest > 0 ? '#f59e0b' : '#64748b', fontWeight: interest > 0 ? 600 : 400 }}>
                    {interest > 0 ? `${fmt(interest)} (+${c.daily_interest_rate}%/dia)` : c.daily_interest_rate > 0 ? `0,00 (${c.daily_interest_rate}%/dia)` : '-'}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{new Date(c.due_date).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: STATUS[c.status]?.b, color: STATUS[c.status]?.c, fontWeight: 600 }}>
                      {STATUS[c.status]?.l || c.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: 13 }}>
                    {c.reminder_channel === 'both' ? '📱+✉️' : c.reminder_channel === 'whatsapp' ? '📱' : '✉️'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {c.status !== 'paid' && c.status !== 'cancelled' && (
                        <>
                          <button onClick={() => updateStatus(c.id, 'paid')} style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'Inter' }}>✓ Pago</button>
                          <button 
                            onClick={() => {
                              setRebateCharge(c);
                              setShowRebateModal(true);
                            }} 
                            style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'Inter' }}
                          >
                            Abater
                          </button>
                          <button 
                            onClick={() => sendManualReminder(c, 'whatsapp')} 
                            style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(37,211,102,0.15)', color: '#25d366', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            📱 Whats
                          </button>
                          <button 
                            onClick={() => sendManualReminder(c, 'email')} 
                            style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            ✉️ Email
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => {
                          if (user?.plan === 'starter') {
                            alert('A emissão e impressão de contratos estão disponíveis exclusivamente nos planos Crescimento e Cobra Pro. Faça upgrade para ter acesso!');
                            return;
                          }
                          setSelectedChargeForContract(c);
                        }} 
                        style={{ 
                          padding: '4px 10px', borderRadius: 6, 
                          background: user?.plan === 'starter' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          color: user?.plan === 'starter' ? '#64748b' : '#cbd5e1', 
                          fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter' 
                        }}
                      >
                        {user?.plan === 'starter' ? '🔒 Contrato' : '📄 Contrato'}
                      </button>
                      <button onClick={() => deleteCharge(c.id)} style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'Inter' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {charges.length === 0 && (
              <tr><td colSpan="8" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                {loading ? 'Carregando...' : 'Nenhuma cobrança encontrada'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Rebate Modal Form */}
      {showRebateModal && rebateCharge && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, backdropFilter: 'blur(5px)' }}
          onClick={() => {
            setShowRebateModal(false);
            setRebateCharge(null);
          }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: 20, padding: 36, width: 420, border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Abater Parte da Cobrança</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
              Deduza uma quantia paga avulso da cobrança **{rebateCharge.description}**.
            </p>
            <form onSubmit={handleRebateSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>Valor do Abatimento (R$) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  max={rebateCharge.amount}
                  value={rebateAmount}
                  onChange={e => setRebateAmount(e.target.value)}
                  placeholder="Ex: 50.00"
                  style={inputS}
                  required
                />
                <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 6 }}>
                  Valor máximo disponível: {fmt(rebateCharge.amount)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => {
                  setShowRebateModal(false);
                  setRebateCharge(null);
                }} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, fontFamily: 'Inter' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: 10, background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Inter' }}>
                  Confirmar Abatimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: 20, padding: 36, width: 500, maxHeight: '80vh', overflow: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Nova Cobrança</h3>
            <form onSubmit={createCharge}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Cliente *</label>
                <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} style={selectS} required>
                  <option style={{ color: '#0f172a' }} value="">Selecione...</option>
                  {clients.map(cl => <option style={{ color: '#0f172a' }} key={cl.id} value={cl.id}>{cl.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Valor (R$) *</label>
                  <input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={inputS} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Vencimento *</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} style={inputS} required />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'flex-end', marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Humor da Cobrança (AI Copywriting)</label>
                  <select 
                    value={cobrancaHumor} 
                    onChange={e => setCobrancaHumor(e.target.value)} 
                    style={selectS}
                  >
                    <option style={{ color: '#0f172a' }} value="gentil">😇 Gentil (Amigável e leve)</option>
                    <option style={{ color: '#0f172a' }} value="firme">👔 Firme (Direto e profissional)</option>
                    <option style={{ color: '#0f172a' }} value="urgente">🚨 Urgente (Alerta com seriedade)</option>
                    <option style={{ color: '#0f172a' }} value="divertido">🐍 Divertido (Com trocadilhos de cobrinha)</option>
                  </select>
                </div>
                <button 
                  type="button" 
                  onClick={handleRedigirComIA}
                  disabled={cobrancaAiLoading}
                  style={{
                    padding: '12px 20px', borderRadius: 8, background: 'rgba(5,150,105,0.15)',
                    color: '#6ee7b7', border: '1px solid rgba(5,150,105,0.3)', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'Inter', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                    height: 44, opacity: cobrancaAiLoading ? 0.6 : 1
                  }}
                >
                  {cobrancaAiLoading ? 'Redigindo...' : '🪄 Redigir com IA'}
                </button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Descrição / Mensagem de Cobrança</label>
                <textarea 
                  rows="3"
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                  placeholder="Ex: Mensalidade de Maio/2026. Use o botão de IA acima para redigir um texto incrível!" 
                  style={{ ...inputS, height: 'unset', resize: 'vertical' }} 
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Recorrência</label>
                  <select value={form.recurrence} onChange={e => setForm({ ...form, recurrence: e.target.value })} style={selectS}>
                    <option style={{ color: '#0f172a' }} value="once">Única</option>
                    <option style={{ color: '#0f172a' }} value="monthly">Mensal</option>
                    <option style={{ color: '#0f172a' }} value="weekly">Semanal</option>
                    <option style={{ color: '#0f172a' }} value="quarterly">Trimestral</option>
                    <option style={{ color: '#0f172a' }} value="yearly">Anual</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Juros Diários Pós-Vencimento (%)</label>
                  <input type="number" step="0.01" min="0" value={form.daily_interest_rate} onChange={e => setForm({ ...form, daily_interest_rate: e.target.value })} placeholder="Ex: 0.1" style={inputS} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Canal</label>
                  <select value={form.reminder_channel} onChange={e => setForm({ ...form, reminder_channel: e.target.value })} style={selectS}>
                    {user?.plan !== 'starter' && <option style={{ color: '#0f172a' }} value="both">WhatsApp + Email</option>}
                    {user?.plan !== 'starter' && <option style={{ color: '#0f172a' }} value="whatsapp">WhatsApp</option>}
                    <option style={{ color: '#0f172a' }} value="email">E-mail</option>
                  </select>
                  {user?.plan === 'starter' && (
                    <span style={{ display: 'block', fontSize: 10, color: '#f59e0b', marginTop: 4 }}>
                      ⚠️ WhatsApp disponível a partir do plano Crescimento.
                    </span>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Método de Pagamento</label>
                  <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} style={selectS}>
                    <option style={{ color: '#0f172a' }} value="pix">Pix</option>
                    <option style={{ color: '#0f172a' }} value="boleto">Boleto</option>
                    <option style={{ color: '#0f172a' }} value="link">Link</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '12px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 14, fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter' }}>Cancelar</button>
                <button type="submit" style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'Inter' }}>Criar Cobrança</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Generation Modal */}
      {selectedChargeForContract && (() => {
        const c = selectedChargeForContract;
        const client = clients.find(cl => cl.id === c.client_id) || {};
        const formattedDate = new Date().toLocaleDateString('pt-BR');
        const dueDateFormatted = new Date(c.due_date).toLocaleDateString('pt-BR');
        
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedChargeForContract(null)}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#1e293b', borderRadius: 20, padding: 36, width: 680, maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16, marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>📄 Visualizar Contrato</h3>
                <button onClick={() => setSelectedChargeForContract(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>

              {/* Sheet container */}
              <div id="printable-contract-sheet" style={{ background: '#fff', color: '#1e293b', padding: '36px', borderRadius: 8, boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)', marginBottom: 24, fontFamily: 'serif', lineHeight: 1.6 }}>
                <h2 style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, margin: '0 0 24px 0', textTransform: 'uppercase', borderBottom: '2px solid #0f172a', paddingBottom: 10 }}>
                  INSTRUMENTO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS
                </h2>
                
                <p style={{ textAlign: 'justify', fontSize: 13, marginBottom: 14 }}>
                  Pelo presente instrumento particular, de um lado:
                </p>
                <p style={{ textAlign: 'justify', fontSize: 13, marginBottom: 14 }}>
                  <strong>CONTRATADA:</strong> <strong>{user?.business_name || user?.name || 'PRESTADOR DE SERVIÇOS'}</strong>, doravante denominada simplesmente CONTRATADA.
                </p>
                <p style={{ textAlign: 'justify', fontSize: 13, marginBottom: 14 }}>
                  E de outro lado:
                </p>
                <p style={{ textAlign: 'justify', fontSize: 13, marginBottom: 14 }}>
                  <strong>CONTRATANTE:</strong> <strong>{c.client_name || 'N/A'}</strong>, {client.document ? `inscrito(a) no CPF/CNPJ sob o nº ${client.document},` : ''} {client.address ? `residente e domiciliado(a) em ${client.address},` : ''} doravante denominado simplesmente CONTRATANTE.
                </p>
                
                <p style={{ textAlign: 'justify', fontSize: 13, marginBottom: 14 }}>
                  Têm, entre si, justo e contratado o seguinte:
                </p>

                <h3 style={{ fontSize: 13, fontWeight: 700, margin: '18px 0 6px 0', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: 2 }}>
                  CLÁUSULA PRIMEIRA – DO OBJETO
                </h3>
                <p style={{ textAlign: 'justify', fontSize: 13, marginBottom: 14 }}>
                  O objeto del presente contrato consiste na realização dos seguintes serviços / fornecimento de produtos pela CONTRATADA: <strong>{c.description || 'Prestação de serviços diversos conforme combinado'}</strong>.
                </p>

                <h3 style={{ fontSize: 13, fontWeight: 700, margin: '18px 0 6px 0', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: 2 }}>
                  CLÁUSULA SEGUNDA – DO VALOR E DO VENCIMENTO
                </h3>
                <p style={{ textAlign: 'justify', fontSize: 13, marginBottom: 14 }}>
                  Pela prestação dos serviços referidos na cláusula anterior, a CONTRATANTE pagará à CONTRATADA o valor bruto de <strong>{fmt(c.amount)}</strong>, com vencimento impreterivelmente em <strong>{dueDateFormatted}</strong>, através de <strong>{c.payment_method?.toUpperCase()}</strong>.
                </p>

                <h3 style={{ fontSize: 13, fontWeight: 700, margin: '18px 0 6px 0', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: 2 }}>
                  CLÁUSULA TERCEIRA – DOS ENCARGOS POR ATRASO
                </h3>
                <p style={{ textAlign: 'justify', fontSize: 13, marginBottom: 14 }}>
                  Em caso de inadimplemento da parcela referida na cláusula segunda até a data estabelecida, serão aplicados juros diários moratórios de <strong>{c.daily_interest_rate || 0}% ao dia</strong> pro rata die, a contar do primeiro dia subsequente ao vencimento até o dia de seu integral pagamento.
                </p>

                <h3 style={{ fontSize: 13, fontWeight: 700, margin: '18px 0 6px 0', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: 2 }}>
                  CLÁUSULA QUARTA – DO FORO
                </h3>
                <p style={{ textAlign: 'justify', fontSize: 13, marginBottom: 14 }}>
                  Fica eleito o foro da comarca da CONTRATADA para dirimir quaisquer controvérsias que possam originar-se deste contrato, com exclusão de qualquer outro por mais privilegiado que seja.
                </p>

                <p style={{ textAlign: 'justify', fontSize: 13, marginTop: 24, marginBottom: 40 }}>
                  E, por estarem assim justas e acordadas, as partes firmam o presente instrumento na data de <strong>{formattedDate}</strong>.
                </p>

                <div style={{ marginTop: 50, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                  <div style={{ borderTop: '1px solid #1e293b', textAlign: 'center', paddingTop: 8, fontSize: 11, fontWeight: 700 }}>
                    CONTRATANTE<br />{c.client_name}
                  </div>
                  <div style={{ borderTop: '1px solid #1e293b', textAlign: 'center', paddingTop: 8, fontSize: 11, fontWeight: 700 }}>
                    CONTRATADA<br />{user?.business_name || user?.name || 'PRESTADOR'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setSelectedChargeForContract(null)} style={{ padding: '12px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter', cursor: 'pointer' }}>Fechar</button>
                <button type="button" onClick={handlePrintContract} style={{ padding: '12px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#059669,#0d9488)', color: '#fff', fontWeight: 700, border: 'none', fontFamily: 'Inter', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  🖨️ Imprimir / Salvar PDF
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
