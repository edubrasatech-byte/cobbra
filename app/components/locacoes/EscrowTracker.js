'use client';
import React from 'react';

export default function EscrowTracker({
  escrows,
  escrowsLoading,
  setEscrowForm,
  setShowEscrowModal
}) {
  return (
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
  );
}
