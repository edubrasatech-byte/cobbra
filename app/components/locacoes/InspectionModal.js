'use client';
import React, { useState } from 'react';

export default function InspectionModal({ isOpen, onClose, onSubmit, vehicle }) {
  const [form, setForm] = useState({
    type: 'pickup', // pickup | return
    km: '',
    fuelLevel: 'full',
    cleanliness: 'clean',
    notes: '',
    photoFront: null,
    photoBack: null,
    photoLeft: null,
    photoRight: null
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-modal-overlay-theme backdrop-blur-sm z-[1000] flex justify-center items-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-modal-theme border border-theme rounded-3xl p-6 shadow-2xl animate-scaleIn flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-black text-primary-theme flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg> 
            Registrar Vistoria Digital {vehicle ? `(${vehicle.model})` : ''}
          </h3>
          <button onClick={onClose} className="text-muted-theme hover:text-primary-theme text-lg cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Tipo de Vistoria</label>
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="input-premium w-full cursor-pointer bg-input-theme"
            >
              <option value="pickup">Entrega de Veículo (Saída)</option>
              <option value="return">Devolução de Veículo (Entrada)</option>
              <option value="routine">Revisão Periódica / Rotina</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Quilometragem (KM)</label>
              <input
                type="number"
                required
                value={form.km}
                onChange={e => setForm({ ...form, km: e.target.value })}
                placeholder="45000"
                className="input-premium w-full"
              />
            </div>
            <div>
              <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Nível de Combustível</label>
              <select
                value={form.fuelLevel}
                onChange={e => setForm({ ...form, fuelLevel: e.target.value })}
                className="input-premium w-full cursor-pointer bg-input-theme"
              >
                <option value="empty">Reserva / Vazio</option>
                <option value="1/4">1/4 Tanque</option>
                <option value="2/4"> Meio Tanque</option>
                <option value="3/4">3/4 Tanque</option>
                <option value="full">Tanque Cheio</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Limpeza Geral</label>
              <select
                value={form.cleanliness}
                onChange={e => setForm({ ...form, cleanliness: e.target.value })}
                className="input-premium w-full cursor-pointer bg-input-theme"
              >
                <option value="dirty">Sujo</option>
                <option value="regular">Razoável</option>
                <option value="clean">Limpo / Lavado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Observações / Avarias Detectadas</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Ex: Risco na lateral esquerda e pequeno amassado no para-choque dianteiro."
              className="input-premium w-full h-20 text-xs p-2.5"
            />
          </div>

          <div>
            <span className="block text-[10px] text-secondary-theme font-bold uppercase tracking-wider mb-1.5">Fotos das 4 Faces do Veículo</span>
            <div className="grid grid-cols-2 gap-3 text-center text-[10px]">
              <div className="border border-dashed border-white/10 rounded-xl p-3 bg-card-theme flex flex-col justify-center items-center gap-1.5">
                <span>Foto Frontal</span>
                <input type="file" accept="image/*" className="hidden" id="photoFront" />
                <label htmlFor="photoFront" className="text-emerald-400 font-bold cursor-pointer">Carregar Foto</label>
              </div>
              <div className="border border-dashed border-white/10 rounded-xl p-3 bg-card-theme flex flex-col justify-center items-center gap-1.5">
                <span>Foto Traseira</span>
                <input type="file" accept="image/*" className="hidden" id="photoBack" />
                <label htmlFor="photoBack" className="text-emerald-400 font-bold cursor-pointer">Carregar Foto</label>
              </div>
              <div className="border border-dashed border-white/10 rounded-xl p-3 bg-card-theme flex flex-col justify-center items-center gap-1.5">
                <span>Lateral Esquerda</span>
                <input type="file" accept="image/*" className="hidden" id="photoLeft" />
                <label htmlFor="photoLeft" className="text-emerald-400 font-bold cursor-pointer">Carregar Foto</label>
              </div>
              <div className="border border-dashed border-white/10 rounded-xl p-3 bg-card-theme flex flex-col justify-center items-center gap-1.5">
                <span>Lateral Direita</span>
                <input type="file" accept="image/*" className="hidden" id="photoRight" />
                <label htmlFor="photoRight" className="text-emerald-400 font-bold cursor-pointer">Carregar Foto</label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <button type="button" onClick={onClose} className="btn-premium btn-premium-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-premium btn-premium-primary shadow-lg shadow-emerald-500/10">
              Registrar Vistoria
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
