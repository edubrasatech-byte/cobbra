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
        showNotification('Movimentação de caução registrada!');
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
        showNotification('Repasse de comissão registrado com sucesso!');
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
        showNotification('Multa registrada com sucesso!');
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
        showNotification('Indicação de condutor confirmada!');
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
          showNotification('PDF anexado com sucesso!');
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
        showNotification('Veículo cadastrado com sucesso na frota!');
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
        showNotification('Veículo removido da frota.');
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
        showNotification(`Status do veículo atualizado para: ${newStatus === 'available' ? 'Disponível' : newStatus === 'maintenance' ? 'Em Manutenção' : newStatus}`);
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
              showNotification('WhatsApp conectado com sucesso!');
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
        showNotification('WhatsApp já está conectado!');
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
      showNotification(`Registrando devolução de veículo para ${rental.client_name}...`);
      
      if (rental.id.startsWith('loc-demo')) {
        setTimeout(() => {
          showNotification(`[DEMO] Devolução de ${rental.client_name} registrada com sucesso!`);
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
        showNotification(`Veículo devolvido e aluguel liquidado com sucesso!`);
        
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
      showNotification(`Processando restituição de caução para ${rental.client_name}...`);
      
      if (rental.id.startsWith('loc-demo')) {
        setTimeout(() => {
          showNotification(`[DEMO] Caução de R$ ${Number(rental.deposit_amount).toFixed(2)} devolvido para ${rental.client_name}!`);
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
        showNotification(`Depósito de caução de R$ ${Number(rental.deposit_amount).toFixed(2)} restituído com sucesso!`);
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

      showNotification('Locação cadastrada e Contrato Rígido gerado automaticamente!');
      
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
      showNotification(`Enviando alerta de ${type === 'return' ? 'devolução' : 'diária'} via WhatsApp para ${rental.client_name}...`);
      
      const payload = {
        chargeId: rental.id,
        channel: 'whatsapp',
        customMessage: type === 'return'
          ? `Olá, ${rental.client_name}! Passando para lembrar que o prazo de devolução do veículo *${rental.vehicle_info}* é amanhã, dia ${new Date(rental.due_date).toLocaleDateString('pt-BR')}. Caso precise renovar seu aluguel, me avise!`
          : `Oi ${rental.client_name}! Lembramos que o pagamento da diária/semana de locação do veículo *${rental.vehicle_info}* vence dia ${new Date(rental.due_date).toLocaleDateString('pt-BR')} no valor de R$ ${Number(rental.amount).toFixed(2)}. Chave Pix copia e cola no link abaixo.`
      };

      if (rental.id.startsWith('loc-demo')) {
        setTimeout(() => {
          showNotification(`[DEMO] Lembrete WhatsApp enviado com sucesso para ${rental.client_name}!`);
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
        showNotification(`Lembrete disparado com sucesso no WhatsApp do locatário!`);
      } else {
        const err = await res.json();
        showNotification(`Falha ao disparar lembrete: ${err.error}`);
      }
    } catch (e) {
      showNotification(`Erro ao comunicar com Evolution API.`);
    }
  };

  const handleOpenContract = (rental) => {
    setActiveContract(rental);
    setShowContractModal(true);
  };

  const copyContractText = () => {
    if (activeContract && activeContract.contract_text) {
      navigator.clipboard.writeText(activeContract.contract_text);
      showNotification('Contrato copiado para a área de transferência!');
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

  const statusConfig = {
    paid: { l: 'Devolvido / Pago', c: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    pending: { l: 'Aluguel Pendente', c: 'text-amber-400', bg: 'bg-amber-500/10' },
    overdue: { l: 'Atrasado / Telemetria!', c: 'text-rose-400', bg: 'bg-rose-500/10' }
  };

  const recurrenceConfig = {
    once: 'Diária avulsa',
    daily: 'Cobrança Diária',
    weekly: 'Cobrança Semanal',
    monthly: 'Cobrança Mensal'
  };

  return (
    <div className="font-sans text-primary-theme min-h-screen">
      
      {/* Toast Alert */}
      {msg && (
        <div className="fixed top-20 right-8 bg-emerald-500 text-primary-theme px-6 py-3 rounded-xl text-xs md:text-sm font-bold z-[1001] shadow-lg shadow-emerald-500/25 animate-fadeInUp">
          {msg}
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-primary-theme tracking-tight flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400 inline" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg> Painel de Locações e Frotas
          </h2>
          <p className="text-xs md:text-sm text-secondary-theme mt-1">Gerencie carros alugados, gere contratos jurídicos e notifique diárias via WhatsApp.</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="btn-premium btn-premium-primary w-full sm:w-auto shadow-lg shadow-emerald-500/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 mr-1 inline-block align-middle">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="align-middle">Configurar Nova Locação</span>
        </button>
      </div>

      {/* WhatsApp Connection Induction Card */}
      {whatsappStatus !== 'connected' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 md:p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-500/5 animate-fadeInUp">
          <div className="flex gap-3 items-start">
            <svg className="w-6 h-6 text-emerald-400 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
            <div>
              <h4 className="text-sm font-extrabold text-emerald-400">
                Conecte seu próprio WhatsApp comercial!
              </h4>
              <p className="text-xs text-emerald-200/80 leading-relaxed mt-1">
                Evite que seus clientes recebam cobranças de um número genérico do sistema. Conectando seu aparelho, os lembretes saem com <strong>sua foto e seu nome</strong> e as respostas vão direto para você!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowWaPairModal(true);
              handleStartWaConnection();
            }}
            className="btn-premium btn-premium-primary whitespace-nowrap w-full md:w-auto"
          >
            Conectar WhatsApp Próprio
          </button>
        </div>
      )}

      {/* Tab Selector Navigation */}
      <div className="flex border-b border-theme mb-6 gap-6 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'contracts', label: 'Ativos & Contratos' },
          { id: 'fines', label: 'Multas & Infrações' },
          { id: 'escrow', label: 'Caução & Custódias' },
          { id: 'split', label: 'Repasses' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`bg-transparent border-none pb-2 text-xs md:text-sm font-semibold whitespace-nowrap relative transition-colors duration-150 ${
              activeTab === tab.id ? 'text-emerald-400 font-bold' : 'text-secondary-theme hover:text-primary-theme'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab: Content with Premium transitions (Frente 18) */}
      <div key={activeTab} className="tab-content-active">
        {activeTab === 'contracts' && (
        <>
          {/* Grid Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card-premium border-l-4 border-l-emerald-500 p-4">
              <span className="text-[10px] uppercase tracking-wider text-secondary-theme font-semibold">Veículos em Uso</span>
              <h3 className="text-xl md:text-2xl font-black text-primary-theme mt-1">{activeCount}</h3>
            </div>
            <div className="card-premium border-l-4 border-l-rose-500 p-4">
              <span className="text-[10px] uppercase tracking-wider text-secondary-theme font-semibold">Bloqueios / Atrasados</span>
              <h3 className="text-xl md:text-2xl font-black text-primary-theme mt-1">{overdueCount}</h3>
            </div>
            <div className="card-premium border-l-4 border-l-blue-500 p-4">
              <span className="text-[10px] uppercase tracking-wider text-secondary-theme font-semibold">Contratos Finalizados</span>
              <h3 className="text-xl md:text-2xl font-black text-primary-theme mt-1">{paidCount}</h3>
            </div>
          </div>
        
          <h3 className="text-sm font-extrabold text-primary-theme mb-4">Controle de Frota Sincronizado</h3>
        
        {/* Mobile View: Cards (Visible only on mobile/tablet) */}
        <div className="block sm:hidden space-y-4">
          {rentals.map((r, idx) => {
            const config = statusConfig[r.status] || statusConfig.pending;
            return (
              <div 
                key={r.id || idx} 
                className="bg-card-theme border border-theme rounded-2xl p-4 flex flex-col gap-3"
              >
                {/* Card Header: Vehicle + Status */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs md:text-sm font-extrabold text-primary-theme">{r.vehicle_info}</h4>
                    <p className="text-[10px] text-secondary-theme mt-0.5">Devolução: {new Date(r.due_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-1 rounded-full font-bold ${config.c} ${config.bg}`}>
                    {config.l}
                  </span>
                </div>

                {/* Card Details: Payer + Value */}
                <div className="grid grid-cols-2 gap-2 border-y border-theme py-3">
                  <div>
                    <span className="text-[9px] text-secondary-theme font-bold uppercase block">Locatário</span>
                    <p className="text-xs font-semibold text-primary-theme mt-0.5">{r.client_name}</p>
                    <span className="text-[10px] text-muted-theme">{r.client_phone}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-secondary-theme font-bold uppercase block">Aluguel</span>
                    <p className="text-xs font-bold text-primary-theme mt-0.5">R$ {Number(r.amount).toFixed(2)}</p>
                    <p className="text-[9px] text-secondary-theme mt-0.5">Caução: R$ {Number(r.deposit_amount || 0).toFixed(2)}</p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleOpenContract(r)}
                    className="flex-1 min-w-[80px] btn-premium btn-premium-secondary text-[10px]"
                  >
                    <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> Contrato
                  </button>
                  {r.status !== 'paid' && (
                    <button 
                      onClick={() => triggerAlert('diaria', r)}
                      className="flex-1 min-w-[80px] btn-premium btn-premium-primary text-[10px]"
                    >
                      <svg className="w-3.5 h-3.5 inline mr-1 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg> Cobrar Pix
                    </button>
                  )}
                  {r.status !== 'paid' && (
                    <button 
                      onClick={() => triggerAlert('return', r)}
                      className="flex-1 min-w-[80px] btn-premium bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px]"
                    >
                      <svg className="w-3.5 h-3.5 inline mr-1 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a9.041 9.041 0 01-3.714 0M17.5 17.5a9 9 0 01-11 0m11 0V9a7.5 7.5 0 00-15 0v8.5m15 0h-15" /></svg> Retorno
                    </button>
                  )}
                  
                  {/* Return Confirmation Button (Item 3) */}
                  {r.status !== 'paid' && (
                    <button 
                      onClick={() => handleConfirmReturn(r)}
                      className="flex-1 min-w-[80px] btn-premium bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px]"
                    >
                      <svg className="w-3.5 h-3.5 inline mr-1 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Receber Carro
                    </button>
                  )}

                  {/* Refund Deposit Button (Item 2) */}
                  {r.status === 'paid' && r.deposit_amount > 0 && (
                    <button 
                      onClick={() => handleRefundDeposit(r)}
                      className="flex-1 min-w-[80px] btn-premium bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px]"
                    >
                      <svg className="w-3.5 h-3.5 inline mr-1 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg> Devolver Caução
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Table (Hidden on mobile) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-theme">
                <th className="pb-3 text-xs text-secondary-theme font-bold uppercase tracking-wider">Veículo</th>
                <th className="pb-3 text-xs text-secondary-theme font-bold uppercase tracking-wider">Locatário</th>
                <th className="pb-3 text-xs text-secondary-theme font-bold uppercase tracking-wider">Valor Aluguel</th>
                <th className="pb-3 text-xs text-secondary-theme font-bold uppercase tracking-wider">Devolução</th>
                <th className="pb-3 text-xs text-secondary-theme font-bold uppercase tracking-wider">Status</th>
                <th className="pb-3 text-xs text-secondary-theme font-bold uppercase tracking-wider text-center">Contrato</th>
                <th className="pb-3 text-xs text-secondary-theme font-bold uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rentals.map((r, idx) => {
                const config = statusConfig[r.status] || statusConfig.pending;
                return (
                  <tr key={r.id || idx} className="hover:bg-card-theme transition-colors">
                    <td className="py-4 text-xs md:text-sm font-extrabold text-primary-theme">{r.vehicle_info}</td>
                    <td className="py-4 text-xs md:text-sm text-primary-theme">
                      <p className="font-semibold">{r.client_name}</p>
                      <span className="text-[10px] text-muted-theme">{r.client_phone}</span>
                    </td>
                    <td className="py-4 text-xs md:text-sm text-primary-theme">
                      <p className="font-bold text-primary-theme">R$ {Number(r.amount).toFixed(2)}</p>
                      <p className="text-[10px] text-secondary-theme">Caução: R$ {Number(r.deposit_amount || 0).toFixed(2)}</p>
                      <span className="text-[9px] text-emerald-400 font-medium">{recurrenceConfig[r.recurrence] || 'Recorrente'}</span>
                    </td>
                    <td className="py-4 text-xs md:text-sm text-primary-theme">
                      {new Date(r.due_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${config.c} ${config.bg}`}>
                        {config.l}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <button 
                        onClick={() => handleOpenContract(r)}
                        className="btn-premium btn-premium-secondary !min-h-[32px] !py-1 text-[11px]"
                      >
                        Ver Contrato
                      </button>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {r.status !== 'paid' && (
                          <button 
                            onClick={() => triggerAlert('diaria', r)}
                            title="Cobrar Valor no WhatsApp"
                            className="btn-premium btn-premium-primary !min-h-[32px] !py-1 text-[11px]"
                          >
                            Cobrar
                          </button>
                        )}
                        {r.status !== 'paid' && (
                          <button 
                            onClick={() => triggerAlert('return', r)}
                            title="Notificar Prazo de Devolução"
                            className="btn-premium bg-blue-500/10 border border-blue-500/20 text-blue-400 !min-h-[32px] !py-1 text-[11px]"
                          >
                            Retorno
                          </button>
                        )}
                        {r.status !== 'paid' && (
                          <button 
                            onClick={() => handleConfirmReturn(r)}
                            title="Confirmar devolução do carro e liquidar"
                            className="btn-premium bg-blue-500/20 border border-blue-500/30 text-blue-300 !min-h-[32px] !py-1 text-[11px]"
                          >
                            Devolver
                          </button>
                        )}
                        {r.status === 'paid' && r.deposit_amount > 0 && (
                          <button 
                            onClick={() => handleRefundDeposit(r)}
                            title="Restituir o depósito de caução locatício"
                            className="btn-premium bg-amber-500/20 border border-amber-500/30 text-amber-400 !min-h-[32px] !py-1 text-[11px]"
                          >
                            Caução
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
        </>
      )}
      {activeTab === 'fines' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-secondary-theme uppercase tracking-wider">
              Gestão de Multas de Trânsito
            </span>
            <button 
              onClick={() => setShowFineModal(true)}
              className="btn-premium btn-premium-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 mr-1 inline-block align-middle">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="align-middle">Lançar Multa</span>
            </button>
          </div>

          {finesLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-muted-theme font-semibold">Buscando infrações de trânsito...</p>
            </div>
          ) : fines.length === 0 ? (
            <div className="card-premium border-dashed p-8 text-center flex flex-col items-center justify-center">
              <svg className="w-8 h-8 text-muted-theme mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              <h4 className="text-sm font-extrabold text-primary-theme mb-1">Nenhuma multa registrada</h4>
              <p className="text-xs text-secondary-theme max-w-sm leading-relaxed">Lançando multas na data e hora da infração, a Catarina localiza automaticamente o motorista correspondente de forma transparente.</p>
              <button 
                onClick={() => setShowFineModal(true)}
                className="btn-premium btn-premium-primary mt-4"
              >
                Lançar Primeira Multa
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fines.map(f => {
                const markupAmount = f.amount * 1.20; // 20% mark-up
                return (
                  <div key={f.id} className="card-premium p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs md:text-sm font-extrabold text-primary-theme"><svg className="w-4 h-4 text-amber-500 inline mr-1 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> {f.description}</h4>
                        <p className="text-[10px] text-primary-theme mt-1"><strong>Carro:</strong> {f.model} • {f.plate}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold whitespace-nowrap">
                        +{f.points} PTS CNH
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs text-primary-theme border-t border-theme pt-3">
                      <p><strong>Data Infração:</strong> {new Date(f.infraction_date).toLocaleString('pt-BR')}</p>
                      <p><strong>Valor Nominal:</strong> R$ {f.amount?.toFixed(2)}</p>
                      <p className="text-emerald-400"><strong>Reembolso (+20%):</strong> R$ {markupAmount?.toFixed(2)}</p>
                      <p className={`font-medium ${f.client_name ? 'text-primary-theme' : 'text-muted-theme'}`}>
                        <strong>Motorista:</strong> {f.client_name || 'Não localizado pela data'}
                      </p>
                    </div>

                    <div className="flex justify-between items-center border-t border-theme pt-3 mt-auto">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        f.driver_indicated ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                      }`}>
                        {f.driver_indicated ? 'Condutor Indicado' : 'Aguardando Indicação'}
                      </span>

                      <div className="flex gap-2">
                        {f.client_name && !f.driver_indicated && (
                          <button 
                            onClick={() => handleConfirmFineIndication(f.id)}
                            className="btn-premium btn-premium-primary !min-h-[30px] !py-1 text-[10px]"
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
                            className="btn-premium btn-premium-secondary !min-h-[30px] !py-1 text-[10px] text-emerald-400 border-emerald-500/20"
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
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-secondary-theme uppercase tracking-wider">
              Contas de Caução em Custódia
            </span>
            <button 
              onClick={() => {
                setEscrowForm({ contract_id: '', amount: '', type: 'deposit', notes: '' });
                setShowEscrowModal(true);
              }}
              className="btn-premium btn-premium-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 mr-1 inline-block align-middle">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="align-middle">Lançar Movimentação</span>
            </button>
          </div>

          {escrowsLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-muted-theme font-semibold">Buscando saldos de caução...</p>
            </div>
          ) : escrows.length === 0 ? (
            <div className="card-premium border-dashed p-8 text-center flex flex-col items-center justify-center">
              <svg className="w-8 h-8 text-muted-theme mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
              <h4 className="text-sm font-extrabold text-primary-theme mb-1">Nenhum depósito de caução registrado</h4>
              <p className="text-xs text-secondary-theme max-w-sm leading-relaxed">A caução é amortizada e retida automaticamente de acordo com as locações configuradas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {escrows.map(e => {
                const pct = Math.min(100, Math.max(0, (e.balance_paid / e.total_target_amount) * 100));
                return (
                  <div key={e.id} className="card-premium p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs md:text-sm font-extrabold text-primary-theme"><svg className="w-4 h-4 text-secondary-theme inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> {e.client_name}</h4>
                        <p className="text-[10px] text-secondary-theme mt-1"><svg className="w-3.5 h-3.5 text-secondary-theme inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg> {e.vehicle_model} • {e.vehicle_plate}</p>
                      </div>
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold ${
                        e.status === 'fully_paid' ? 'text-emerald-400 bg-emerald-500/10' : e.status === 'refunded' ? 'text-secondary-theme bg-card-theme' : 'text-amber-400 bg-amber-500/10'
                      }`}>
                        {e.status === 'fully_paid' ? 'Quitado' : e.status === 'refunded' ? 'Restituído' : 'Em Amortização'}
                      </span>
                    </div>

                    <div className="border-t border-theme pt-3 flex flex-col gap-2">
                      <div className="flex justify-between text-xs text-primary-theme">
                        <span>Acumulado:</span>
                        <span className="font-bold">R$ {Number(e.balance_paid).toFixed(2)} / R$ {Number(e.total_target_amount).toFixed(2)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-card-theme rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="flex gap-2 border-t border-theme pt-3 mt-auto">
                      <button 
                        onClick={() => {
                          setEscrowForm({ contract_id: e.contract_id, amount: '', type: 'withdraw', notes: 'Abatimento por Avaria' });
                          setShowEscrowModal(true);
                        }}
                        className="btn-premium btn-premium-secondary flex-1 !min-h-[32px] !py-1 text-[10px] text-rose-400 border-rose-500/20"
                      >
                        <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.67 2.67 0 0021 17.25l-5.83-5.83m-3.75 3.75a3.75 3.75 0 01-3.75-3.75M11.42 15.17l-1.2-1.2A3.75 3.75 0 009 11.42l-1.2-1.2m0 0A3.75 3.75 0 019 7.92M7.8 7.82l-5.83 5.83A2.67 2.67 0 005.72 17.4l5.83-5.83" /></svg> Descontar Avaria
                      </button>
                      <button 
                        onClick={() => {
                          setEscrowForm({ contract_id: e.contract_id, amount: e.balance_paid, type: 'refund', notes: 'Restituição de Caução' });
                          setShowEscrowModal(true);
                        }}
                        className="btn-premium btn-premium-secondary flex-1 !min-h-[32px] !py-1 text-[10px] text-sky-400 border-sky-500/20"
                      >
                        Devolver Caução
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
        <div className="flex flex-col gap-4">
          <span className="text-xs font-bold text-secondary-theme uppercase tracking-wider mb-2">
            Repasse de Comissão e Splits de Faturamento
          </span>

          {payoutsLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-muted-theme font-semibold">Calculando repasses de parceiros...</p>
            </div>
          ) : payouts.length === 0 ? (
            <div className="card-premium border-dashed p-8 text-center flex flex-col items-center justify-center">
              <svg className="w-8 h-8 text-muted-theme mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" /></svg>
              <h4 className="text-sm font-extrabold text-primary-theme mb-1">Nenhum veículo de investidor ativo</h4>
              <p className="text-xs text-secondary-theme max-w-sm leading-relaxed">Insira o nome do investidor no cadastro do carro para habilitar o cálculo automático de divisão de faturamento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {payouts.map(p => (
                <div key={p.vehicle_id} className="card-premium p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs md:text-sm font-extrabold text-primary-theme"><svg className="w-4 h-4 text-emerald-400 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" /></svg> Investidor: {p.investor_name}</h4>
                      <p className="text-[10px] text-secondary-theme mt-1"><svg className="w-3.5 h-3.5 text-secondary-theme inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg> {p.model} • {p.plate}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-bold whitespace-nowrap">
                      Split {p.investor_split_rate}%
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 text-xs text-primary-theme border-t border-theme pt-3">
                    <div className="flex justify-between">
                      <span className="text-secondary-theme">Receita Bruta:</span>
                      <span className="font-bold text-primary-theme">R$ {p.gross_revenue?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-theme">Despesas Oficina:</span>
                      <span className="font-bold text-rose-400">-{p.maintenance_cost?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-theme">Comissão Admin ({100 - p.investor_split_rate}%):</span>
                      <span className="font-bold text-primary-theme">R$ {p.admin_commission?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-theme pt-2 text-emerald-400 font-black">
                      <span>Líquido Repassar:</span>
                      <span>R$ {p.net_repasse?.toFixed(2)}</span>
                    </div>
                  </div>

                  {p.last_payout_at && (
                    <p className="text-[9px] text-muted-theme">
                      Último repasse: {new Date(p.last_payout_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}

                  {p.net_repasse > 0 && (
                    <button 
                      onClick={() => handleConfirmPayout(p.vehicle_id, p.net_repasse, p.investor_name)}
                      className="btn-premium btn-premium-primary w-full mt-2"
                    >
                      <svg className="w-3.5 h-3.5 inline mr-1 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg> Confirmar Repasse
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
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm backdrop-blur-sm z-[1000] flex justify-center items-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-modal-theme border border-theme rounded-3xl p-6 shadow-2xl animate-scaleIn flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-primary-theme"><svg className="w-4 h-4 text-emerald-400 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg> Movimentação de Caução</h3>
              <button onClick={() => setShowEscrowModal(false)} className="text-muted-theme hover:text-primary-theme text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleEscrowTransaction} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Contrato de Locação</label>
                <select
                  required
                  value={escrowForm.contract_id}
                  onChange={e => setEscrowForm(prev => ({ ...prev, contract_id: e.target.value }))}
                  className="input-premium w-full cursor-pointer bg-input-theme"
                >
                  <option value="">Selecione o motorista...</option>
                  {escrows.map(e => (
                    <option key={e.id} value={e.contract_id}>{e.client_name} - {e.vehicle_plate}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={escrowForm.amount}
                    onChange={e => setEscrowForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Tipo</label>
                  <select
                    value={escrowForm.type}
                    onChange={e => setEscrowForm(prev => ({ ...prev, type: e.target.value }))}
                    className="input-premium w-full cursor-pointer bg-input-theme"
                  >
                    <option value="deposit">Aporte (Depósito)</option>
                    <option value="withdraw">Abatimento (Dano/Multa)</option>
                    <option value="refund">Restituição (Devolver)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Descrição / Justificativa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aporte semanal de caução"
                  value={escrowForm.notes}
                  onChange={e => setEscrowForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="input-premium w-full"
                />
              </div>

              <button
                type="submit"
                className="btn-premium btn-premium-primary w-full mt-2"
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
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm backdrop-blur-sm z-[1000] flex justify-center items-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-modal-theme border border-theme rounded-3xl p-6 shadow-2xl animate-scaleIn flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-base md:text-lg font-black text-primary-theme flex items-center gap-2"><svg className="w-5 h-5 text-emerald-400 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg> Configurar Nova Locação de Frota</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-muted-theme hover:text-primary-theme text-lg cursor-pointer ml-auto"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterRental} className="flex flex-col gap-4">
              
              {/* Lessee info */}
              <div>
                <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Nome do Locatário (Cliente)</label>
                <input 
                  type="text" 
                  value={form.clientName} 
                  onChange={e => setForm({...form, clientName: e.target.value})} 
                  placeholder="Nome do cliente" 
                  className="input-premium w-full"
                  required 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">CPF ou CNPJ do Locatário</label>
                  <input 
                     type="text" 
                     value={form.clientDocument} 
                     onChange={e => setForm({...form, clientDocument: e.target.value})} 
                     placeholder="000.000.000-00" 
                     className="input-premium w-full"
                     required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">WhatsApp Locatário</label>
                  <input 
                    type="tel" 
                    value={form.clientPhone} 
                    onChange={e => setForm({...form, clientPhone: e.target.value})} 
                    placeholder="(11) 99999-9999" 
                    className="input-premium w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">E-mail corporativo (opcional)</label>
                <input 
                  type="email" 
                  value={form.clientEmail} 
                  onChange={e => setForm({...form, clientEmail: e.target.value})} 
                  placeholder="email@cliente.com" 
                  className="input-premium w-full"
                />
              </div>

              {/* Seleção de Veículo Disponível na Frota */}
              <div>
                <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Selecionar Carro da Frota (Disponíveis)</label>
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
                  className="input-premium w-full cursor-pointer bg-input-theme"
                >
                  <option value="">-- Cadastrar veículo avulso (digitar abaixo) --</option>
                  {vehicles.filter(v => v.status === 'available').map(v => (
                    <option key={v.id} value={v.id}>{v.model} - {v.plate} ({v.color})</option>
                  ))}
                </select>
              </div>

              {/* Vehicle Detail */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Modelo do Veículo</label>
                  <input 
                    type="text" 
                    value={form.vehicleModel} 
                    onChange={e => setForm({...form, vehicleModel: e.target.value})} 
                    placeholder="Ex: Chevrolet Onix" 
                    className="input-premium w-full"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Placa</label>
                  <input 
                    type="text" 
                    value={form.vehiclePlate} 
                    onChange={e => setForm({...form, vehiclePlate: e.target.value})} 
                    placeholder="ABC-1234" 
                    className="input-premium w-full"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Cor</label>
                  <input 
                    type="text" 
                    value={form.vehicleColor} 
                    onChange={e => setForm({...form, vehicleColor: e.target.value})} 
                    placeholder="Ex: Prata" 
                    className="input-premium w-full"
                  />
                </div>
              </div>

              {/* Recurrence Selection, Pricing and Deposit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Periodicidade</label>
                  <select 
                    value={form.recurrence} 
                    onChange={e => setForm({...form, recurrence: e.target.value})}
                    className="input-premium w-full cursor-pointer bg-input-theme"
                  >
                    <option value="once">Diária Única</option>
                    <option value="daily">Cobrança Diária</option>
                    <option value="weekly">Cobrança Semanal</option>
                    <option value="monthly">Cobrança Mensal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Valor (R$)</label>
                  <input 
                    type="number" 
                    value={form.amount} 
                    onChange={e => setForm({...form, amount: e.target.value})} 
                    placeholder="Ex: 450.00" 
                    className="input-premium w-full"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Caução (R$)</label>
                  <input 
                    type="number" 
                    value={form.depositAmount} 
                    onChange={e => setForm({...form, depositAmount: e.target.value})} 
                    placeholder="Ex: 1000.00" 
                    className="input-premium w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Data Limite de Devolução</label>
                <input 
                  type="date" 
                  value={form.dueDate} 
                  onChange={e => setForm({...form, dueDate: e.target.value})} 
                  className="input-premium w-full"
                  required 
                />
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn-premium btn-premium-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-premium btn-premium-primary"
                >
                  Cadastrar Locação
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Contract Viewer Modal */}
      {showContractModal && activeContract && (
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm backdrop-blur-sm z-[1000] flex justify-center items-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-modal-theme border border-theme rounded-3xl p-6 shadow-2xl animate-scaleIn flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                <h3 className="text-sm font-extrabold text-primary-theme">
                  Contrato de Locação — {activeContract.client_name}
                </h3>
              </div>
              <button 
                onClick={() => setShowContractModal(false)}
                className="text-muted-theme hover:text-primary-theme text-lg cursor-pointer ml-auto"
              >
                ✕
              </button>
            </div>

            {/* AI Warning / Prompt Notice */}
            <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-2xl p-4 flex gap-3 items-start animate-fadeInUp">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>
              <div className="text-xs text-emerald-200/80 leading-relaxed">
                <strong>Contrato Mutável por Inteligência Artificial!</strong><br />
                Este contrato foi auto-gerado sob rigor jurídico e favorável ao locador. Quer customizar as cláusulas, adicionar limite de quilometragem ou alterar valores? <strong>Basta abrir o Chatbot da Catarina AI</strong> e dizer: <em>"Catarina, mude o contrato de locação do veículo de {activeContract.client_name} para incluir..."</em>. Ela atualizará o text eletrônico imediatamente no seu painel!
              </div>
            </div>

            {/* Scrollable Contract Box */}
            <div className="flex-1 overflow-y-auto bg-input-theme border border-theme rounded-2xl p-4 font-mono text-[11px] text-primary-theme whitespace-pre-wrap leading-relaxed shadow-inner max-h-[40vh]">
              {activeContract.contract_text || 'Gerando contrato...'}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end border-t border-theme pt-4">
              <button 
                onClick={copyContractText}
                className="btn-premium btn-premium-secondary"
              >
                <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0A2.25 2.25 0 0113.5 4.5h-3a2.25 2.25 0 01-2.166-1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m1.104 2.168h3c.125 0 .248-.005.37-.016a2.25 2.25 0 01-2.166 1.638h-3a2.25 2.25 0 01-2.166-1.638z" /></svg> Copiar Texto
              </button>
              <button 
                onClick={printContractText}
                className="btn-premium bg-blue-500/10 border border-blue-500/20 text-blue-400"
              >
                <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0a2.25 2.25 0 01-2.24 2.24H8.58A2.25 2.25 0 016.34 18m11.318-3.096A19.571 19.571 0 0019.5 12a19.571 19.571 0 00-1.842-2.904M6.34 18a19.507 19.507 0 01-1.84-2.904m0 0A19.56 19.56 0 013 12c0-3.322 1.66-6.257 4.2-8.242M18.75 10.5h.008v.008h-.008V10.5z" /></svg> Imprimir PDF
              </button>
              <button 
                onClick={() => setShowContractModal(false)}
                className="btn-premium btn-premium-primary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Pairing Modal */}
      {showWaPairModal && (
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm backdrop-blur-sm z-[1000] flex justify-center items-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-modal-theme border border-theme rounded-3xl p-6 shadow-2xl animate-scaleIn flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-primary-theme flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg> Conectar Seu WhatsApp
              </h3>
              <button 
                onClick={() => setShowWaPairModal(false)}
                className="text-muted-theme hover:text-primary-theme text-lg cursor-pointer ml-auto"
              >
                ✕
              </button>
            </div>

            {whatsappStatus === 'connecting' && (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
                <p className="text-xs font-extrabold text-primary-theme">Gerando Sessão de WhatsApp...</p>
                <p className="text-[11px] text-muted-theme mt-1">Conectando com o servidor de mensagens. Aguarde alguns instantes.</p>
              </div>
            )}

            {whatsappStatus === 'scanning' && (
              <div className="flex flex-col gap-4">
                <div className="bg-card-theme rounded-2xl p-4 border border-theme">
                  <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-3">Como parear:</h4>
                  <div className="flex flex-col gap-2.5 text-xs text-primary-theme">
                    <div className="flex gap-2 items-start">
                      <span className="bg-emerald-500 text-slate-950 w-4 h-4 rounded-full inline-flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5">1</span>
                      <span>Abra o <strong>WhatsApp</strong> no seu celular.</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="bg-emerald-500 text-slate-950 w-4 h-4 rounded-full inline-flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5">2</span>
                      <span>Acesse <strong>Aparelhos Conectados</strong> e clique em <strong>Conectar um Aparelho</strong>.</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="bg-emerald-500 text-slate-950 w-4 h-4 rounded-full inline-flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5">3</span>
                      <span>Aponte a câmera para o QR Code abaixo:</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center my-2">
                  <div className="bg-white p-3 rounded-2xl border-4 border-emerald-500 inline-block">
                    {whatsappQrCode ? (
                      <img src={whatsappQrCode} alt="WhatsApp QR Code" className="w-[180px] h-[180px] block" />
                    ) : waError ? (
                      <div className="w-[180px] h-[180px] flex flex-col items-center justify-center bg-rose-50 rounded-xl p-3">
                        <svg className="w-6 h-6 text-amber-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                        <span className="text-[10px] font-bold text-rose-800 text-center leading-normal">{waError}</span>
                      </div>
                    ) : (
                      <div className="w-[180px] h-[180px] flex flex-col items-center justify-center bg-input-theme rounded-xl">
                        <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
                        <span className="text-[10px] text-slate-600 font-bold">Obtendo QR Code...</span>
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
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm backdrop-blur-sm z-[1000] flex justify-center items-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-modal-theme border border-theme rounded-3xl p-6 shadow-2xl animate-scaleIn flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-sm md:text-base font-extrabold text-primary-theme flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg> Cadastrar Carro na Frota
              </h3>
              <button 
                onClick={() => setShowVehicleModal(false)}
                className="text-muted-theme hover:text-primary-theme text-lg cursor-pointer ml-auto"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterVehicle} className="flex flex-col gap-4">
              
              {/* Vehicle basic data */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Modelo do Veículo *</label>
                  <input 
                    type="text" 
                    value={vehicleForm.model} 
                    onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} 
                    placeholder="Ex: Fiat Uno 1.0" 
                    className="input-premium w-full"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Placa *</label>
                  <input 
                    type="text" 
                    value={vehicleForm.plate} 
                    onChange={e => setVehicleForm({...vehicleForm, plate: e.target.value})} 
                    placeholder="ABC1D23" 
                    className="input-premium w-full"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Cor *</label>
                  <input 
                    type="text" 
                    value={vehicleForm.color} 
                    onChange={e => setVehicleForm({...vehicleForm, color: e.target.value})} 
                    placeholder="Branco" 
                    className="input-premium w-full"
                    required 
                  />
                </div>
              </div>

              {/* Technical detail */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Ano Modelo</label>
                  <input 
                    type="number" 
                    value={vehicleForm.year} 
                    onChange={e => setVehicleForm({...vehicleForm, year: e.target.value})} 
                    placeholder="2020" 
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">KM Atual Inicial</label>
                  <input 
                    type="number" 
                    value={vehicleForm.current_km} 
                    onChange={e => setVehicleForm({...vehicleForm, current_km: e.target.value})} 
                    placeholder="45000" 
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Troca Óleo (KM)</label>
                  <input 
                    type="number" 
                    value={vehicleForm.oil_change_interval_km} 
                    onChange={e => setVehicleForm({...vehicleForm, oil_change_interval_km: e.target.value})} 
                    placeholder="10000" 
                    className="input-premium w-full"
                  />
                </div>
              </div>

              {/* Legal data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Código Renavam</label>
                  <input 
                    type="text" 
                    value={vehicleForm.renavam} 
                    onChange={e => setVehicleForm({...vehicleForm, renavam: e.target.value})} 
                    placeholder="01234567890" 
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Número do Chassi</label>
                  <input 
                    type="text" 
                    value={vehicleForm.chassis} 
                    onChange={e => setVehicleForm({...vehicleForm, chassis: e.target.value})} 
                    placeholder="9BDXXXXXX..." 
                    className="input-premium w-full"
                  />
                </div>
              </div>

              {/* Insurance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Apólice do Seguro</label>
                  <input 
                    type="text" 
                    value={vehicleForm.insurance_policy} 
                    onChange={e => setVehicleForm({...vehicleForm, insurance_policy: e.target.value})} 
                    placeholder="Porto Seguro - Apólice 12345" 
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Vencimento Seguro</label>
                  <input 
                    type="date" 
                    value={vehicleForm.insurance_expires_at} 
                    onChange={e => setVehicleForm({...vehicleForm, insurance_expires_at: e.target.value})} 
                    className="input-premium w-full bg-input-theme"
                  />
                </div>
              </div>

              {/* Investor data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Investidor Dono do Carro</label>
                  <input 
                    type="text" 
                    value={vehicleForm.investor_name} 
                    onChange={e => setVehicleForm({...vehicleForm, investor_name: e.target.value})} 
                    placeholder="Ex: Tio Carlos" 
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Split Investidor (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={vehicleForm.investor_split_rate} 
                    onChange={e => setVehicleForm({...vehicleForm, investor_split_rate: e.target.value})} 
                    placeholder="80.0" 
                    className="input-premium w-full"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowVehicleModal(false)}
                  className="btn-premium btn-premium-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-premium btn-premium-primary shadow-lg shadow-emerald-500/10"
                >
                  Salvar Carro
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Vehicle Profile & Documents Modal */}
      {showProfileModal && selectedProfileVehicle && (
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm backdrop-blur-sm z-[1000] flex justify-center items-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-modal-theme border border-theme rounded-3xl p-6 shadow-2xl animate-scaleIn flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-theme pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                <h3 className="text-sm md:text-base font-extrabold text-primary-theme">
                  Perfil do Veículo: {selectedProfileVehicle.model} ({selectedProfileVehicle.plate})
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowProfileModal(false);
                  setSelectedProfileVehicle(null);
                }}
                className="text-muted-theme hover:text-primary-theme text-lg cursor-pointer ml-auto"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Timeline History */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-bold text-secondary-theme uppercase tracking-wider"><svg className="w-3.5 h-3.5 text-emerald-400 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" /></svg> Histórico de Utilização & Oficina</h4>
                <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-none">
                  {profileTimeline.length === 0 ? (
                    <p className="text-xs text-muted-theme font-semibold italic">Nenhum evento registrado no histórico.</p>
                  ) : (
                    profileTimeline.map((evt, idx) => (
                      <div key={idx} className="bg-card-theme border border-theme rounded-2xl p-3 text-xs">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className={`font-bold ${evt.type === 'maintenance' ? 'text-amber-400' : evt.type === 'fine' ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {evt.title}
                          </span>
                          <span className="text-[10px] text-muted-theme font-semibold">
                            {new Date(evt.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="margin-0 text-primary-theme leading-relaxed text-[11px]">{evt.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Attached PDF Documents */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-bold text-secondary-theme uppercase tracking-wider"><svg className="w-3.5 h-3.5 text-emerald-400 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> Anexos & Documentos (PDF)</h4>
                
                {/* Upload Button */}
                <div className="border border-dashed border-white/10 hover:border-emerald-500/30 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 bg-card-theme transition-colors cursor-pointer relative group">
                  <svg className="w-5 h-5 text-secondary-theme inline group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  <label className={`text-xs font-bold text-emerald-400 cursor-pointer ${uploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploadingDoc ? 'Enviando documento...' : 'Clique para carregar novo PDF'}
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      className="hidden" 
                      disabled={uploadingDoc}
                      onChange={handleUploadDocument} 
                    />
                  </label>
                  <span className="text-[9px] text-muted-theme font-semibold text-center">Orçamentos de oficina, vistorias ou contratos</span>
                </div>

                {/* List of PDFs */}
                <div className="flex flex-col gap-2.5 max-h-[180px] overflow-y-auto pr-1 scrollbar-none">
                  {profileDocs.length === 0 ? (
                    <p className="text-xs text-muted-theme font-semibold italic text-center py-4">Nenhum documento PDF anexado ainda.</p>
                  ) : (
                    profileDocs.map(doc => (
                      <div key={doc.id} className="flex justify-between items-center bg-card-theme border border-theme rounded-2xl p-3 text-xs">
                        <span className="text-primary-theme font-medium truncate max-w-[65%]" title={doc.name}>
                          <svg className="w-3 h-3 text-muted-theme inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> {doc.name}
                        </span>
                        <button 
                          onClick={() => handleDownloadDocument(doc.id, doc.name)}
                          className="btn-premium btn-premium-primary !min-h-[28px] !py-0.5 text-[10px] shadow-sm"
                        >
                          Baixar PDF
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-theme pt-3">
              <button 
                onClick={() => {
                  setShowProfileModal(false);
                  setSelectedProfileVehicle(null);
                }}
                className="btn-premium btn-premium-secondary"
              >
                Fechar Perfil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lançar Nova Multa Modal */}
      {showFineModal && (
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm backdrop-blur-sm z-[1000] flex justify-center items-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-modal-theme border border-theme rounded-3xl p-6 shadow-2xl animate-scaleIn flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-primary-theme flex items-center gap-2">
                <svg className="w-5 h-5 text-rose-400 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> Lançar Nova Multa de Trânsito
              </h3>
              <button 
                onClick={() => setShowFineModal(false)}
                className="text-muted-theme hover:text-primary-theme text-lg cursor-pointer ml-auto"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterFine} className="flex flex-col gap-4">
              
              <div>
                <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Selecionar Veículo *</label>
                <select 
                  value={fineForm.vehicle_id}
                  onChange={e => setFineForm({...fineForm, vehicle_id: e.target.value})}
                  className="input-premium w-full cursor-pointer bg-input-theme"
                  required
                >
                  <option value="">-- Escolha o veículo autuado --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.model} - {v.plate}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Data & Hora da Infração *</label>
                  <input 
                    type="datetime-local" 
                    value={fineForm.infraction_date}
                    onChange={e => setFineForm({...fineForm, infraction_date: e.target.value})}
                    className="input-premium w-full bg-input-theme"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Pontos na CNH *</label>
                  <input 
                    type="number" 
                    value={fineForm.points}
                    onChange={e => setFineForm({...fineForm, points: e.target.value})}
                    placeholder="4" 
                    className="input-premium w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Descrição da Infração *</label>
                <input 
                  type="text" 
                  value={fineForm.description}
                  onChange={e => setFineForm({...fineForm, description: e.target.value})}
                  placeholder="Ex: Velocidade superior à máxima em até 20%" 
                  className="input-premium w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Valor Nominal (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={fineForm.amount}
                  onChange={e => setFineForm({...fineForm, amount: e.target.value})}
                  placeholder="130.16" 
                  className="input-premium w-full"
                  required
                />
                <span className="text-[10px] text-emerald-400 leading-normal block mt-2 font-medium">
                  <svg className="w-3.5 h-3.5 text-amber-500 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg> O sistema aplicará a taxa de 20% de comissão e gerará o reembolso Pix para o condutor ativo.
                </span>
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowFineModal(false)}
                  className="btn-premium btn-premium-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-premium btn-premium-primary shadow-lg shadow-emerald-500/10"
                >
                  Confirmar Autuação
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Editable Whatsapp Message Modal */}
      {showFineWaModal && (
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm backdrop-blur-sm z-[1000] flex justify-center items-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-modal-theme border border-emerald-500/20 rounded-3xl p-6 shadow-2xl animate-scaleIn flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-primary-theme flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 18l-.153-.055A5.978 5.978 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg> Personalizar Mensagem de WhatsApp
              </h3>
              <button 
                onClick={() => setShowFineWaModal(false)}
                className="text-muted-theme hover:text-primary-theme text-lg cursor-pointer ml-auto"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Revise e edite antes de enviar:</span>
              <textarea
                value={fineWaText}
                onChange={e => setFineWaText(e.target.value)}
                className="input-premium w-full h-[240px] bg-input-theme font-mono text-xs leading-relaxed p-3.5"
              />
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button 
                onClick={() => setShowFineWaModal(false)}
                className="btn-premium btn-premium-secondary"
              >
                Fechar
              </button>
              <button 
                onClick={() => {
                  const cleanPhone = fineMatchedClientPhone.replace(/\D/g, '');
                  const url = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(fineWaText)}`;
                  window.open(url, '_blank');
                  setShowFineWaModal(false);
                }}
                className="btn-premium bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold border-none shadow-lg shadow-emerald-500/20"
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
