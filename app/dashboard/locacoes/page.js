'use client';
import { useState, useEffect } from 'react';

export default function LocacoesPage() {
  const [rentals, setRentals] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [activeContract, setActiveContract] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Form State
  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientDocument: '', // CPF/CNPJ
    vehicleModel: '',
    vehiclePlate: '',
    vehicleColor: '',
    amount: '',
    depositAmount: '1000.00', // Caução default
    dueDate: '',
    recurrence: 'weekly' // Default weekly recurrence
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchLocacoes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cobrancas?limit=100');
      const data = await res.json();
      
      // Filter charges that are rentals (have vehicle_info)
      const rentalCharges = (data.charges || []).filter(c => c.vehicle_info !== null && c.vehicle_info !== '');
      
      if (rentalCharges.length > 0) {
        setRentals(rentalCharges);
      } else {
        // Fallbacks/Demo data to show immediately with contract text!
        setRentals([
          {
            id: 'loc-demo-001',
            client_name: 'Guilherme Santos',
            client_phone: '(11) 98888-7777',
            amount: 140.00,
            vehicle_info: 'Chevrolet Onix (QXW-9E12)',
            due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
            status: 'pending',
            recurrence: 'weekly',
            contract_text: `CONTRATO DE ADESÃO DE LOCAÇÃO DE VEÍCULO AUTOMOTOR

LOCADOR: Administradora de Frotas Integrada
LOCATÁRIO: Guilherme Santos | CPF/CNPJ: 345.987.123-00 | WhatsApp: (11) 98888-7777

CLÁUSULA 1 - DO OBJETO E VEÍCULO
O objeto deste instrumento é a locação temporária do veículo automotor caracterizado como:
- VEÍCULO: Chevrolet Onix (QXW-9E12)
O veículo é entregue em perfeito estado de conservação, funcionamento, limpeza e com tanque de combustível cheio, devendo ser devolvido nas mesmas condições.

CLÁUSULA 2 - DO PREÇO, CRONOGRAMA E PAGAMENTO
2.1. O locatário pagará ao locador o valor ajustado de R$ 140.00 (SEMANAL) para a utilização do veículo, acrescido de R$ 1000.00 de Depósito de Caução contratual.
2.2. O vencimento acordado do aluguel é em ${new Date(Date.now() + 86400000).toLocaleDateString('pt-BR')}.
2.3. O ATRASO NO PAGAMENTO SUPERIOR A 24 (VINTE E QUATRO) HORAS constitui inadimplemento contratual imediato e grave (Mora).
2.4. EM CASO DE MORA, fica o locador plenamente autorizado, de forma extrajudicial e sem necessidade de aviso prévio:
  a) A efetuar o BLOQUEIO FÍSICO e RASTREAMENTO do veículo por via remota;
  b) A realizar a BUSCA E APREENSÃO imediata do veículo onde quer que este se encontre, arcando o locatário com todas as custas de guincho e depósito.

CLÁUSULA 3 - DA RESPONSABILIDADE CIVIL E CRIMINAL
3.1. O locatário assume integral responsabilidade civil e criminal por quaisquer danos causados ao veículo, a si próprio ou a terceiros durante o período de posse.
3.2. Todas as infrações de trânsito cometidas no período da locação são de responsabilidade exclusiva do locatário, autorizando o locador a efetuar a indicação de condutor e cobrança regressiva dos valores das multas acrescidas de 20% de taxa administrativa.

CLÁUSULA 4 - DA DEVOLUÇÃO E RENOVAÇÃO
4.1. O veículo deverá ser devolvido impreterivelmente na data limite pactuada.
4.2. A não devolução na data limite e a ausência de prorrogação formal autorizam o locador a registrar boletim de ocorrência policial por apropriação indébita.

Contrato gerado eletronicamente.
Sujeito a alterações negociadas diretamente com a Catarina IA.`
          },
          {
            id: 'loc-demo-002',
            client_name: 'Amanda Vasconcellos',
            client_phone: '(11) 91234-5678',
            amount: 850.00,
            vehicle_info: 'Jeep Compass (FGB-3A45)',
            due_date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
            status: 'overdue',
            recurrence: 'weekly',
            contract_text: `CONTRATO DE ADESÃO DE LOCAÇÃO DE VEÍCULO AUTOMOTOR

LOCADOR: Administradora de Frotas Integrada
LOCATÁRIO: Amanda Vasconcellos | CPF/CNPJ: 456.123.789-11 | WhatsApp: (11) 91234-5678

CLÁUSULA 1 - DO OBJETO E VEÍCULO
O objeto deste instrumento é a locação temporária do veículo automotor caracterizado como:
- VEÍCULO: Jeep Compass (FGB-3A45)
O veículo é entregue em perfeito estado de conservação e limpeza.

CLÁUSULA 2 - DO PREÇO, CRONOGRAMA E PAGAMENTO
2.1. O locatário pagará ao locador o valor ajustado de R$ 850.00 (SEMANAL).
2.2. O vencimento acordado do aluguel foi em ${new Date(Date.now() - 172800000).toLocaleDateString('pt-BR')}.
2.3. O ATRASO NO PAGAMENTO SUPERIOR A 24 (VINTE E QUATRO) HORAS constitui inadimplemento contratual imediato e grave (Mora).
2.4. EM CASO DE MORA, o locador efetuará o bloqueio físico e busca e apreensão.

Contrato sujeito a alterações pela Catarina IA.`
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
    fetchLocacoes();
    fetchClients();
  }, []);

  const showNotification = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleRegisterRental = async (e) => {
    e.preventDefault();
    if (!form.clientName || !form.vehicleModel || !form.vehiclePlate || !form.amount || !form.dueDate) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create client first or find existing (saves CPF in document field)
      let clientId = '';
      const existingClient = clients.find(c => c.name.toLowerCase() === form.clientName.toLowerCase());

      if (existingClient) {
        clientId = existingClient.id;
        // Optionally update document/CPF if provided and client didn't have it
        if (form.clientDocument && !existingClient.document) {
          await fetch(`/api/clientes/${existingClient.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document: form.clientDocument })
          });
        }
      } else {
        const clientRes = await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.clientName,
            email: form.clientEmail || `${form.clientName.toLowerCase().replace(/\s+/g, '')}@locacao.com.br`,
            phone: form.clientPhone || '(11) 99999-9999',
            document: form.clientDocument,
            category: 'Locatário',
            notes: `Locação do veículo ${form.vehicleModel} (${form.vehicleColor}) - Placa ${form.vehiclePlate}`
          })
        });
        const clientData = await clientRes.json();
        if (!clientRes.ok) throw new Error(clientData.error || 'Erro ao criar locatário');
        clientId = clientData.client.id;
      }

      // 2. Create Charge with vehicle_info, auto-triggers the contract generation in backend!
      const vehicle_info = `${form.vehicleModel} (${form.vehiclePlate.toUpperCase()})`;
      const chargeRes = await fetch('/api/cobrancas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          amount: parseFloat(form.amount),
          due_date: form.dueDate,
          description: `Locação: ${vehicle_info}`,
          recurrence: form.recurrence,
          reminder_channel: 'both',
          payment_method: 'pix',
          daily_interest_rate: 0.15, // 0.15% daily interest for delays
          vehicle_info,
          deposit_amount: parseFloat(form.depositAmount || '0')
        })
      });
      const chargeData = await chargeRes.json();
      if (!chargeRes.ok) throw new Error(chargeData.error || 'Erro ao lançar locação');

      showNotification('🚗 Locação cadastrada e Contrato Rígido gerado automaticamente!');
      setShowModal(false);
      setForm({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        clientDocument: '',
        vehicleModel: '',
        vehiclePlate: '',
        vehicleColor: '',
        amount: '',
        depositAmount: '1000.00',
        dueDate: '',
        recurrence: 'weekly'
      });
      fetchLocacoes();
      fetchClients();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerAlert = async (type, rental) => {
    try {
      showNotification(`📱 Enviando alerta de ${type === 'return' ? 'devolução' : 'diária'} via WhatsApp para ${rental.client_name}...`);
      
      const payload = {
        chargeId: rental.id,
        channel: 'whatsapp',
        customMessage: type === 'return'
          ? `Olá, ${rental.client_name}! 🚗 Passando para lembrar que o prazo de devolução do veículo *${rental.vehicle_info}* é amanhã, dia ${new Date(rental.due_date).toLocaleDateString('pt-BR')}. Caso precise renovar seu aluguel, me avise!`
          : `Oi ${rental.client_name}! 🚗 Lembramos que o pagamento da diária/semana de locação do veículo *${rental.vehicle_info}* vence dia ${new Date(rental.due_date).toLocaleDateString('pt-BR')} no valor de R$ ${Number(rental.amount).toFixed(2)}. Chave Pix copia e cola no link abaixo.`
      };

      if (rental.id.startsWith('loc-demo')) {
        setTimeout(() => {
          showNotification(`✅ [DEMO] Lembrete WhatsApp enviado com sucesso para ${rental.client_name}!`);
        }, 1500);
        return;
      }

      const res = await fetch('/api/lembretes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chargeId: rental.id,
          channel: 'whatsapp',
          message: payload.customMessage
        })
      });
      
      if (res.ok) {
        showNotification(`✅ Lembrete disparado com sucesso no WhatsApp do locatário!`);
      } else {
        const err = await res.json();
        showNotification(`⚠️ Falha ao disparar lembrete: ${err.error}`);
      }
    } catch (e) {
      showNotification(`⚠️ Erro ao comunicar com Evolution API.`);
    }
  };

  const handleOpenContract = (rental) => {
    setActiveContract(rental);
    setShowContractModal(true);
  };

  const copyContractText = () => {
    if (activeContract && activeContract.contract_text) {
      navigator.clipboard.writeText(activeContract.contract_text);
      showNotification('📋 Contrato copiado para a área de transferência!');
    }
  };

  const printContractText = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Contrato de Locação - ${activeContract?.client_name}</title>
          <style>
            body { font-family: monospace; padding: 40px; line-height: 1.6; color: #000; background: #fff; white-space: pre-wrap; }
          </style>
        </head>
        <body>${activeContract?.contract_text}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Stats
  const activeCount = rentals.filter(r => r.status !== 'cancelled').length;
  const overdueCount = rentals.filter(r => r.status === 'overdue').length;
  const paidCount = rentals.filter(r => r.status === 'paid').length;

  const cardStyle = {
    background: '#0C0E1A',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.04)',
    padding: '20px'
  };

  const statusConfig = {
    paid: { l: 'Ativo / Pago 🟢', c: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
    pending: { l: 'Diária Pendente 🟡', c: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
    overdue: { l: 'Atrasado / Bloquear! 🔴', c: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' }
  };

  const recurrenceConfig = {
    once: 'Diária avulsa',
    daily: 'Cobrança Diária',
    weekly: 'Cobrança Semanal',
    monthly: 'Cobrança Mensal'
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Toast Alert */}
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
          boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
          animation: 'fadeInUp 0.3s ease'
        }}>
          {msg}
        </div>
      )}

      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>🚗 Painel de Locações e Frotas</h2>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Gerencie carros alugados, gere contratos jurídicos e notifique diárias via WhatsApp.</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 18px',
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
          ➕ Configurar Nova Locação
        </button>
      </div>

      {/* Grid Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Veículos em Uso</span>
          <h3 style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', margin: '4px 0 0 0' }}>{activeCount}</h3>
        </div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Bloqueios / Atrasados</span>
          <h3 style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', margin: '4px 0 0 0' }}>{overdueCount}</h3>
        </div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Contratos Pagos</span>
          <h3 style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', margin: '4px 0 0 0' }}>{paidCount}</h3>
        </div>
      </div>

      {/* Fleet Table */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', marginBottom: 16 }}>Controle de Frota Sincronizado</h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={{ padding: '12px 10px', fontSize: 12, color: '#64748b', fontWeight: 700 }}>🚗 Veículo</th>
                <th style={{ padding: '12px 10px', fontSize: 12, color: '#64748b', fontWeight: 700 }}>👥 Locatário</th>
                <th style={{ padding: '12px 10px', fontSize: 12, color: '#64748b', fontWeight: 700 }}>💰 Valor Aluguel</th>
                <th style={{ padding: '12px 10px', fontSize: 12, color: '#64748b', fontWeight: 700 }}>📅 Devolução</th>
                <th style={{ padding: '12px 10px', fontSize: 12, color: '#64748b', fontWeight: 700 }}>🏷️ Status</th>
                <th style={{ padding: '12px 10px', fontSize: 12, color: '#64748b', fontWeight: 700, textAlign: 'center' }}>📄 Contrato</th>
                <th style={{ padding: '12px 10px', fontSize: 12, color: '#64748b', fontWeight: 700, textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rentals.map((r, idx) => {
                const config = statusConfig[r.status] || statusConfig.pending;
                return (
                  <tr key={r.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '16px 10px', fontSize: 13.5, fontWeight: 700, color: '#f1f5f9' }}>{r.vehicle_info}</td>
                    <td style={{ padding: '16px 10px', fontSize: 13.5, color: '#cbd5e1' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{r.client_name}</p>
                      <span style={{ fontSize: 10.5, color: '#64748b' }}>{r.client_phone}</span>
                    </td>
                    <td style={{ padding: '16px 10px', fontSize: 13.5, color: '#cbd5e1' }}>
                      <p style={{ margin: 0, fontWeight: 700 }}>R$ {Number(r.amount).toFixed(2)}</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: 10.5, color: '#94a3b8', fontWeight: 500 }}>Caução: R$ {Number(r.deposit_amount || 0).toFixed(2)}</p>
                      <span style={{ fontSize: 9.5, color: '#10b981' }}>{recurrenceConfig[r.recurrence] || 'Recorrente'}</span>
                    </td>
                    <td style={{ padding: '16px 10px', fontSize: 13.5, color: '#cbd5e1' }}>
                      {new Date(r.due_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '16px 10px' }}>
                      <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, color: config.c, background: config.bg, fontWeight: 700 }}>
                        {config.l}
                      </span>
                    </td>
                    <td style={{ padding: '16px 10px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleOpenContract(r)}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#e2e8f0',
                          borderRadius: 8,
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        📄 Ver Contrato
                      </button>
                    </td>
                    <td style={{ padding: '16px 10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => triggerAlert('diaria', r)}
                          title="Cobrar Valor no WhatsApp"
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
                          📱 Cobrar Pix
                        </button>
                        <button 
                          onClick={() => triggerAlert('return', r)}
                          title="Notificar Prazo de Devolução"
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(59,130,246,0.08)',
                            border: '1px solid rgba(59,130,246,0.2)',
                            color: '#3b82f6',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          🚗 Retorno
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register New Lease Modal */}
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
            maxWidth: 540,
            background: '#0C0E1A',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', margin: 0 }}>🚗 Configurar Nova Locação de Frota</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer', marginLeft: 'auto' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterRental} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              {/* Lessee info */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Nome do Locatário (Cliente)</label>
                <input 
                  type="text" 
                  value={form.clientName} 
                  onChange={e => setForm({...form, clientName: e.target.value})} 
                  placeholder="Nome do cliente" 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>CPF ou CNPJ do Locatário</label>
                  <input 
                    type="text" 
                    value={form.clientDocument} 
                    onChange={e => setForm({...form, clientDocument: e.target.value})} 
                    placeholder="000.000.000-00" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>WhatsApp Locatário</label>
                  <input 
                    type="tel" 
                    value={form.clientPhone} 
                    onChange={e => setForm({...form, clientPhone: e.target.value})} 
                    placeholder="(11) 99999-9999" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>E-mail corporativo (opcional)</label>
                <input 
                  type="email" 
                  value={form.clientEmail} 
                  onChange={e => setForm({...form, clientEmail: e.target.value})} 
                  placeholder="email@cliente.com" 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                />
              </div>

              {/* Vehicle Detail */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Modelo do Veículo</label>
                  <input 
                    type="text" 
                    value={form.vehicleModel} 
                    onChange={e => setForm({...form, vehicleModel: e.target.value})} 
                    placeholder="Ex: Chevrolet Onix 1.0" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Placa</label>
                  <input 
                    type="text" 
                    value={form.vehiclePlate} 
                    onChange={e => setForm({...form, vehiclePlate: e.target.value})} 
                    placeholder="ABC-1234" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Cor do Veículo</label>
                  <input 
                    type="text" 
                    value={form.vehicleColor} 
                    onChange={e => setForm({...form, vehicleColor: e.target.value})} 
                    placeholder="Ex: Prata" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Recurrence Selection, Pricing and Deposit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Periodicidade</label>
                  <select 
                    value={form.recurrence} 
                    onChange={e => setForm({...form, recurrence: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.9)', color: '#fff', outline: 'none', fontSize: 13, cursor: 'pointer' }}
                  >
                    <option value="once">Diária Única</option>
                    <option value="daily">Cobrança Diária</option>
                    <option value="weekly">Cobrança Semanal</option>
                    <option value="monthly">Cobrança Mensal</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Valor do Aluguel (R$)</label>
                  <input 
                    type="number" 
                    value={form.amount} 
                    onChange={e => setForm({...form, amount: e.target.value})} 
                    placeholder="Ex: 450.00" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Caução / Garantia (R$)</label>
                  <input 
                    type="number" 
                    value={form.depositAmount} 
                    onChange={e => setForm({...form, depositAmount: e.target.value})} 
                    placeholder="Ex: 1000.00" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Data Limite de Devolução</label>
                <input 
                  type="date" 
                  value={form.dueDate} 
                  onChange={e => setForm({...form, dueDate: e.target.value})} 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#cbd5e1', cursor: 'pointer', fontSize: 13 }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                >
                  Registrar e Gerar Contrato 🚗
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Contract Viewer Modal */}
      {showContractModal && activeContract && (
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
            maxWidth: 680,
            background: '#0C0E1A',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 20px 40px rgba(0,0,0,0.9), 0 0 30px rgba(16,185,129,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxHeight: '90vh'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>📄</span>
                <h3 style={{ fontSize: 17, fontWeight: 900, color: '#ffffff', margin: 0 }}>
                  Contrato de Locação — {activeContract.client_name}
                </h3>
              </div>
              <button 
                onClick={() => setShowContractModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer', marginLeft: 'auto' }}
              >
                ✕
              </button>
            </div>

            {/* AI Warning / Prompt Notice */}
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.05)', 
              border: '1px solid rgba(16, 185, 129, 0.25)', 
              borderRadius: 14, 
              padding: '12px 16px',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: 20 }}>💡</span>
              <div style={{ fontSize: 12, color: '#a7f3d0', lineHeight: 1.45 }}>
                <strong>Contrato Mutável por Inteligência Artificial!</strong><br />
                Este contrato foi auto-gerado sob rigor jurídico e favorável ao locador. Quer customizar as cláusulas, adicionar limite de quilometragem ou alterar valores? **Basta abrir o Chatbot da Catarina AI** e dizer: *"Catarina, mude o contrato de locação do veículo de ${activeContract.client_name} para incluir..."*. Ela atualizará o texto eletrônico imediatamente no seu painel!
              </div>
            </div>

            {/* Scrollable Contract Box */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              background: '#05070f', 
              border: '1px solid rgba(255,255,255,0.06)', 
              borderRadius: 14, 
              padding: 20,
              fontFamily: 'monospace',
              fontSize: 12.5,
              color: '#cbd5e1',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)'
            }}>
              {activeContract.contract_text || 'Gerando contrato...'}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 16 }}>
              <button 
                onClick={copyContractText}
                style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                📋 Copiar Texto
              </button>
              <button 
                onClick={printContractText}
                style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                🖨️ Imprimir PDF
              </button>
              <button 
                onClick={() => setShowContractModal(false)}
                style={{ padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
