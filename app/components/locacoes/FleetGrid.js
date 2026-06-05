'use client';
import React from 'react';

export default function FleetGrid({
  rentals,
  statusConfig,
  recurrenceConfig,
  triggerAlert,
  handleConfirmReturn,
  handleRefundDeposit,
  handleOpenContract,
  activeCount,
  overdueCount,
  paidCount
}) {
  return (
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
    
      {/* Mobile View: Cards */}
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
                
                {/* Return Confirmation Button */}
                {r.status !== 'paid' && (
                  <button 
                    onClick={() => handleConfirmReturn(r)}
                    className="flex-1 min-w-[80px] btn-premium bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px]"
                  >
                    <svg className="w-3.5 h-3.5 inline mr-1 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Receber Carro
                  </button>
                )}

                {/* Refund Deposit Button */}
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

      {/* Desktop View: Table */}
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
  );
}
