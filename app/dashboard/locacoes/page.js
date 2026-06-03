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
    vehicleId: '',
    vehicleModel: '',
    vehiclePlate: '',
    vehicleColor: '',
    amount: '',
    depositAmount: '1000.00', // Caução default
    dueDate: '',
    recurrence: 'weekly' // Default weekly recurrence
  });

  // === VEHICLE RENTAL PREMIUM MODULE STATES ===
  const [activeTab, setActiveTab] = useState('contracts'); // 'contracts' | 'fines' | 'escrow' | 'split'
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfileVehicle, setSelectedProfileVehicle] = useState(null);
  const [profileTimeline, setProfileTimeline] = useState([]);
  const [profileDocs, setProfileDocs] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // === VEHICLE FINES STATES & HANDLERS ===
  const [fines, setFines] = useState([]);
  const [finesLoading, setFinesLoading] = useState(true);
  const [showFineModal, setShowFineModal] = useState(false);
  const [fineForm, setFineForm] = useState({ vehicle_id: '', infraction_date: '', description: '', amount: '', points: '0' });
  const [showFineWaModal, setShowFineWaModal] = useState(false);
  const [fineWaText, setFineWaText] = useState('');
  const [fineMatchedClientPhone, setFineMatchedClientPhone] = useState('');

  // === ESCROW & PAYOUTS STATES ===
  const [escrows, setEscrows] = useState([]);
  const [escrowsLoading, setEscrowsLoading] = useState(true);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [escrowForm, setEscrowForm] = useState({ contract_id: '', amount: '', type: 'deposit', notes: '' });

  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);

  const fetchEscrows = async () => {
    setEscrowsLoading(true);
    try {
      const res = await fetch('/api/locacoes/escrow');
      const data = await res.json();
      if (data.escrows) setEscrows(data.escrows);
    } catch (e) {}
    setEscrowsLoading(false);
  };

  const fetchPayouts = async () => {
    setPayoutsLoading(true);
    try {
      const res = await fetch('/api/locacoes/investors');
      const data = await res.json();
      if (data.payouts) setPayouts(data.payouts);
    } catch (e) {}
    setPayoutsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'escrow') fetchEscrows();
    if (activeTab === 'split') fetchPayouts();
  }, [activeTab]);

  const fetchFines = async () => {
    setFinesLoading(true);
    try {
      const res = await fetch('/api/locacoes/fines');
      const data = await res.json();
      if (data.fines) setFines(data.fines);
    } catch (e) {
      console.error(e);
    } finally {
      setFinesLoading(false);
    }
  };

  const handleEscrowTransaction = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/locacoes/escrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(escrowForm)
      });
      if (res.ok) {
        showNotification('💸 Movimentação de caução registrada!');
        setShowEscrowModal(false);
        setEscrowForm({ contract_id: '', amount: '', type: 'deposit', notes: '' });
        fetchEscrows();
        fetchLocacoes();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao registrar movimentação.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    }
  };

  const handleConfirmPayout = async (vehicleId, amount, investorName) => {
    if (!confirm(`Confirmar repasse de R$ ${Number(amount).toFixed(2)} para o investidor ${investorName}?`)) return;
    try {
      const res = await fetch('/api/locacoes/investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_id: vehicleId, amount, investor_name: investorName })
      });
      if (res.ok) {
        showNotification('💰 Repasse de comissão registrado com sucesso!');
        fetchPayouts();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao registrar repasse.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    }
  };

  const handleRegisterFine = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/locacoes/fines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fineForm)
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('🧾 Multa registrada com sucesso!');
        setShowFineModal(false);
        setFineForm({ vehicle_id: '', infraction_date: '', description: '', amount: '', points: '0' });
        fetchFines();
        
        // Open the editable Whatsapp message modal if driver matched!
        if (data.matched && data.wa_message) {
          setFineWaText(data.wa_message);
          setFineMatchedClientPhone(data.client_phone || '');
          setShowFineWaModal(true);
        }
      } else {
        alert(data.error || 'Erro ao registrar multa.');
      }
    } catch (err) {
      alert('Erro ao registrar multa.');
    }
  };

  const handleConfirmFineIndication = async (fineId) => {
    try {
      const res = await fetch('/api/locacoes/fines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fineId, driver_indicated: 1 })
      });
      if (res.ok) {
        showNotification('✅ Indicação de condutor confirmada!');
        fetchFines();
      }
    } catch (e) {}
  };
  
  const handleOpenVehicleProfile = async (vehicle) => {
    setSelectedProfileVehicle(vehicle);
    setShowProfileModal(true);
    setProfileTimeline([]);
    setProfileDocs([]);
    
    // Fetch History Timeline
    try {
      const res = await fetch(`/api/locacoes/vehicles/history?vehicle_id=${vehicle.id}`);
      const data = await res.json();
      if (data.timeline) setProfileTimeline(data.timeline);
    } catch (e) {
      console.error(e);
    }

    // Fetch Attached Documents list
    try {
      const res = await fetch(`/api/locacoes/vehicles/documents?vehicle_id=${vehicle.id}`);
      const data = await res.json();
      if (data.documents) setProfileDocs(data.documents);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadDocument = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Apenas arquivos PDF são permitidos!');
      return;
    }

    setUploadingDoc(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(',')[1];
      try {
        const res = await fetch('/api/locacoes/vehicles/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicle_id: selectedProfileVehicle.id,
            name: file.name,
            file_base64: base64
          })
        });
        if (res.ok) {
          showNotification('📝 PDF anexado com sucesso!');
          // Refresh docs list
          const docsRes = await fetch(`/api/locacoes/vehicles/documents?vehicle_id=${selectedProfileVehicle.id}`);
          const docsData = await docsRes.json();
          if (docsData.documents) setProfileDocs(docsData.documents);
        } else {
          alert('Erro ao anexar documento.');
        }
       } catch (err) {
         alert('Erro de conexão ao enviar documento.');
       } finally {
         setUploadingDoc(false);
       }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadDocument = async (docId, name) => {
    try {
      const res = await fetch(`/api/locacoes/vehicles/documents/download?id=${docId}`);
      const data = await res.json();
      if (data.doc) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${data.doc.file_base64}`;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      alert('Erro ao baixar documento.');
    }
  };

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
    fetchFines();
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
        
        // Auto-change physical vehicle status back to 'available'
        const plateMatch = rental.vehicle_info?.match(/\(([^)]+)\)/);
        const plate = plateMatch ? plateMatch[1].toUpperCase().trim() : '';
        if (plate) {
          const matchingVehicle = vehicles.find(v => v.plate.toUpperCase().trim() === plate);
          if (matchingVehicle) {
            await fetch('/api/locacoes/vehicles', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: matchingVehicle.id, status: 'available' })
            });
            fetchVehicles();
          }
        }

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
      
      // 3. Automatically set vehicle status to 'rented' if chosen from frota
      if (form.vehicleId) {
        await fetch('/api/locacoes/vehicles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: form.vehicleId, status: 'rented' })
        });
        fetchVehicles();
      }

      setShowModal(false);
      setForm({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        clientDocument: '',
        vehicleId: '',
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

  const btnPrimary = { background: '#10b981', color: '#070913', border: 'none', fontWeight: 700, borderRadius: 12, cursor: 'pointer', fontSize: 14, transition: 'opacity 0.2s' };
  const btnGhost = { background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', fontWeight: 700, borderRadius: 12, cursor: 'pointer', fontSize: 14 };

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

      {/* Tab: Content with Premium transitions (Frente 18) */}
      <div key={activeTab} className="tab-content-active">
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
                              💸 Caução
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
      {activeTab === 'fines' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Gestão de Multas de Trânsito
            </span>
            <button 
              onClick={() => setShowFineModal(true)}
              style={{ ...btnPrimary, padding: '10px 16px', borderRadius: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>🧾</span> Lançar Multa
            </button>
          </div>

          {finesLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', padding: '60px 0' }}>
              <div style={{ width: 32, height: 32, border: '4px solid rgba(16,185,129,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 12 }}></div>
              <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Buscando infrações de trânsito...</p>
            </div>
          ) : fines.length === 0 ? (
            <div style={{ background: '#0C0E1A', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 20, padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center' }}>
              <span style={{ fontSize: 36, marginBottom: 12 }}>🧾</span>
              <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: 15, fontWeight: 800 }}>Nenhuma multa registrada</h4>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0, maxWidth: 360, lineHeight: 1.5 }}>Lançando multas na data e hora da infração, a Catarina localiza automaticamente o motorista correspondente de forma transparente.</p>
              <button 
                onClick={() => setShowFineModal(true)}
                style={{ ...btnPrimary, padding: '10px 16px', borderRadius: 8, marginTop: 16 }}
              >
                Lançar Primeira Multa
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16 }}>
              {fines.map(f => {
                const markupAmount = f.amount * 1.20; // 20% mark-up
                return (
                  <div key={f.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>⚠️ {f.description}</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#cbd5e1' }}><strong>Carro:</strong> {f.model} • {f.plate}</p>
                      </div>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', color: '#f87171', fontWeight: 700 }}>
                        +{f.points} PTS CNH
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5, color: '#cbd5e1', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 10 }}>
                      <p style={{ margin: 0 }}><strong>Data Infração:</strong> {new Date(f.infraction_date).toLocaleString('pt-BR')}</p>
                      <p style={{ margin: 0 }}><strong>Valor Nominal:</strong> R$ {f.amount?.toFixed(2)}</p>
                      <p style={{ margin: 0, color: '#34d399' }}><strong>Reembolso (+20%):</strong> R$ {markupAmount?.toFixed(2)}</p>
                      <p style={{ margin: 0, color: f.client_name ? '#cbd5e1' : '#64748b', fontStyle: f.client_name ? 'normal' : 'italic' }}>
                        <strong>Motorista:</strong> {f.client_name || 'Não localizado pela data'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 10, marginTop: 'auto' }}>
                      <span style={{ 
                        fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 700,
                        color: f.driver_indicated ? '#10b981' : '#f59e0b',
                        background: f.driver_indicated ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)'
                      }}>
                        {f.driver_indicated ? 'Condutor Indicado' : 'Aguardando Indicação'}
                      </span>

                      <div style={{ display: 'flex', gap: 6 }}>
                        {f.client_name && !f.driver_indicated && (
                          <button 
                            onClick={() => handleConfirmFineIndication(f.id)}
                            style={{ ...btnPrimary, padding: '4px 8px', borderRadius: 6, fontSize: 10 }}
                          >
                            Indicar Detran
                          </button>
                        )}
                        {f.client_name && f.wa_message && (
                          <button 
                            onClick={() => {
                              setFineWaText(f.wa_message);
                              setFineMatchedClientPhone(f.client_phone || '');
                              setShowFineWaModal(true);
                            }}
                            style={{ ...btnGhost, padding: '4px 8px', borderRadius: 6, fontSize: 10, color: '#10b981', borderColor: 'rgba(16,185,129,0.2)' }}
                          >
                            Cobrar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* Tab: Caução & Custódias (Contas de Segurança) */}
      {activeTab === 'escrow' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Contas de Caução em Custódia
            </span>
            <button 
              onClick={() => {
                setEscrowForm({ contract_id: '', amount: '', type: 'deposit', notes: '' });
                setShowEscrowModal(true);
              }}
              style={{ ...btnPrimary, padding: '10px 16px', borderRadius: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>💸</span> Lançar Movimentação
            </button>
          </div>

          {escrowsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ width: 32, height: 32, border: '4px solid rgba(16,185,129,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 12 }}></div>
              <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Buscando saldos de caução...</p>
            </div>
          ) : escrows.length === 0 ? (
            <div style={{ background: '#0C0E1A', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 20, padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 36, marginBottom: 12 }}>💸</span>
              <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: 15, fontWeight: 800 }}>Nenhum depósito de caução registrado</h4>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0, maxWidth: 360, lineHeight: 1.5 }}>A caução é amortizada e retida automaticamente de acordo com as locações configuradas.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16 }}>
              {escrows.map(e => {
                const pct = Math.min(100, Math.max(0, (e.balance_paid / e.total_target_amount) * 100));
                return (
                  <div key={e.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>👥 {e.client_name}</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#64748b' }}>🚗 {e.vehicle_model} • {e.vehicle_plate}</p>
                      </div>
                      <span style={{ 
                        fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 700,
                        color: e.status === 'fully_paid' ? '#10b981' : e.status === 'refunded' ? '#94a3b8' : '#f59e0b',
                        background: e.status === 'fully_paid' ? 'rgba(16,185,129,0.08)' : e.status === 'refunded' ? 'rgba(255,255,255,0.04)' : 'rgba(245,158,11,0.08)'
                      }}>
                        {e.status === 'fully_paid' ? 'Quitado' : e.status === 'refunded' ? 'Restituído' : 'Em Amortização'}
                      </span>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#cbd5e1' }}>
                        <span>Acumulado:</span>
                        <span style={{ fontWeight: 700 }}>R$ {Number(e.balance_paid).toFixed(2)} / R$ {Number(e.total_target_amount).toFixed(2)}</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: '#10b981', borderRadius: 3 }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 10, marginTop: 'auto' }}>
                      <button 
                        onClick={() => {
                          setEscrowForm({ contract_id: e.contract_id, amount: '', type: 'withdraw', notes: 'Abatimento por Avaria' });
                          setShowEscrowModal(true);
                        }}
                        style={{ ...btnGhost, flex: 1, padding: '8px 0', fontSize: 10.5, borderRadius: 8, color: '#f87171', borderColor: 'rgba(248,113,113,0.15)', cursor: 'pointer' }}
                      >
                        🛠️ Descontar Avaria
                      </button>
                      <button 
                        onClick={() => {
                          setEscrowForm({ contract_id: e.contract_id, amount: e.balance_paid, type: 'refund', notes: 'Restituição de Caução' });
                          setShowEscrowModal(true);
                        }}
                        style={{ ...btnGhost, flex: 1, padding: '8px 0', fontSize: 10.5, borderRadius: 8, color: '#38bdf8', borderColor: 'rgba(56,189,248,0.15)', cursor: 'pointer' }}
                      >
                        💸 Devolver Caução
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Repasses para Investidores (Split Control) */}
      {activeTab === 'split' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Repasse de Comissão e Splits de Faturamento
          </span>

          {payoutsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
              <div style={{ width: 32, height: 32, border: '4px solid rgba(16,185,129,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 12 }}></div>
              <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Calculando repasses de parceiros...</p>
            </div>
          ) : payouts.length === 0 ? (
            <div style={{ background: '#0C0E1A', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 20, padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifycontent: 'center' }}>
              <span style={{ fontSize: 36, marginBottom: 12 }}>📈</span>
              <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: 15, fontWeight: 800 }}>Nenhum veículo de investidor ativo</h4>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0, maxWidth: 360, lineHeight: 1.5 }}>Insira o nome do investidor no cadastro do carro para habilitar o cálculo automático de divisão de faturamento.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16 }}>
              {payouts.map(p => (
                <div key={p.vehicle_id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#fff' }}>📈 Investidor: {p.investor_name}</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#64748b' }}>🚗 {p.model} • {p.plate}</p>
                    </div>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.08)' }}>
                      Split {p.investor_split_rate}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#cbd5e1', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-slate-400">Receita Bruta:</span>
                      <span className="font-bold text-slate-200">R$ {p.gross_revenue?.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-slate-400">Despesas Oficina:</span>
                      <span className="font-bold text-rose-400">-{p.maintenance_cost?.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-slate-400">Comissão Admin ({100 - p.investor_split_rate}%):</span>
                      <span className="font-bold text-slate-200">R$ {p.admin_commission?.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8, color: '#34d399', fontWeight: 800 }}>
                      <span>Líquido Repassar:</span>
                      <span>R$ {p.net_repasse?.toFixed(2)}</span>
                    </div>
                  </div>

                  {p.last_payout_at && (
                    <p style={{ margin: 0, fontSize: 9.5, color: '#64748b' }}>
                      Último repasse: {new Date(p.last_payout_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}

                  {p.net_repasse > 0 && (
                    <button 
                      onClick={() => handleConfirmPayout(p.vehicle_id, p.net_repasse, p.investor_name)}
                      style={{ ...btnPrimary, padding: '8px 0', fontSize: 11, borderRadius: 8, marginTop: 10 }}
                    >
                      💵 Confirmar Repasse
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Escrow Transaction Modal */}
      {showEscrowModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(12, 14, 26, 0.96)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 440, background: '#0C0E1A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0 }}>💸 Movimentação de Caução</h3>
              <button onClick={() => setShowEscrowModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleEscrowTransaction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Contrato de Locação</label>
                <select
                  required
                  value={escrowForm.contract_id}
                  onChange={e => setEscrowForm(prev => ({ ...prev, contract_id: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#070913', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13 }}
                >
                  <option value="">Selecione o motorista...</option>
                  {escrows.map(e => (
                    <option key={e.id} value={e.contract_id}>{e.client_name} - {e.vehicle_plate}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Valor da Movimentação</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={escrowForm.amount}
                    onChange={e => setEscrowForm(prev => ({ ...prev, amount: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#070913', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Tipo</label>
                  <select
                    value={escrowForm.type}
                    onChange={e => setEscrowForm(prev => ({ ...prev, type: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#070913', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13 }}
                  >
                    <option value="deposit">Aporte (Depósito)</option>
                    <option value="withdraw">Abatimento (Dano/Multa)</option>
                    <option value="refund">Restituição (Devolver)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Descrição / Justificativa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aporte semanal de caução"
                  value={escrowForm.notes}
                  onChange={e => setEscrowForm(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#070913', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 13 }}
                />
              </div>

              <button
                type="submit"
                style={{ ...btnPrimary, padding: '12px 0', fontSize: 13, borderRadius: 12, marginTop: 10 }}
              >
                Registrar Movimentação
              </button>
            </form>
          </div>
        </div>
      )}
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

              {/* Seleção de Veículo Disponível na Frota */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Selecionar Carro da Frota (Disponíveis)</label>
                <select 
                  value={form.vehicleId}
                  onChange={e => {
                    const selectedId = e.target.value;
                    const matching = vehicles.find(v => v.id === selectedId);
                    if (matching) {
                      setForm({
                        ...form,
                        vehicleId: matching.id,
                        vehicleModel: matching.model,
                        vehiclePlate: matching.plate,
                        vehicleColor: matching.color
                      });
                    } else {
                      setForm({
                        ...form,
                        vehicleId: '',
                        vehicleModel: '',
                        vehiclePlate: '',
                        vehicleColor: ''
                      });
                    }
                  }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13, cursor: 'pointer' }}
                >
                  <option value="">-- Cadastrar veículo avulso (digitar abaixo) --</option>
                  {vehicles.filter(v => v.status === 'available').map(v => (
                    <option key={v.id} value={v.id}>{v.model} - {v.plate} ({v.color})</option>
                  ))}
                </select>
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

      {/* Vehicle Profile & Documents Modal */}
      {showProfileModal && selectedProfileVehicle && (
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
            maxWidth: 680,
            background: '#0C0E1A',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🚗</span>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', margin: 0 }}>
                  Perfil do Veículo: {selectedProfileVehicle.model} ({selectedProfileVehicle.plate})
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowProfileModal(false);
                  setSelectedProfileVehicle(null);
                }}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer', marginLeft: 'auto' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
              {/* Left Column: Timeline History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>📈 Histórico de Utilização & Oficina</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                  {profileTimeline.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: 12, fontStyle: 'italic' }}>Nenhum evento registrado no histórico.</p>
                  ) : (
                    profileTimeline.map((evt, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, fontSize: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: evt.type === 'maintenance' ? '#f59e0b' : evt.type === 'fine' ? '#ef4444' : '#10b981' }}>
                            {evt.title}
                          </span>
                          <span style={{ fontSize: 10.5, color: '#64748b' }}>
                            {new Date(evt.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.4 }}>{evt.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Attached PDF Documents */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>📝 Anexos & Documentos (PDF)</h4>
                
                {/* Upload Button */}
                <div style={{ border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.005)' }}>
                  <span style={{ fontSize: 20 }}>📥</span>
                  <label style={{ cursor: uploadingDoc ? 'not-allowed' : 'pointer', fontSize: 12, color: '#10b981', fontWeight: 700 }}>
                    {uploadingDoc ? 'Enviando documento...' : 'Clique para carregar novo PDF'}
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      className="hidden" 
                      disabled={uploadingDoc}
                      onChange={handleUploadDocument} 
                    />
                  </label>
                  <span style={{ fontSize: 10, color: '#64748b' }}>Orçamentos de oficina, vistorias ou contratos</span>
                </div>

                {/* List of PDFs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto', paddingRight: 4, marginTop: 4 }}>
                  {profileDocs.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>Nenhum documento PDF anexado ainda.</p>
                  ) : (
                    profileDocs.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
                        <span style={{ color: '#cbd5e1', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                          📄 {doc.name}
                        </span>
                        <button 
                          onClick={() => handleDownloadDocument(doc.id, doc.name)}
                          style={{ ...btnPrimary, padding: '4px 10px', borderRadius: 6, fontSize: 11 }}
                        >
                          Baixar PDF
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4 }}>
              <button 
                onClick={() => {
                  setShowProfileModal(false);
                  setSelectedProfileVehicle(null);
                }}
                style={{ ...btnGhost, padding: '8px 16px', borderRadius: 8, fontSize: 12 }}
              >
                Fechar Perfil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lançar Nova Multa Modal */}
      {showFineModal && (
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
            gap: 14,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: '#ffffff', margin: 0 }}>🧾 Lançar Nova Multa de Trânsito</h3>
              <button 
                onClick={() => setShowFineModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer', marginLeft: 'auto' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterFine} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Selecionar Veículo *</label>
                <select 
                  value={fineForm.vehicle_id}
                  onChange={e => setFineForm({...fineForm, vehicle_id: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13, cursor: 'pointer' }}
                  required
                >
                  <option value="">-- Escolha o veículo autuado --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.model} - {v.plate}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Data & Hora da Infração *</label>
                  <input 
                    type="datetime-local" 
                    value={fineForm.infraction_date}
                    onChange={e => setFineForm({...fineForm, infraction_date: e.target.value})}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Pontos na CNH *</label>
                  <input 
                    type="number" 
                    value={fineForm.points}
                    onChange={e => setFineForm({...fineForm, points: e.target.value})}
                    placeholder="4" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Descrição da Infração *</label>
                <input 
                  type="text" 
                  value={fineForm.description}
                  onChange={e => setFineForm({...fineForm, description: e.target.value})}
                  placeholder="Ex: Transitar em velocidade superior à máxima permitida em até 20%" 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Valor Nominal da Multa (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={fineForm.amount}
                  onChange={e => setFineForm({...fineForm, amount: e.target.value})}
                  placeholder="130.16" 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none', fontSize: 13 }}
                  required
                />
                <span style={{ fontSize: 10.5, color: '#10b981', display: 'block', marginTop: 4 }}>
                  💡 O sistema aplicará automaticamente a taxa de 20% de comissão administrativa e gerará faturamento de reembolso Pix para o condutor ativo naquela data.
                </span>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
                <button 
                  type="button" 
                  onClick={() => setShowFineModal(false)}
                  style={{ ...btnGhost, padding: '10px 20px', borderRadius: 8 }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ ...btnPrimary, padding: '10px 20px', borderRadius: 8, boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}
                >
                  Confirmar e Buscar Motorista 🔍
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Editable Whatsapp Message Modal */}
      {showFineWaModal && (
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
            border: '1px solid rgba(16,185,129,0.3)',
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
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', margin: 0 }}>💬 Personalizar Mensagem de WhatsApp</h3>
              <button 
                onClick={() => setShowFineWaModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer', marginLeft: 'auto' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>REVISE E EDITE ANTES DE ENVIAR:</span>
              <textarea
                value={fineWaText}
                onChange={e => setFineWaText(e.target.value)}
                style={{ width: '100%', height: 260, padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.5 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
              <button 
                onClick={() => setShowFineWaModal(false)}
                style={{ ...btnGhost, padding: '10px 20px', borderRadius: 8 }}
              >
                Fechar
              </button>
              <button 
                onClick={() => {
                  // Direct trigger WhatsApp send
                  const cleanPhone = fineMatchedClientPhone.replace(/\D/g, '');
                  const url = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(fineWaText)}`;
                  window.open(url, '_blank');
                  setShowFineWaModal(false);
                }}
                style={{ ...btnPrimary, padding: '10px 20px', borderRadius: 8, background: '#25D366', color: '#fff', boxShadow: '0 4px 12px rgba(37,211,102,0.2)' }}
              >
                Disparar WhatsApp 🟢
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
