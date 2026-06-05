'use client';
import React from 'react';

export default function FinesPanel({
  fines,
  finesLoading,
  setShowFineModal,
  handleConfirmFineIndication,
  setFineWaText,
  setFineMatchedClientPhone,
  setShowFineWaModal
}) {
  return (
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
  );
}
