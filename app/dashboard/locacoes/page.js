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
    clientDocument: '', // CPF/CNPJ
    vehicleModel: '',
    vehiclePlate: '',
    vehicleColor: '',
    amount: '',
    depositAmount: '1000.00', // Caução default
    dueDate: '',
    recurrence: 'weekly' // Default weekly recurrence
  });

  // === VEHICLE RENTAL PREMIUM MODULE STATES ===
  const [activeTab, setActiveTab] = useState('contracts'); // 'contracts' | 'fleet' | 'fines' | 'escrow' | 'split'
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    model: '',
    plate: '',
    color: '',
    year: '',
    renavam: '',
    chassis: '',
    current_km: '',
    oil_change_interval_km: '10000',
    insurance_policy: '',
    insurance_expires_at: '',
    investor_name: '',
    investor_split_rate: ''
  });

  const fetchVehicles = async () => {
    setVehiclesLoading(true);
    try {
      const res = await fetch('/api/locacoes/vehicles');
      const data = await res.json();
      if (data.vehicles) setVehicles(data.vehicles);
    } catch (e) {
      console.error(e);
    } finally {
      setVehiclesLoading(false);
    }
  };

  const handleRegisterVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.model || !vehicleForm.plate || !vehicleForm.color) {
      alert('Modelo, Placa e Cor são campos obrigatórios.');
      return;
    }
    try {
      const res = await fetch('/api/locacoes/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleForm)
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('🚗 Veículo cadastrado com sucesso na frota!');
        setShowVehicleModal(false);
        setVehicleForm({
          model: '', plate: '', color: '', year: '', renavam: '', chassis: '',
          current_km: '', oil_change_interval_km: '10000', insurance_policy: '',
          insurance_expires_at: '', investor_name: '', investor_split_rate: ''
        });
        fetchVehicles();
      } else {
        alert(data.error || 'Erro ao cadastrar veículo.');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar veículo.');
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!confirm('Deseja realmente remover este veículo da frota?')) return;
    try {
      const res = await fetch(`/api/locacoes/vehicles?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('🗑️ Veículo removido da frota.');
        fetchVehicles();
      } else {
        alert('Erro ao excluir veículo.');
      }
    } catch (e) {
      alert('Erro de conexão ao excluir.');
    }
  };

  const handleUpdateVehicleStatus = async (id, newStatus) => {
    try {
      const res = await fetch('/api/locacoes/vehicles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        showNotification(`🚗 Status do veículo atualizado para: ${newStatus === 'available' ? 'Disponível' : newStatus === 'maintenance' ? 'Em Manutenção' : newStatus}`);
        fetchVehicles();
      }
    } catch (e) {}
  };

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
      
      setRentals(rentalCharges);
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
    fetchLocacoes();
    fetchClients();
    fetchUser();
    fetchWaStatus();
    fetchVehicles();
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



  // Confirm Return / Devolução (Item 3)
  const handleConfirmReturn = async (rental) => {
    if (!confirm(`Confirmar devolução do veículo ${rental.vehicle_info} e liquidar cobrança de R$ ${Number(rental.amount).toFixed(2)}?`)) return;
    try {
      showNotification(`🚗 Registrando devolução de veículo para ${rental.client_name}...`);
      
      if (rental.id.startsWith('loc-demo')) {
        setTimeout(() => {
          showNotification(`✅ [DEMO] Devolução de ${rental.client_name} registrada com sucesso!`);
          // update state offline for demo items
          setRentals(prev => prev.map(r => r.id === rental.id ? { ...r, status: 'paid' } : r));
        }, 1500);
        return;
      }

      const res = await fetch(`/api/cobrancas/${rental.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' })
      });
      if (res.ok) {
        showNotification(`🚗 Veículo devolvido e aluguel liquidado com sucesso!`);
        fetchLocacoes();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao registrar devolução');
      }
    } catch (e) {
      alert('Erro de conexão ao processar devolução');
    }
  };

  // Refund Deposit / Restituir Caução (Item 2)
  const handleRefundDeposit = async (rental) => {
    if (!confirm(`Deseja realmente restituir o depósito de caução de R$ ${Number(rental.deposit_amount).toFixed(2)} para ${rental.client_name}?`)) return;
    try {
      showNotification(`💸 Processando restituição de caução para ${rental.client_name}...`);
      
      if (rental.id.startsWith('loc-demo')) {
        setTimeout(() => {
          showNotification(`✅ [DEMO] Caução de R$ ${Number(rental.deposit_amount).toFixed(2)} devolvido para ${rental.client_name}!`);
          setRentals(prev => prev.map(r => r.id === rental.id ? { ...r, deposit_amount: 0 } : r));
        }, 1500);
        return;
      }

      const res = await fetch(`/api/cobrancas/${rental.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundDeposit: true })
      });
      if (res.ok) {
        showNotification(`💸 Depósito de caução de R$ ${Number(rental.deposit_amount).toFixed(2)} restituído com sucesso!`);
        fetchLocacoes();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao processar restituição');
      }
    } catch (e) {
      alert('Erro de conexão ao processar restituição');
    }
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
          charge_id: rental.id, // Fixed snake_case payload
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
  const activeCount = rentals.filter(r => r.status !== 'cancelled' && r.status !== 'paid').length;
  const overdueCount = rentals.filter(r => r.status === 'overdue').length;
  const paidCount = rentals.filter(r => r.status === 'paid').length;

  const cardStyle = {
    background: '#0C0E1A',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.04)',
    padding: isMobile ? '14px' : '20px'
  };

  const statusConfig = {
    paid: { l: 'Devolvido / Pago 🟢', c: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
    pending: { l: 'Aluguel Pendente 🟡', c: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
    overdue: { l: 'Atrasado / Telemetria! 🔴', c: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' }
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
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 0, justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>🚗 Painel de Locações e Frotas</h2>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Gerencie carros alugados, gere contratos jurídicos e notifique diárias via WhatsApp.</p>
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
          ➕ Configurar Nova Locação
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
                Evite que seus clientes recebam cobranças de um número genérico do sistema. Conectando seu aparelho, os lembretes saem com <strong>sua foto e seu nome</strong> e as respostas vão direto para você!
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

      {/* Tab Selector Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 24, gap: 16, overflowX: 'auto', paddingBottom: 6 }} className="scrollbar-none">
        {[
          { id: 'contracts', label: '📊 Ativos & Contratos' },
          { id: 'fleet', label: '🚗 Sua Frota' },
          { id: 'fines', label: '🧾 Multas & Infrações' },
          { id: 'escrow', label: '💸 Caução & Custódias' },
          { id: 'split', label: '📈 Repasses' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0 0 10px 0',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? '#10b981' : '#64748b',
              cursor: 'pointer',
              position: 'relative',
              whiteSpace: 'nowrap',
              transition: 'color 0.2s'
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: '#10b981', borderRadius: 4 }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab: Contracts & Active Rentals */}
      {activeTab === 'contracts' && (
        <>
          {/* Grid Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: '12px 16px', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Veículos em Uso</span>
          <h3 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', margin: '2px 0 0 0' }}>{activeCount}</h3>
        </div>
        <div style={{ ...cardStyle, padding: '12px 16px', borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Bloqueios / Atrasados</span>
          <h3 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', margin: '2px 0 0 0' }}>{overdueCount}</h3>
        </div>
        <div style={{ ...cardStyle, padding: '12px 16px', borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Contratos Finalizados</span>
          <h3 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', margin: '2px 0 0 0' }}>{paidCount}</h3>
        </div>
      </div>

      {/* Fleet Table */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', marginBottom: 16 }}>Controle de Frota Sincronizado</h3>
        
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {rentals.map((r, idx) => {
              const config = statusConfig[r.status] || statusConfig.pending;
              return (
                <div 
                  key={r.id || idx} 
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
                  {/* Card Header: Vehicle + Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>{r.vehicle_info}</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#64748b' }}>Devolução: {new Date(r.due_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 20, color: config.c, background: config.bg, fontWeight: 700 }}>
                      {config.l}
                    </span>
                  </div>

                  {/* Card Details: Payer + Value */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '10px 0' }}>
                    <div>
                      <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>LOCATÁRIO</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: 12.5, fontWeight: 600, color: '#cbd5e1' }}>{r.client_name}</p>
                      <span style={{ fontSize: 10, color: '#64748b' }}>{r.client_phone}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>ALUGUEL</span>
                      <p style={{ margin: '2px 0 0 0', fontSize: 12.5, fontWeight: 700, color: '#f1f5f9' }}>R$ {Number(r.amount).toFixed(2)}</p>
                      <p style={{ margin: '1px 0 0 0', fontSize: 10, color: '#94a3b8' }}>Caução: R$ {Number(r.deposit_amount || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button 
                      onClick={() => handleOpenContract(r)}
                      style={{
                        flex: 1,
                        minWidth: '90px',
                        padding: '8px 10px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#cbd5e1',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      📄 Contrato
                    </button>
                    {r.status !== 'paid' && (
                      <button 
                        onClick={() => triggerAlert('diaria', r)}
                        style={{
                          flex: 1,
                          minWidth: '90px',
                          padding: '8px 10px',
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
                    )}
                    {r.status !== 'paid' && (
                      <button 
                        onClick={() => triggerAlert('return', r)}
                        style={{
                          flex: 1,
                          minWidth: '90px',
                          padding: '8px 10px',
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
                    )}
                    
                    {/* Return Confirmation Button (Item 3) */}
                    {r.status !== 'paid' && (
                      <button 
                        onClick={() => handleConfirmReturn(r)}
                        style={{
                          flex: 1,
                          minWidth: '90px',
                          padding: '8px 10px',
                          background: 'rgba(59,130,246,0.15)',
                          border: '1px solid rgba(59,130,246,0.3)',
                          color: '#60a5fa',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ✅ Receber Carro
                      </button>
                    )}

                    {/* Refund Deposit Button (Item 2) */}
                    {r.status === 'paid' && r.deposit_amount > 0 && (
                      <button 
                        onClick={() => handleRefundDeposit(r)}
                        style={{
                          flex: 1,
                          minWidth: '90px',
                          padding: '8px 10px',
                          background: 'rgba(245,158,11,0.15)',
                          border: '1px solid rgba(245,158,11,0.3)',
                          color: '#f59e0b',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        💸 Devolver Caução
                      </button>
                    )}


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
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {r.status !== 'paid' && (
                            <button 
                              onClick={() => triggerAlert('diaria', r)}
                              title="Cobrar Valor no WhatsApp"
                              style={{
                                padding: '6px 10px',
                                background: 'rgba(16,185,129,0.08)',
                                border: '1px solid rgba(16,185,129,0.2)',
                                color: '#10b981',
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              📱 Cobrar
                            </button>
                          )}
                          {r.status !== 'paid' && (
                            <button 
                              onClick={() => triggerAlert('return', r)}
                              title="Notificar Prazo de Devolução"
                              style={{
                                padding: '6px 10px',
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
                          )}
                          
                          {/* Confirm Return Button (Item 3) */}
                          {r.status !== 'paid' && (
                            <button 
                              onClick={() => handleConfirmReturn(r)}
                              title="Confirmar devolução do carro e liquidar"
                              style={{
                                padding: '6px 10px',
                                background: 'rgba(59,130,246,0.15)',
                                border: '1px solid rgba(59,130,246,0.3)',
                                color: '#60a5fa',
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              ✅ Devolver
                            </button>
                          )}

                          {/* Refund Deposit Button (Item 2) */}
                          {r.status === 'paid' && r.deposit_amount > 0 && (
                            <button 
                              onClick={() => handleRefundDeposit(r)}
                              title="Restituir o depósito de caução locatício"
                              style={{
                                padding: '6px 10px',
                                background: 'rgba(245,158,11,0.15)',
                                border: '1px solid rgba(245,158,11,0.3)',
                                color: '#f59e0b',
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              💸 Restituir
                            </button>
                          )}


                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}

      {/* Tab: Sua Frota (Fleet Control) */}
      {activeTab === 'fleet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Frota de Veículos Cadastrada
            </span>
            <button 
              onClick={() => setShowVehicleModal(true)}
              style={{ ...btnPrimary, padding: '10px 16px', borderRadius: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>🚗</span> Cadastrar Carro
            </button>
          </div>

          {vehiclesLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ width: 32, height: 32, border: '4px solid rgba(16,185,129,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 12 }}></div>
              <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Buscando frota de veículos...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div style={{ background: '#0C0E1A', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 20, padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 36, marginBottom: 12 }}>🚗</span>
              <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: 15, fontWeight: 800 }}>Nenhum veículo cadastrado na frota</h4>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0, maxWidth: 360, lineHeight: 1.5 }}>Adicione os carros de sua propriedade ou de investidores parceiros para iniciar o controle físico, KM e seguros.</p>
              <button 
                onClick={() => setShowVehicleModal(true)}
                style={{ ...btnPrimary, padding: '10px 16px', borderRadius: 8, marginTop: 16 }}
              >
                Cadastrar Primeiro Veículo
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16 }}>
              {vehicles.map(v => {
                const limitKm = (v.last_oil_change_km || 0) + (v.oil_change_interval_km || 10000);
                const isOilNear = (v.current_km >= limitKm - 1000);
                const isOverdue = (v.current_km >= limitKm);

                return (
                  <div key={v.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff' }}>🚗 {v.model}</h4>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '2px 6px', borderRadius: 6, display: 'inline-block', marginTop: 4 }}>
                          {v.plate}
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: 10, padding: '4px 8px', borderRadius: 20, fontWeight: 700,
                        color: v.status === 'rented' ? '#3b82f6' : v.status === 'maintenance' ? '#f59e0b' : v.status === 'damaged' ? '#ef4444' : '#10b981',
                        background: v.status === 'rented' ? 'rgba(59,130,246,0.08)' : v.status === 'maintenance' ? 'rgba(245,158,11,0.08)' : v.status === 'damaged' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)'
                      }}>
                        {v.status === 'rented' ? 'Alugado' : v.status === 'maintenance' ? 'Oficina' : v.status === 'damaged' ? 'Batido' : 'Disponível'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5, color: '#cbd5e1', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 10 }}>
                      <p style={{ margin: 0 }}><strong>KM Atual:</strong> {v.current_km?.toLocaleString('pt-BR')} KM</p>
                      <p style={{ margin: 0 }}><strong>Cor/Ano:</strong> {v.color} • {v.year || 'N/D'}</p>
                      {v.investor_name && <p style={{ margin: 0, color: '#38bdf8' }}><strong>Investidor:</strong> {v.investor_name} ({v.investor_split_rate}%)</p>}
                    </div>

                    {/* Oil Change Progress Bar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600 }}>
                        <span style={{ color: isOverdue ? '#ef4444' : isOilNear ? '#f59e0b' : '#64748b' }}>
                          {isOverdue ? '🚨 Óleo Vencido!' : isOilNear ? '⚠️ Troca de Óleo Próxima' : '🔧 Troca de Óleo'}
                        </span>
                        <span style={{ color: '#cbd5e1' }}>{v.current_km} / {limitKm} KM</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${Math.min(100, Math.max(5, ((v.current_km - v.last_oil_change_km) / v.oil_change_interval_km) * 100))}%`,
                          background: isOverdue ? '#ef4444' : isOilNear ? '#f59e0b' : '#10b981',
                          borderRadius: 3
                        }} />
                      </div>
                    </div>

                    {/* Insurance Policy */}
                    {v.insurance_policy && (
                      <div style={{ fontSize: 10.5, color: '#64748b', background: 'rgba(255,255,255,0.01)', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.02)' }}>
                        🔒 Seguro: {v.insurance_policy}<br />
                        📅 Vence: {v.insurance_expires_at ? new Date(v.insurance_expires_at).toLocaleDateString('pt-BR') : 'N/D'}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 10, marginTop: 'auto' }}>
                      {v.status === 'available' && (
                        <button 
                          onClick={() => handleUpdateVehicleStatus(v.id, 'maintenance')}
                          style={{ ...btnGhost, flex: 1, padding: '6px 0', fontSize: 11, borderRadius: 8 }}
                        >
                          🔧 Enviar p/ Oficina
                        </button>
                      )}
                      {v.status === 'maintenance' && (
                        <button 
                          onClick={() => handleUpdateVehicleStatus(v.id, 'available')}
                          style={{ ...btnPrimary, flex: 1, padding: '6px 0', fontSize: 11, borderRadius: 8 }}
                        >
                          ✅ Disponibilizar
                        </button>
                      )}
                      <button 
                        onClick={async () => {
                          const newKm = prompt('Atualizar KM do veículo:', v.current_km);
                          if (newKm && !isNaN(parseInt(newKm))) {
                            const res = await fetch('/api/locacoes/vehicles', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: v.id, current_km: parseInt(newKm) })
                            });
                            if (res.ok) {
                              showNotification('KM atualizado!');
                              fetchVehicles();
                            }
                          }
                        }}
                        style={{ ...btnGhost, flex: 1, padding: '6px 0', fontSize: 11, borderRadius: 8 }}
                      >
                        📈 Ajustar KM
                      </button>
                      <button 
                        onClick={() => handleDeleteVehicle(v.id)}
                        style={{ ...btnGhost, padding: '6px 10px', borderRadius: 8, fontSize: 11, color: '#f87171' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Placeholders for Fines, Escrow and Split tabs */}
      {activeTab === 'fines' && (
        <div style={cardStyle} className="text-center">
          <span style={{ fontSize: 32 }}>🧾</span>
          <h4 style={{ margin: '12px 0 4px 0', color: '#fff', fontSize: 15, fontWeight: 800 }}>Gestão de Multas (Catarina Fine Finder)</h4>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0, maxWidth: 360, margin: '0 auto', lineHeight: 1.5 }}>Módulo de busca inteligente de condutor na multa e faturamento automático de infrações ativo em breve na próxima fase.</p>
        </div>
      )}
      {activeTab === 'escrow' && (
        <div style={cardStyle} className="text-center">
          <span style={{ fontSize: 32 }}>💸</span>
          <h4 style={{ margin: '12px 0 4px 0', color: '#fff', fontSize: 15, fontWeight: 800 }}>Custódia de Caução & Extratos</h4>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0, maxWidth: 360, margin: '0 auto', lineHeight: 1.5 }}>Módulo de controle de depósitos em custódia e amortização de parcelas ativo em breve na próxima fase.</p>
        </div>
      )}
      {activeTab === 'split' && (
        <div style={cardStyle} className="text-center">
          <span style={{ fontSize: 32 }}>📈</span>
          <h4 style={{ margin: '12px 0 4px 0', color: '#fff', fontSize: 15, fontWeight: 800 }}>Repasse para Investidores</h4>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0, maxWidth: 360, margin: '0 auto', lineHeight: 1.5 }}>Módulo de split e comissão líquida de faturamento para parceiros de carros ativo em breve na próxima fase.</p>
        </div>
      )}

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr', gap: 10 }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 10 }}>
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
                Este contrato foi auto-gerado sob rigor jurídico e favorável ao locador. Quer customizar as cláusulas, adicionar limite de quilometragem ou alterar valores? <strong>Basta abrir o Chatbot da Catarina AI</strong> e dizer: <em>"Catarina, mude o contrato de locação do veículo de {activeContract.client_name} para incluir..."</em>. Ela atualizará o texto eletrônico imediatamente no seu painel!
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
            background: '#0C0E1A',
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
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer', marginLeft: 'auto' }}
              >
                ✕
              </button>
            </div>

            {whatsappStatus === 'connecting' && (
              <div style={{ padding: '30px 0', textAlign: 'center' }}>
                <div style={{ border: '3.5px solid rgba(16,185,129,0.1)', borderTop: '3.5px solid #10b981', borderRadius: '50%', width: 44, height: 44, margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>Gerando Sessão de WhatsApp...</p>
                <p style={{ fontSize: 12, color: '#64748b' }}>Conectando com o servidor de mensagens. Aguarde alguns instantes.</p>
              </div>
            )}

            {whatsappStatus === 'scanning' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 18, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: '#10b981', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>Como parear:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: '#cbd5e1' }}>
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

      {/* Register New Vehicle Modal */}
      {showVehicleModal && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', margin: 0 }}>🚗 Cadastrar Carro na Frota</h3>
              <button 
                onClick={() => setShowVehicleModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer', marginLeft: 'auto' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterVehicle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Vehicle basic data */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Modelo do Veículo *</label>
                  <input 
                    type="text" 
                    value={vehicleForm.model} 
                    onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} 
                    placeholder="Ex: Fiat Uno 1.0" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Placa *</label>
                  <input 
                    type="text" 
                    value={vehicleForm.plate} 
                    onChange={e => setVehicleForm({...vehicleForm, plate: e.target.value})} 
                    placeholder="ABC1D23" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                    required 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Cor *</label>
                  <input 
                    type="text" 
                    value={vehicleForm.color} 
                    onChange={e => setVehicleForm({...vehicleForm, color: e.target.value})} 
                    placeholder="Branco" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                    required 
                  />
                </div>
              </div>

              {/* Technical detail */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Ano Modelo</label>
                  <input 
                    type="number" 
                    value={vehicleForm.year} 
                    onChange={e => setVehicleForm({...vehicleForm, year: e.target.value})} 
                    placeholder="2020" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>KM Atual Inicial</label>
                  <input 
                    type="number" 
                    value={vehicleForm.current_km} 
                    onChange={e => setVehicleForm({...vehicleForm, current_km: e.target.value})} 
                    placeholder="45000" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Intervalo Troca Óleo (KM)</label>
                  <input 
                    type="number" 
                    value={vehicleForm.oil_change_interval_km} 
                    onChange={e => setVehicleForm({...vehicleForm, oil_change_interval_km: e.target.value})} 
                    placeholder="10000" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Legal data */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Código Renavam</label>
                  <input 
                    type="text" 
                    value={vehicleForm.renavam} 
                    onChange={e => setVehicleForm({...vehicleForm, renavam: e.target.value})} 
                    placeholder="01234567890" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Número do Chassi</label>
                  <input 
                    type="text" 
                    value={vehicleForm.chassis} 
                    onChange={e => setVehicleForm({...vehicleForm, chassis: e.target.value})} 
                    placeholder="9BDXXXXXX..." 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Insurance */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Apólice do Seguro</label>
                  <input 
                    type="text" 
                    value={vehicleForm.insurance_policy} 
                    onChange={e => setVehicleForm({...vehicleForm, insurance_policy: e.target.value})} 
                    placeholder="Porto Seguro - Apólice 12345" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Vencimento do Seguro</label>
                  <input 
                    type="date" 
                    value={vehicleForm.insurance_expires_at} 
                    onChange={e => setVehicleForm({...vehicleForm, insurance_expires_at: e.target.value})} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Investor data */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Investidor Dono do Carro (Opcional)</label>
                  <input 
                    type="text" 
                    value={vehicleForm.investor_name} 
                    onChange={e => setVehicleForm({...vehicleForm, investor_name: e.target.value})} 
                    placeholder="Ex: Tio Carlos" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Split Investidor (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={vehicleForm.investor_split_rate} 
                    onChange={e => setVehicleForm({...vehicleForm, investor_split_rate: e.target.value})} 
                    placeholder="80.0" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
                <button 
                  type="button" 
                  onClick={() => setShowVehicleModal(false)}
                  style={{ ...btnGhost, padding: '10px 20px', borderRadius: 8 }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ ...btnPrimary, padding: '10px 20px', borderRadius: 8, boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}
                >
                  Salvar Carro 🚗
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
