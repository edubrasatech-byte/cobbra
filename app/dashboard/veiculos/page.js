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
    insurance_expires_at: '', investor_name: '', investor_split_rate: ''
  });

  const [editForm, setEditForm] = useState({
    id: '', model: '', color: '', year: '', renavam: '', chassis: '',
    current_km: '', oil_change_interval_km: '10000', insurance_policy: '',
    insurance_expires_at: '', investor_name: '', investor_split_rate: '', status: ''
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
          renavam: data.vehicle.renavam
        }));
        showNotification('🚗 Placa consultada com sucesso! Dados preenchidos.');
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
        showNotification('🚗 Veículo cadastrado com sucesso!');
        setShowAddModal(false);
        setForm({
          model: '', plate: '', color: '', year: '', renavam: '', chassis: '',
          current_km: '', oil_change_interval_km: '10000', insurance_policy: '',
          insurance_expires_at: '', investor_name: '', investor_split_rate: ''
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
      status: v.status || 'available'
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
        showNotification('📝 Veículo atualizado com sucesso!');
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
        showNotification('🗑️ Veículo removido.');
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
    const b = badges[status] || { label: status, bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${b.bg}`}>{b.label}</span>;
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans pb-12">
      {/* Header section */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent flex items-center gap-2">
            🔑 Gestão da Frota
          </h1>
          <p className="text-xs text-slate-500 mt-1">Gerencie os veículos de locação, dados de seguro, manutenção e investidores</p>
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
        <div className="fixed top-20 right-6 z-50 bg-[#0F111E] border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-2 animate-bounce">
          <span>🐍</span>
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
            className="w-full bg-[#0C0E1A]/80 border border-slate-800/60 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/40 placeholder-slate-600 transition-colors"
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
                  : 'bg-transparent text-slate-400 border-slate-800/60 hover:border-slate-800'
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
          <span className="text-xs text-slate-500 font-semibold">Carregando veículos da frota...</span>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-[#0C0E1A] rounded-2xl border border-slate-800/40 p-12 text-center">
          <span className="text-4xl mb-4 block">🚗</span>
          <h3 className="text-slate-200 font-bold text-sm">Nenhum veículo encontrado</h3>
          <p className="text-xs text-slate-500 mt-1">Comece cadastrando um carro com consulta inteligente de placa.</p>
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
                className="bg-[#0C0E1A] rounded-2xl border border-slate-800/40 relative overflow-hidden transition-all duration-300 hover:border-emerald-500/40 group hover:translate-y-[-2px] flex flex-col justify-between"
                style={{ padding: '24px' }}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-extrabold text-slate-200 tracking-tight text-base group-hover:text-emerald-400 transition-colors leading-tight">
                        {v.model}
                      </h3>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                        Placa: <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-400">{v.plate}</span>
                      </p>
                    </div>
                    {getStatusBadge(v.status)}
                  </div>

                  {/* Details summary */}
                  <div className="space-y-2.5 text-xs text-slate-400 border-t border-slate-900 pt-4 mb-4">
                    <div className="flex justify-between">
                      <span>Cor / Ano:</span>
                      <span className="text-slate-300 font-bold">{v.color} {v.year ? `| ${v.year}` : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quilometragem:</span>
                      <span className="text-slate-300 font-bold">{v.current_km?.toLocaleString('pt-BR') || 0} KM</span>
                    </div>
                    {v.investor_name && (
                      <div className="flex justify-between border-b border-slate-900 pb-2">
                        <span>Investidor:</span>
                        <span className="text-emerald-400 font-bold">{v.investor_name} ({v.investor_split_rate || 80}%)</span>
                      </div>
                    )}
                  </div>

                  {/* Oil change warning bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase tracking-wider">
                      <span className="text-slate-500">Troca de óleo em:</span>
                      <span className={isOilUrgent ? 'text-rose-400 animate-pulse' : 'text-slate-400'}>
                        {oilRemaining.toLocaleString('pt-BR')} KM
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOilUrgent ? 'bg-rose-500' : oilPct < 30 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} 
                        style={{ width: `${oilPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-slate-900 pt-4 mt-auto">
                  <button
                    onClick={() => handleEditClick(v)}
                    className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800/60 text-slate-200 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="py-2 px-3 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 text-rose-400 text-xs font-bold transition-all cursor-pointer text-center"
                    title="Excluir Veículo"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowAddModal(false)}>
          <div className="bg-[#0C0E1A] border border-slate-800/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative my-8" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-900/60 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-200">🚗 Cadastrar Novo Veículo</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Placa (Mercosul ou Antiga)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ABC1D23 ou ABC1234"
                    value={form.plate}
                    onChange={e => setForm(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handlePlateLookup}
                    disabled={plateLoading}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-bold text-xs hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                  >
                    {plateLoading ? 'Consultando...' : '🔍 Puxar Placa'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Modelo / Versão</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fiat Uno 1.0"
                    value={form.model}
                    onChange={e => setForm(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Cor</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Branco"
                    value={form.color}
                    onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Ano</label>
                  <input
                    type="number"
                    placeholder="Ex: 2022"
                    value={form.year}
                    onChange={e => setForm(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Renavam</label>
                  <input
                    type="text"
                    placeholder="Apenas números"
                    value={form.renavam}
                    onChange={e => setForm(prev => ({ ...prev, renavam: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Chassi</label>
                  <input
                    type="text"
                    placeholder="Opcional"
                    value={form.chassis}
                    onChange={e => setForm(prev => ({ ...prev, chassis: e.target.value.toUpperCase() }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">KM Atual</label>
                  <input
                    type="number"
                    placeholder="Ex: 48500"
                    value={form.current_km}
                    onChange={e => setForm(prev => ({ ...prev, current_km: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Intervalo Troca Óleo (KM)</label>
                  <input
                    type="number"
                    value={form.oil_change_interval_km}
                    onChange={e => setForm(prev => ({ ...prev, oil_change_interval_km: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Apólice do Seguro</label>
                  <input
                    type="text"
                    placeholder="Nº Apólice"
                    value={form.insurance_policy}
                    onChange={e => setForm(prev => ({ ...prev, insurance_policy: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Vencimento do Seguro</label>
                  <input
                    type="date"
                    value={form.insurance_expires_at}
                    onChange={e => setForm(prev => ({ ...prev, insurance_expires_at: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Nome do Investidor (Split)</label>
                  <input
                    type="text"
                    placeholder="Caso o carro seja de investidor"
                    value={form.investor_name}
                    onChange={e => setForm(prev => ({ ...prev, investor_name: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Repasse Investidor (%)</label>
                  <input
                    type="number"
                    placeholder="Default: 80%"
                    value={form.investor_split_rate}
                    onChange={e => setForm(prev => ({ ...prev, investor_split_rate: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowEditModal(false)}>
          <div className="bg-[#0C0E1A] border border-slate-800/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative my-8" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-900/60 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-200">✏️ Editar Veículo ({editForm.model})</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Status do Carro</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  >
                    <option value="available">Disponível</option>
                    <option value="rented">Alugado</option>
                    <option value="maintenance">Em Manutenção / Oficina</option>
                    <option value="damaged">Avaria / Sinistrado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Modelo / Versão</label>
                  <input
                    type="text"
                    required
                    value={editForm.model}
                    onChange={e => setEditForm(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Cor</label>
                  <input
                    type="text"
                    required
                    value={editForm.color}
                    onChange={e => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Ano</label>
                  <input
                    type="number"
                    value={editForm.year}
                    onChange={e => setEditForm(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Renavam</label>
                  <input
                    type="text"
                    value={editForm.renavam}
                    onChange={e => setEditForm(prev => ({ ...prev, renavam: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Chassi</label>
                  <input
                    type="text"
                    value={editForm.chassis}
                    onChange={e => setEditForm(prev => ({ ...prev, chassis: e.target.value.toUpperCase() }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">KM Atual</label>
                  <input
                    type="number"
                    value={editForm.current_km}
                    onChange={e => setEditForm(prev => ({ ...prev, current_km: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Intervalo Óleo (KM)</label>
                  <input
                    type="number"
                    value={editForm.oil_change_interval_km}
                    onChange={e => setEditForm(prev => ({ ...prev, oil_change_interval_km: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Apólice do Seguro</label>
                  <input
                    type="text"
                    value={editForm.insurance_policy}
                    onChange={e => setEditForm(prev => ({ ...prev, insurance_policy: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Vencimento do Seguro</label>
                  <input
                    type="date"
                    value={editForm.insurance_expires_at}
                    onChange={e => setEditForm(prev => ({ ...prev, insurance_expires_at: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Nome do Investidor</label>
                  <input
                    type="text"
                    value={editForm.investor_name}
                    onChange={e => setEditForm(prev => ({ ...prev, investor_name: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">Repasse Investidor (%)</label>
                  <input
                    type="number"
                    value={editForm.investor_split_rate}
                    onChange={e => setEditForm(prev => ({ ...prev, investor_split_rate: e.target.value }))}
                    className="w-full bg-[#070913] border border-slate-800/60 focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
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
        <span className="text-xs text-slate-500 font-semibold">Carregando frota de veículos...</span>
      </div>
    }>
      <VehiclesContent />
    </Suspense>
  );
}
