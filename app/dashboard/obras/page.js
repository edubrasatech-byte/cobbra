'use client';
import { useState } from 'react';

export default function ObrasPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState(null);
  
  // Form State
  const [projectType, setProjectType] = useState('');
  const [services, setServices] = useState([]);
  const [notes, setNotes] = useState('');
  
  // Editor State
  const [htmlContent, setHtmlContent] = useState('');
  const [chatInput, setChatInput] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/budget-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_initial',
          project_type: projectType,
          services,
          notes
        })
      });
      const data = await res.json();
      if (data.html) {
        setHtmlContent(data.html);
        setProjectId(data.project_id);
        setStep(3); // Go to editor
      }
    } catch (e) {
      alert('Erro ao gerar orçamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleChatEdit = async () => {
    if (!chatInput) return;
    setLoading(true);
    const currentInput = chatInput;
    setChatInput('');
    try {
      const res = await fetch('/api/ai/budget-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_document',
          project_id: projectId,
          prompt: currentInput,
          notes: htmlContent
        })
      });
      const data = await res.json();
      if (data.html) {
        setHtmlContent(data.html);
      }
    } catch (e) {
      alert('Erro ao editar orçamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070913] text-white">
      {/* HEADER */}
      <header className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#0C0E1A]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">🏗️</div>
          <h1 className="font-bold text-lg">Construtor Catarina IA</h1>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full">
        {step === 1 && (
          <div className="flex flex-col gap-6 animate-fadeInUp">
            <h2 className="text-xl font-bold text-emerald-400">1. O que vamos construir/reformar?</h2>
            <input 
              className="p-4 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-emerald-500" 
              placeholder="Ex: Prédio Residencial de 10 andares (Jardim de Sintra)"
              value={projectType}
              onChange={e => setProjectType(e.target.value)}
            />
            <div className="flex flex-wrap gap-3">
              {['Lavação de Fachada', 'Pintura Externa', 'Impermeabilização', 'Tratamento de Ferragem', 'Troca de Telhado'].map(s => {
                const isSelected = services.includes(s);
                return (
                  <label key={s} className={"p-3 rounded-lg border cursor-pointer transition-colors " + (isSelected ? "bg-emerald-500/20 border-emerald-500" : "bg-slate-900 border-slate-800")}>
                    <input type="checkbox" className="hidden" onChange={(e) => {
                      if (e.target.checked) setServices([...services, s]);
                      else setServices(services.filter(x => x !== s));
                    }} />
                    {s}
                  </label>
                );
              })}
            </div>
            <button onClick={() => setStep(2)} className="mt-4 p-4 bg-emerald-500 text-[#070913] font-bold rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.3)]">Próximo Passo</button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6 animate-fadeInUp">
            <h2 className="text-xl font-bold text-emerald-400">2. Detalhes e Observações</h2>
            <textarea 
              className="p-4 h-32 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-emerald-500 resize-none" 
              placeholder="Ex: Pagamento 30% entrada e 4x. Usar tinta Suvinil Proteção Total."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 p-4 bg-slate-800 text-white font-bold rounded-xl">Voltar</button>
              <button onClick={handleGenerate} disabled={loading} className="flex-[2] p-4 bg-emerald-500 text-[#070913] font-bold rounded-xl">
                {loading ? 'Catarina Gerando (10s)...' : '✨ Gerar Proposta Automática'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-[600px]">
            {/* PREVIEW */}
            <div className="flex-[2] bg-white text-black p-8 rounded-xl overflow-y-auto max-h-[70vh] shadow-xl border border-slate-200">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center opacity-50">
                  <div className="animate-spin text-4xl">🐍</div>
                  <p className="ml-4 font-bold">Catarina reescrevendo o documento...</p>
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} className="prose max-w-none text-sm" />
              )}
            </div>

            {/* CHAT / EDITOR */}
            <div className="flex-1 flex flex-col bg-[#0C0E1A] rounded-xl border border-slate-800 p-4">
              <h3 className="font-bold text-emerald-400 mb-4 border-b border-slate-800 pb-2">Catarina Copilot 🪄</h3>
              <p className="text-xs text-slate-400 mb-4">Peça para a IA modificar preços, cláusulas, tom de voz ou adicionar novos itens no orçamento.</p>
              
              <div className="flex-1 overflow-y-auto"></div>

              <div className="mt-4 flex gap-2">
                <input 
                  className="flex-1 p-3 bg-slate-900 border border-slate-800 rounded-lg text-sm outline-none focus:border-emerald-500"
                  placeholder="Ex: Troque a marca da tinta para Coral..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChatEdit()}
                />
                <button onClick={handleChatEdit} disabled={loading} className="p-3 bg-emerald-500 text-black rounded-lg font-bold">Enviar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
