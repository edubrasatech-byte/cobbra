'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VehiclesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [msg, setMsg] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [plateLoading, setPlateLoading] = useState(false);

  // Form states
  const [form, setForm] = useState({
    model: '', plate: '', color: '', year: '', renavam: '', chassis: '',
    current_km: '', oil_change_interval_km: '10000', insurance_policy: '',
    insurance_expires_at: '', investor_name: '', investor_split_rate: '',
    ipva_status: 'PAGO', licensing_status: 'EM DIA', licensing_expiration: ''
  });

  const [editForm, setEditForm] = useState({
    id: '', model: '', color: '', year: '', renavam: '', chassis: '',
    current_km: '', oil_change_interval_km: '10000', insurance_policy: '',
    insurance_expires_at: '', investor_name: '', investor_split_rate: '', status: '',
    ipva_status: 'PAGO', licensing_status: 'EM DIA', licensing_expiration: ''
  });

  useEffect(() => {
    fetchVehicles();
    
    // Check if the query parameter has action=new
    if (searchParams.get('action') === 'new') {
      setShowAddModal(true);
    }
  }, [searchParams]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/locacoes/vehicles');
      const data = await res.json();
      if (data.vehicles) setVehicles(data.vehicles);
    } catch (e) {
      showNotification('Erro ao carregar veículos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message) => {
    setMsg(message);
    setTimeout(() => setMsg(''), 4000);
  };

  const handlePlateLookup = async () => {
    if (!form.plate || form.plate.trim().length < 7) {
      alert('Por favor, informe uma placa válida com pelo menos 7 caracteres.');
      return;
    }
    setPlateLoading(true);
    try {
      const res = await fetch(`/api/locacoes/vehicles/plate/${form.plate.trim().toUpperCase()}`);
      const data = await res.json();
      if (res.ok && data.vehicle) {
        setForm(prev => ({
          ...prev,
          model: data.vehicle.model,
          color: data.vehicle.color,
          year: data.vehicle.year,
          chassis: data.vehicle.chassis,
          renavam: data.vehicle.renavam,
          ipva_status: data.vehicle.ipva_status,
          licensing_status: data.vehicle.licensing_status,
          licensing_expiration: data.vehicle.licensing_expiration
        }));
        showNotification('Placa consultada com sucesso! Dados preenchidos.');
      } else {
        alert(data.error || 'Placa não localizada. Por favor, preencha manualmente.');
      }
    } catch (err) {
      alert('Erro ao consultar placa.');
    } finally {
      setPlateLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.model || !form.plate || !form.color) {
      alert('Modelo, Placa e Cor são campos obrigatórios.');
      return;
    }

    try {
      const res = await fetch('/api/locacoes/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('Veículo cadastrado com sucesso!');
        setShowAddModal(false);
        setForm({
          model: '', plate: '', color: '', year: '', renavam: '', chassis: '',
          current_km: '', oil_change_interval_km: '10000', insurance_policy: '',
          insurance_expires_at: '', investor_name: '', investor_split_rate: '',
          ipva_status: 'PAGO', licensing_status: 'EM DIA', licensing_expiration: ''
        });
        fetchVehicles();
        // Remove query param
        router.push('/dashboard/veiculos');
      } else {
        alert(data.error || 'Erro ao cadastrar veículo.');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar veículo.');
    }
  };

  const handleEditClick = (v) => {
    setSelectedVehicle(v);
    setEditForm({
      id: v.id,
      model: v.model,
      color: v.color,
      year: v.year || '',
      renavam: v.renavam || '',
      chassis: v.chassis || '',
      current_km: v.current_km || '',
      oil_change_interval_km: v.oil_change_interval_km || '10000',
      insurance_policy: v.insurance_policy || '',
      insurance_expires_at: v.insurance_expires_at || '',
      investor_name: v.investor_name || '',
      investor_split_rate: v.investor_split_rate || '',
      status: v.status || 'available',
      ipva_status: v.ipva_status || 'PAGO',
      licensing_status: v.licensing_status || 'EM DIA',
      licensing_expiration: v.licensing_expiration || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/locacoes/vehicles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        showNotification('Veículo atualizado com sucesso!');
        setShowEditModal(false);
        fetchVehicles();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao atualizar veículo.');
      }
    } catch (err) {
      alert('Erro de conexão ao atualizar veículo.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente remover este veículo da frota?')) return;
    try {
      const res = await fetch(`/api/locacoes/vehicles?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Veículo removido.');
        fetchVehicles();
      } else {
        alert('Erro ao excluir veículo.');
      }
    } catch (e) {
      alert('Erro ao excluir.');
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.plate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const badges = {
      available: { label: 'Disponível', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      rented: { label: 'Alugado', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      maintenance: { label: 'Oficina', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      damaged: { label: 'Avaria', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
    };
    const b = badges[status] || { label: status, bg: 'bg-surface-theme text-primary-theme border-slate-700' };
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${b.bg}`}>{b.label}</span>;
  };

  return (
    <div className="min-h-screen text-primary-theme font-sans pb-12">
      {/* Header section */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg> Gestão da Frota
          </h1>
          <p className="text-xs text-muted-theme mt-1">Gerencie os veículos de locação, dados de seguro, manutenção e investidores</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/10 active:scale-95 transition-all select-none cursor-pointer"
        >
          + Adicionar Veículo
        </button>
      </div>

      {/* Floating Notification */}
      {msg && (
        <div className="fixed top-20 right-6 z-50 bg-card-theme border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-2 animate-bounce">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-xs font-bold">{msg}</span>
        </div>
      )}

      {/* Filters section */}
      <div className="flex flex-wrap md:flex-nowrap gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por placa ou modelo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-card-theme border border-theme rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none focus:border-emerald-500/40 placeholder-slate-600 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'available', 'rented', 'maintenance', 'damaged'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl border text-[10px] uppercase font-bold tracking-wider transition-colors ${
                statusFilter === st 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-transparent text-secondary-theme border-theme hover:border-theme'
              }`}
            >
              {st === 'all' ? 'Todos' : st === 'available' ? 'Disponíveis' : st === 'rented' ? 'Alugados' : st === 'maintenance' ? 'Oficina' : 'Avaria'}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
          <span className="text-xs text-muted-theme font-semibold">Carregando veículos da frota...</span>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-card-theme rounded-2xl border border-theme p-12 text-center">
          <svg className="w-10 h-10 text-muted-theme mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
          <h3 className="text-primary-theme font-bold text-sm">Nenhum veículo encontrado</h3>
          <p className="text-xs text-muted-theme mt-1">Comece cadastrando um carro com consulta inteligente de placa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredVehicles.map(v => {
            // Oil change health check
            const oilRemaining = Math.max(0, (v.last_oil_change_km || 0) + (v.oil_change_interval_km || 10000) - (v.current_km || 0));
            const oilPct = Math.min(100, Math.max(0, (oilRemaining / (v.oil_change_interval_km || 10000)) * 100));
            const isOilUrgent = oilRemaining < 1000;

            return (
              <div 
                key={v.id} 
                className="bg-card-theme rounded-2xl border border-theme relative overflow-hidden transition-all duration-300 hover:border-emerald-500/40 group hover:translate-y-[-2px] flex flex-col justify-between p-4 md:p-6"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-extrabold text-primary-theme tracking-tight text-base group-hover:text-emerald-400 transition-colors leading-tight">
                        {v.model}
                      </h3>
                      <p className="text-xs font-semibold text-secondary-theme uppercase tracking-widest mt-1">
                        Placa: <span className="bg-surface-theme border border-theme px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-400">{v.plate}</span>
                      </p>
                    </div>
                    {getStatusBadge(v.status)}
                  </div>

                  {/* Details summary */}
                  <div className="space-y-2.5 text-xs text-secondary-theme border-t border-theme pt-4 mb-4">
                    <div className="flex justify-between">
                      <span>Cor / Ano:</span>
                      <span className="text-primary-theme font-bold">{v.color} {v.year ? `| ${v.year}` : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quilometragem:</span>
                      <span className="text-primary-theme font-bold">{v.current_km?.toLocaleString('pt-BR') || 0} KM</span>
                    </div>
                    {v.investor_name && (
                      <div className="flex justify-between border-b border-theme pb-2">
                        <span>Investidor:</span>
                        <span className="text-emerald-400 font-bold">{v.investor_name} ({v.investor_split_rate || 80}%)</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-theme pt-2">
                      <span>Status IPVA:</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        v.ipva_status?.includes('PAGO') 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>{v.ipva_status || 'PAGO'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Licenciamento:</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        v.licensing_status === 'EM DIA' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>{v.licensing_status || 'EM DIA'}</span>
                    </div>
                    {v.licensing_expiration && (
                      <div className="flex justify-between">
                        <span>Vencimento Lic.:</span>
                        <span className="text-primary-theme font-mono font-bold">
                          {v.licensing_expiration.includes('-') 
                            ? v.licensing_expiration.split('-').reverse().join('/') 
                            : v.licensing_expiration}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Oil change warning bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase tracking-wider">
                      <span className="text-muted-theme">Troca de óleo em:</span>
                      <span className={isOilUrgent ? 'text-rose-400 animate-pulse' : 'text-secondary-theme'}>
                        {oilRemaining.toLocaleString('pt-BR')} KM
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-theme rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOilUrgent ? 'bg-rose-500' : oilPct < 30 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} 
                        style={{ width: `${oilPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-theme pt-4 mt-auto">
                  <button
                    onClick={() => handleEditClick(v)}
                    className="flex-1 py-2 rounded-xl bg-surface-theme hover:bg-card-hover-theme border border-theme text-primary-theme hover:text-primary-theme text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 text-xs font-bold transition-all cursor-pointer text-center"
                    title="Excluir Veículo"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-md backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowAddModal(false)}>
          <div className="bg-card-theme border border-theme rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative my-8" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-theme flex justify-between items-center">
              <h3 className="text-sm font-bold text-primary-theme"><svg className="w-4 h-4 text-emerald-400 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg> Cadastrar Novo Veículo</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-theme hover:text-primary-theme text-sm">✕</button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Placa (Mercosul ou Antiga)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ABC1D23 ou ABC1234"
                    value={form.plate}
                    onChange={e => setForm(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handlePlateLookup}
                    disabled={plateLoading}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-[#10B981] border border-emerald-500/30 hover:border-emerald-500/50 font-bold text-xs cursor-pointer disabled:opacity-50 transition-all select-none"
                  >
                    {plateLoading ? 'Consultando...' : '<svg className="w-3.5 h-3.5 text-emerald-400 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg> Puxar Placa'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Modelo / Versão</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fiat Uno 1.0"
                    value={form.model}
                    onChange={e => setForm(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Cor</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Branco"
                    value={form.color}
                    onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Ano</label>
                  <input
                    type="number"
                    placeholder="Ex: 2022"
                    value={form.year}
                    onChange={e => setForm(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Renavam</label>
                  <input
                    type="text"
                    placeholder="Apenas números"
                    value={form.renavam}
                    onChange={e => setForm(prev => ({ ...prev, renavam: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Chassi</label>
                  <input
                    type="text"
                    placeholder="Opcional"
                    value={form.chassis}
                    onChange={e => setForm(prev => ({ ...prev, chassis: e.target.value.toUpperCase() }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">KM Atual</label>
                  <input
                    type="number"
                    placeholder="Ex: 48500"
                    value={form.current_km}
                    onChange={e => setForm(prev => ({ ...prev, current_km: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Intervalo Troca Óleo (KM)</label>
                  <input
                    type="number"
                    value={form.oil_change_interval_km}
                    onChange={e => setForm(prev => ({ ...prev, oil_change_interval_km: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-theme pt-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Apólice do Seguro</label>
                  <input
                    type="text"
                    placeholder="Nº Apólice"
                    value={form.insurance_policy}
                    onChange={e => setForm(prev => ({ ...prev, insurance_policy: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Vencimento do Seguro</label>
                  <input
                    type="date"
                    value={form.insurance_expires_at}
                    onChange={e => setForm(prev => ({ ...prev, insurance_expires_at: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-theme pt-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Nome do Investidor (Split)</label>
                  <input
                    type="text"
                    placeholder="Caso o carro seja de investidor"
                    value={form.investor_name}
                    onChange={e => setForm(prev => ({ ...prev, investor_name: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Repasse Investidor (%)</label>
                  <input
                    type="number"
                    placeholder="Default: 80%"
                    value={form.investor_split_rate}
                    onChange={e => setForm(prev => ({ ...prev, investor_split_rate: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-theme pt-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Status IPVA</label>
                  <select
                    value={form.ipva_status}
                    onChange={e => setForm(prev => ({ ...prev, ipva_status: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  >
                    <option value="PAGO">Pago</option>
                    <option value="PENDENTE">Pendente</option>
                    <option value="PENDENTE (R$ 842,50)">Pendente (R$ 842,50)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Status Licenciamento</label>
                  <select
                    value={form.licensing_status}
                    onChange={e => setForm(prev => ({ ...prev, licensing_status: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  >
                    <option value="EM DIA">Em Dia</option>
                    <option value="VENCIDO">Vencido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Vencimento Licenciamento</label>
                  <input
                    type="date"
                    value={form.licensing_expiration}
                    onChange={e => setForm(prev => ({ ...prev, licensing_expiration: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/10 cursor-pointer mt-4"
              >
                Salvar Veículo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-md backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowEditModal(false)}>
          <div className="bg-card-theme border border-theme rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative my-8" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-theme flex justify-between items-center">
              <h3 className="text-sm font-bold text-primary-theme"><svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> Editar Veículo ({editForm.model})</h3>
              <button onClick={() => setShowEditModal(false)} className="text-muted-theme hover:text-primary-theme text-sm">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Status do Carro</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  >
                    <option value="available">Disponível</option>
                    <option value="rented">Alugado</option>
                    <option value="maintenance">Em Manutenção / Oficina</option>
                    <option value="damaged">Avaria / Sinistrado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Modelo / Versão</label>
                  <input
                    type="text"
                    required
                    value={editForm.model}
                    onChange={e => setEditForm(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Cor</label>
                  <input
                    type="text"
                    required
                    value={editForm.color}
                    onChange={e => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Ano</label>
                  <input
                    type="number"
                    value={editForm.year}
                    onChange={e => setEditForm(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Renavam</label>
                  <input
                    type="text"
                    value={editForm.renavam}
                    onChange={e => setEditForm(prev => ({ ...prev, renavam: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Chassi</label>
                  <input
                    type="text"
                    value={editForm.chassis}
                    onChange={e => setEditForm(prev => ({ ...prev, chassis: e.target.value.toUpperCase() }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">KM Atual</label>
                  <input
                    type="number"
                    value={editForm.current_km}
                    onChange={e => setEditForm(prev => ({ ...prev, current_km: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Intervalo Óleo (KM)</label>
                  <input
                    type="number"
                    value={editForm.oil_change_interval_km}
                    onChange={e => setEditForm(prev => ({ ...prev, oil_change_interval_km: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-theme pt-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Apólice do Seguro</label>
                  <input
                    type="text"
                    value={editForm.insurance_policy}
                    onChange={e => setEditForm(prev => ({ ...prev, insurance_policy: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Vencimento do Seguro</label>
                  <input
                    type="date"
                    value={editForm.insurance_expires_at}
                    onChange={e => setEditForm(prev => ({ ...prev, insurance_expires_at: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-theme pt-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Nome do Investidor</label>
                  <input
                    type="text"
                    value={editForm.investor_name}
                    onChange={e => setEditForm(prev => ({ ...prev, investor_name: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Repasse Investidor (%)</label>
                  <input
                    type="number"
                    value={editForm.investor_split_rate}
                    onChange={e => setEditForm(prev => ({ ...prev, investor_split_rate: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-theme pt-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Status IPVA</label>
                  <select
                    value={editForm.ipva_status}
                    onChange={e => setEditForm(prev => ({ ...prev, ipva_status: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  >
                    <option value="PAGO">Pago</option>
                    <option value="PENDENTE">Pendente</option>
                    <option value="PENDENTE (R$ 842,50)">Pendente (R$ 842,50)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Status Licenciamento</label>
                  <select
                    value={editForm.licensing_status}
                    onChange={e => setEditForm(prev => ({ ...prev, licensing_status: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  >
                    <option value="EM DIA">Em Dia</option>
                    <option value="VENCIDO">Vencido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Vencimento Licenciamento</label>
                  <input
                    type="date"
                    value={editForm.licensing_expiration}
                    onChange={e => setEditForm(prev => ({ ...prev, licensing_expiration: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/10 cursor-pointer mt-4"
              >
                Atualizar Veículo
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <span className="text-xs text-muted-theme font-semibold">Carregando frota de veículos...</span>
      </div>
    }>
      <VehiclesContent />
    </Suspense>
  );
}
