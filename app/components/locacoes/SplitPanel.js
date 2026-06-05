'use client';
import React from 'react';

export default function SplitPanel({
  payouts,
  payoutsLoading,
  handleConfirmPayout
}) {
  return (
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
                <p className="text-[9px] text-muted-theme font-medium mt-1">
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
  );
}
