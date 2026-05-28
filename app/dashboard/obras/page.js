'use client';
import { useState, useEffect } from 'react';

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

  const [exportLoading, setExportLoading] = useState(false);
  const [exportedCount, setExportedCount] = useState(0);

  // Auto-ajuste para o nicho de construção
  useEffect(() => {
    // Simulando que o painel já está configurado para o nicho
  }, []);

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
        setStep(3);
      } else if (data.error) {
        alert('Erro da API: ' + data.error);
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

  const handleExportCharges = async () => {
    if (!projectId) return;
    setExportLoading(true);
    try {
      const res = await fetch('/api/ai/budget-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export_charges', project_id: projectId })
      });
      const data = await res.json();
      if (data.success) {
        setExportedCount(data.count);
        alert('Sucesso! ' + data.count + ' cobranças criadas no painel principal, sincronizadas com os prazos de medição.');
      } else {
        alert('Erro ao exportar: ' + data.error);
      }
    } catch (e) {
      alert('Erro na integração com cobranças.');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070913] text-white">
      <header className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#0C0E1A]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">🏗️</div>
          <h1 className="font-bold text-lg">Construtor Catarina IA</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col p-4 md:p-8 max-w-6xl mx-auto w-full">
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
            <button onClick={() => setStep(2)} style={{ background: '#10b981', color: '#070913' }} className="mt-4 p-4 font-bold rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.3)]">Próximo Passo</button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6 animate-fadeInUp">
            <h2 className="text-xl font-bold text-emerald-400">2. Detalhes e Observações Comerciais</h2>
            <textarea 
              className="p-4 h-32 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-emerald-500 resize-none" 
              placeholder="Ex: Valor total R$ 150.000. Pagamento 30% entrada, 30% após 30 dias (Medição 1) e 40% na entrega final (60 dias)."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 p-4 bg-slate-800 text-white font-bold rounded-xl">Voltar</button>
              <button onClick={handleGenerate} disabled={loading} style={{ background: '#10b981', color: '#070913' }} className="flex-[2] p-4 font-bold rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.3)]">
                {loading ? 'Catarina Gerando (10s)...' : '✨ Gerar Proposta Automática'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-[600px] animate-fadeInUp">
            {/* PREVIEW */}
            <div className="flex-[2] bg-white text-black p-8 rounded-xl overflow-y-auto max-h-[75vh] shadow-xl border border-slate-200">
              {loading ? (
                <div className="w-full h-full flex flex-col items-center justify-center opacity-50">
                  <div className="animate-spin text-4xl mb-4">🐍</div>
                  <p className="font-bold">Catarina reescrevendo o documento e normas NBR...</p>
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} className="prose max-w-none text-sm" />
              )}
            </div>

            {/* CHAT / EDITOR / FINANCEIRO */}
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex-1 bg-[#0C0E1A] rounded-xl border border-slate-800 p-4 flex flex-col shadow-lg">
                <h3 className="font-bold text-emerald-400 mb-2 border-b border-slate-800 pb-2">Catarina Copilot 🪄</h3>
                <p className="text-[11px] text-slate-400 mb-4">Peça para a IA modificar cláusulas, recalcular valores ou alterar métodos.</p>
                
                <div className="flex-1 overflow-y-auto"></div>

                <div className="mt-4 flex gap-2">
                  <input 
                    className="flex-1 p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs outline-none focus:border-emerald-500 text-white"
                    placeholder="Ex: Troque a marca da tinta para Coral..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleChatEdit()}
                  />
                  <button onClick={handleChatEdit} disabled={loading} style={{ background: '#10b981', color: '#070913' }} className="p-3 rounded-lg font-bold text-xs">Enviar</button>
                </div>
              </div>

              {/* MÓDULO FINANCEIRO - EXPORTAÇÃO */}
              <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/30 p-4 flex flex-col shadow-lg">
                <h3 className="font-bold text-emerald-400 mb-2">Sincronização Financeira 💰</h3>
                <p className="text-[11px] text-emerald-200/70 mb-4">
                  Orçamento aprovado pelo cliente? A IA analisará o texto e exportará os prazos de medição como <strong>Cobranças de Pix</strong> separadas.
                </p>
                <button 
                  onClick={handleExportCharges}
                  disabled={exportLoading}
                  className="w-full p-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-bold text-xs shadow-md shadow-emerald-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                >
                  {exportLoading ? 'Extraindo e Sincronizando...' : (exportedCount > 0 ? '✅ ' + exportedCount + ' Parcelas Exportadas' : 'Extrair Parcelas (Medições) →')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
