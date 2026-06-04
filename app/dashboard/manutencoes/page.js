'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function MaintenanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [maintenances, setMaintenances] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [form, setForm] = useState({
    vehicle_id: '',
    description: '',
    total_cost: '',
    responsibility: 'owner', // owner, driver, split
    driver_share_amount: '',
    driver_charge_mode: 'direct_charge', // direct_charge, deduct_deposit
    reminder_date: ''
  });

  const [editForm, setEditForm] = useState({
    id: '',
    vehicle_id: '',
    description: '',
    total_cost: '',
    responsibility: 'owner',
    driver_share_amount: '',
    driver_charge_mode: 'direct_charge',
    reminder_date: ''
  });

  useEffect(() => {
    fetchMaintenances();
    fetchVehicles();

    if (searchParams.get('action') === 'new') {
      setShowAddModal(true);
    }
  }, [searchParams]);

  const fetchMaintenances = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/locacoes/maintenances');
      const data = await res.json();
      if (data.maintenances) setMaintenances(data.maintenances);
    } catch (e) {
      showNotification('Erro ao carregar manutenções.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/locacoes/vehicles');
      const data = await res.json();
      if (data.vehicles) setVehicles(data.vehicles);
    } catch (e) {}
  };

  const showNotification = (message) => {
    setMsg(message);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicle_id || !form.description || !form.total_cost || !form.responsibility) {
      alert('Veículo, descrição, custo total e responsabilidade são obrigatórios.');
      return;
    }

    try {
      const res = await fetch('/api/locacoes/maintenances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        showNotification('Ordem de Manutenção criada com sucesso!');
        setShowAddModal(false);
        setForm({
          vehicle_id: '', description: '', total_cost: '', responsibility: 'owner',
          driver_share_amount: '', driver_charge_mode: 'direct_charge', reminder_date: ''
        });
        fetchMaintenances();
        router.push('/dashboard/manutencoes');
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao registrar manutenção.');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar manutenção.');
    }
  };

  const handleEditClick = (m) => {
    setEditForm({
      id: m.id,
      vehicle_id: m.vehicle_id,
      description: m.description,
      total_cost: m.total_cost,
      responsibility: m.responsibility || 'owner',
      driver_share_amount: m.driver_share_amount || '',
      driver_charge_mode: m.driver_charge_mode || 'direct_charge',
      reminder_date: m.reminder_date || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/locacoes/maintenances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        showNotification('Manutenção atualizada com sucesso!');
        setShowEditModal(false);
        fetchMaintenances();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao atualizar manutenção.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente remover este registro de manutenção?')) return;
    try {
      const res = await fetch(`/api/locacoes/maintenances?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Registro de manutenção excluído.');
        fetchMaintenances();
      } else {
        alert('Erro ao excluir.');
      }
    } catch (e) {
      alert('Erro ao excluir.');
    }
  };

  const fmt = v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const getResponsibilityLabel = (r) => {
    const labels = {
      owner: { label: 'Proprietário', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      driver: { label: 'Motorista (Cobrar)', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
      split: { label: 'Dividido', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
    };
    const b = labels[r] || { label: r, bg: 'bg-surface-theme text-primary-theme' };
    return <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${b.bg}`}>{b.label}</span>;
  };

  return (
    <div className="min-h-screen text-primary-theme font-sans pb-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.67 2.67 0 0021 17.25l-5.83-5.83m-3.75 3.75a3.75 3.75 0 01-3.75-3.75M11.42 15.17l-1.2-1.2A3.75 3.75 0 009 11.42l-1.2-1.2m0 0A3.75 3.75 0 019 7.92M7.8 7.82l-5.83 5.83A2.67 2.67 0 005.72 17.4l5.83-5.83" /></svg> Manutenções & Reparos
          </h1>
          <p className="text-xs text-muted-theme mt-1">Controle gastos de oficina, agende trocas de óleo e gerencie a coparticipação com motoristas</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/10 active:scale-95 transition-all select-none cursor-pointer"
        >
          + Registrar Manutenção
        </button>
      </div>

      {/* Floating Notification */}
      {msg && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F111E] border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-2 animate-bounce">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-xs font-bold">{msg}</span>
        </div>
      )}

      {/* Content listing */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
          <span className="text-xs text-muted-theme font-semibold">Buscando ordens de serviço...</span>
        </div>
      ) : maintenances.length === 0 ? (
        <div className="bg-card-theme rounded-2xl border border-theme p-12 text-center">
          <svg className="w-10 h-10 text-muted-theme mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.67 2.67 0 0021 17.25l-5.83-5.83m-3.75 3.75a3.75 3.75 0 01-3.75-3.75M11.42 15.17l-1.2-1.2A3.75 3.75 0 009 11.42l-1.2-1.2m0 0A3.75 3.75 0 019 7.92M7.8 7.82l-5.83 5.83A2.67 2.67 0 005.72 17.4l5.83-5.83" /></svg>
          <h3 className="text-primary-theme font-bold text-sm">Nenhum registro de oficina</h3>
          <p className="text-xs text-muted-theme mt-1">Lance as manutenções dos carros e gerencie o faturamento de forma transparente.</p>
        </div>
      ) : (
        <div className="bg-card-theme rounded-2xl border border-theme overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-theme bg-surface-theme text-[10px] uppercase font-bold tracking-wider text-muted-theme">
                  <th className="py-4 px-6">Veículo / Placa</th>
                  <th className="py-4 px-6">Descrição do Serviço</th>
                  <th className="py-4 px-6">Data</th>
                  <th className="py-4 px-6">Responsabilidade</th>
                  <th className="py-4 px-6">Custo Total</th>
                  <th className="py-4 px-6">Lembrete Próxima</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-xs text-primary-theme">
                {maintenances.map(m => (
                  <tr key={m.id} className="hover:bg-card-theme transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-primary-theme">{m.model}</p>
                      <p className="font-mono text-[10px] text-muted-theme mt-0.5">{m.plate}</p>
                    </td>
                    <td className="py-4 px-6 max-w-xs truncate" title={m.description}>
                      {m.description}
                    </td>
                    <td className="py-4 px-6 text-secondary-theme font-medium">
                      {new Date(m.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-6">
                      {getResponsibilityLabel(m.responsibility)}
                      {m.responsibility === 'split' && (
                        <p className="text-[9px] text-muted-theme mt-1">Motorista: {fmt(m.driver_share_amount)}</p>
                      )}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-primary-theme">
                      {fmt(m.total_cost)}
                    </td>
                    <td className="py-4 px-6 font-medium text-secondary-theme">
                      {m.reminder_date ? (
                        <span className={`flex items-center gap-1.5 ${new Date(m.reminder_date) <= new Date() ? 'text-amber-400 font-bold' : ''}`}>
                          <svg className="w-3 h-3 text-muted-theme inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> {new Date(m.reminder_date).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(m)}
                          className="p-1.5 rounded-lg bg-surface-theme hover:bg-slate-700 border border-theme text-primary-theme hover:text-white cursor-pointer transition-colors"
                          title="Editar"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 cursor-pointer transition-colors"
                          title="Excluir"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-md backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowAddModal(false)}>
          <div className="bg-card-theme border border-theme rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative my-8" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-theme flex justify-between items-center">
              <h3 className="text-sm font-bold text-primary-theme"><svg className="w-4 h-4 text-emerald-400 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.67 2.67 0 0021 17.25l-5.83-5.83m-3.75 3.75a3.75 3.75 0 01-3.75-3.75M11.42 15.17l-1.2-1.2A3.75 3.75 0 009 11.42l-1.2-1.2m0 0A3.75 3.75 0 019 7.92M7.8 7.82l-5.83 5.83A2.67 2.67 0 005.72 17.4l5.83-5.83" /></svg> Registrar Ordem de Manutenção</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-theme hover:text-primary-theme text-sm">✕</button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Veículo</label>
                <select
                  required
                  value={form.vehicle_id}
                  onChange={e => setForm(prev => ({ ...prev, vehicle_id: e.target.value }))}
                  className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                >
                  <option value="">Selecione o Veículo...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.model} - {v.plate}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Descrição do Serviço realizado</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Troca de óleo de motor e filtros, pastilhas de freio"
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Custo Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={form.total_cost}
                    onChange={e => setForm(prev => ({ ...prev, total_cost: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Responsabilidade do Custo</label>
                  <select
                    value={form.responsibility}
                    onChange={e => setForm(prev => ({ ...prev, responsibility: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  >
                    <option value="owner">Proprietário (Desgaste natural)</option>
                    <option value="driver">Motorista (Avaria / Mau uso)</option>
                    <option value="split">Dividido / Coparticipação</option>
                  </select>
                </div>
              </div>

              {form.responsibility === 'split' && (
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Cota-Parte do Motorista (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Valor a cobrar do motorista"
                    value={form.driver_share_amount}
                    onChange={e => setForm(prev => ({ ...prev, driver_share_amount: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
              )}

              {(form.responsibility === 'driver' || form.responsibility === 'split') && (
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Como cobrar o motorista?</label>
                  <select
                    value={form.driver_charge_mode}
                    onChange={e => setForm(prev => ({ ...prev, driver_charge_mode: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  >
                    <option value="direct_charge">Gerar Nova Cobrança Pix (5 dias de vencimento)</option>
                    <option value="deduct_deposit">Descontar do saldo de caução acumulado</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Data Lembrete Próxima Revisão</label>
                <input
                  type="date"
                  value={form.reminder_date}
                  onChange={e => setForm(prev => ({ ...prev, reminder_date: e.target.value }))}
                  className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/10 cursor-pointer mt-4"
              >
                Salvar Manutenção
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
              <h3 className="text-sm font-bold text-primary-theme"><svg className="w-4 h-4 text-emerald-400 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> Editar Ordem de Manutenção</h3>
              <button onClick={() => setShowEditModal(false)} className="text-muted-theme hover:text-primary-theme text-sm">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Descrição do Serviço</label>
                <input
                  type="text"
                  required
                  value={editForm.description}
                  onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Custo Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.total_cost}
                    onChange={e => setEditForm(prev => ({ ...prev, total_cost: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Responsabilidade</label>
                  <select
                    value={editForm.responsibility}
                    onChange={e => setEditForm(prev => ({ ...prev, responsibility: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  >
                    <option value="owner">Proprietário (Desgaste natural)</option>
                    <option value="driver">Motorista (Avaria / Mau uso)</option>
                    <option value="split">Dividido / Coparticipação</option>
                  </select>
                </div>
              </div>

              {editForm.responsibility === 'split' && (
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Cota-Parte do Motorista (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.driver_share_amount}
                    onChange={e => setEditForm(prev => ({ ...prev, driver_share_amount: e.target.value }))}
                    className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-theme mb-1.5">Data Lembrete Revisão</label>
                <input
                  type="date"
                  value={editForm.reminder_date}
                  onChange={e => setEditForm(prev => ({ ...prev, reminder_date: e.target.value }))}
                  className="w-full bg-input-theme border border-theme focus:border-emerald-500/40 rounded-xl px-4 py-2.5 text-xs text-primary-theme focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/10 cursor-pointer mt-4"
              >
                Atualizar Manutenção
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <span className="text-xs text-muted-theme font-semibold">Carregando ordens de serviço...</span>
      </div>
    }>
      <MaintenanceContent />
    </Suspense>
  );
}
