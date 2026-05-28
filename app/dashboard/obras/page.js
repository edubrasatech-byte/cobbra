'use client';
import { useState, useRef, useEffect } from 'react';

const PROMPT_SUGGESTIONS = [
  { icon: '💰', text: 'Troque o valor do contrato para R$ 80.000' },
  { icon: '📅', text: 'Adicione multa de 2% por atraso no pagamento' },
  { icon: '🏗️', text: 'Inclua cláusula de garantia de 5 anos NBR 15.575' },
  { icon: '🖼️', text: 'Insira o laudo fotográfico com as imagens enviadas' },
  { icon: '🔄', text: 'Altere o prazo de entrega para 90 dias corridos' },
  { icon: '✍️', text: 'Adicione campo de assinatura e data ao final' },
  { icon: '🧱', text: 'Troque a marca da tinta de Suvinil para Coral' },
  { icon: '📋', text: 'Inclua escopo detalhado de limpeza pós-obra' },
];

const POWER_TIPS = [
  { icon: '📸', title: 'Anexe fotos da vistoria', desc: 'Envie imagens reais da obra. A IA insere um laudo fotográfico técnico automático no contrato.' },
  { icon: '💵', title: 'Parcelas automáticas', desc: 'Após aprovar o orçamento, clique em "Extrair Parcelas" para criar cobranças Pix de cada medição.' },
  { icon: '✏️', title: 'Edição em linguagem natural', desc: 'Diga o que quer mudar como numa conversa. "Aumente a mão de obra em 15%" ou "Remova o item de escorramento".' },
  { icon: '📄', title: 'Contratos NBR prontos', desc: 'Toda proposta já inclui cláusulas de garantia NBR 15.575, responsabilidades e penalidades legais.' },
];

export default function ObrasPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [countdown, setCountdown] = useState(0);

  // Form
  const [projectType, setProjectType] = useState('');
  const [services, setServices] = useState([]);
  const [notes, setNotes] = useState('');

  // Editor
  const [htmlContent, setHtmlContent] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [images, setImages] = useState([]);
  const [showTips, setShowTips] = useState(false);

  const [exportLoading, setExportLoading] = useState(false);
  const [exportedCount, setExportedCount] = useState(0);

  const fileInputRef = useRef(null);
  const countdownRef = useRef(null);

  // ---------- Countdown timer ----------
  const startCountdown = (seconds) => {
    setCountdown(seconds);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(countdownRef.current), []);

  // ---------- Image upload ----------
  const handleImageUpload = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const b64 = ev.target.result.split(',')[1];
        setImages(prev => [...prev, { mime: file.type, base64: b64, preview: ev.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i));

  // ---------- Generate ----------
  const handleGenerate = async () => {
    setLoading(true);
    startCountdown(30);
    try {
      const res = await fetch('/api/ai/budget-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_initial',
          project_type: projectType,
          services,
          notes,
          images: images.map(i => ({ mime: i.mime, base64: i.base64 }))
        })
      });
      const data = await res.json();
      clearInterval(countdownRef.current);
      setCountdown(0);
      if (data.html) {
        setHtmlContent(data.html);
        setProjectId(data.project_id);
        setStep(3);
      } else {
        alert('Erro da API: ' + (data.error || 'resposta inválida'));
      }
    } catch {
      clearInterval(countdownRef.current);
      setCountdown(0);
      alert('Erro ao gerar orçamento. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Chat edit ----------
  const handleChatEdit = async (inputOverride) => {
    const input = inputOverride || chatInput;
    if (!input.trim()) return;
    setLoading(true);
    startCountdown(20);
    setChatInput('');
    try {
      const res = await fetch('/api/ai/budget-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_document',
          project_id: projectId,
          prompt: input,
          notes: htmlContent,
          images: images.map(i => ({ mime: i.mime, base64: i.base64 }))
        })
      });
      const data = await res.json();
      clearInterval(countdownRef.current);
      setCountdown(0);
      if (data.html) { setHtmlContent(data.html); setImages([]); }
    } catch {
      clearInterval(countdownRef.current);
      setCountdown(0);
      alert('Erro ao editar orçamento.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Export charges ----------
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
        alert(`Sucesso! ${data.count} cobrança(s) criada(s) no painel, sincronizadas com os prazos de medição.`);
      } else {
        alert('Erro ao exportar: ' + data.error);
      }
    } catch {
      alert('Erro na integração com cobranças.');
    } finally {
      setExportLoading(false);
    }
  };

  // ---------- Progress bar component ----------
  const ProgressBar = ({ current }) => (
    <div className="flex items-center gap-2 text-xs mb-6">
      {[{ n: 1, label: 'Escopo' }, { n: 2, label: 'Condições' }, { n: 3, label: 'Documento IA' }].map(({ n, label }, idx) => (
        <div key={n} className="flex items-center gap-2 flex-shrink-0">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${current > n ? 'bg-emerald-600 text-white' : current === n ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
            {current > n ? '✓' : n}
          </div>
          <span className={current === n ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>{label}</span>
          {idx < 2 && <div className="w-8 h-px bg-slate-800 mx-1" />}
        </div>
      ))}
    </div>
  );

  // ======= RENDER =======
  return (
    <div className="flex flex-col gap-0 h-full">

      {/* PAGE HEADER — dentro do layout do dashboard */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">🏗️ Construtor Catarina IA</h2>
          <p className="text-sm text-slate-400 mt-0.5">Orçamentos e contratos profissionais gerados por IA em segundos</p>
        </div>
        <button
          onClick={() => setShowTips(!showTips)}
          className="text-[11px] font-semibold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 rounded-lg hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 flex-shrink-0"
        >
          💡 {showTips ? 'Ocultar dicas' : 'Ver o que posso fazer'}
        </button>
      </div>

      {/* DICAS EXPANSÍVEIS */}
      {showTips && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 p-4 bg-[#0b1220] border border-slate-800 rounded-xl">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider col-span-full mb-1">⚡ O que esta ferramenta faz</p>
          {POWER_TIPS.map((tip, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">{tip.icon}</span>
                <span className="text-xs font-bold text-white">{tip.title}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* ===== STEP 1 ===== */}
      {step === 1 && (
        <div className="flex flex-col gap-5 max-w-2xl">
          <ProgressBar current={1} />

          <div>
            <h3 className="text-base font-bold text-white mb-0.5">O que vamos construir ou reformar?</h3>
            <p className="text-sm text-slate-400">Descreva o projeto. Quanto mais detalhes, mais preciso o contrato.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Nome do projeto</label>
            <input
              className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-emerald-500 text-white placeholder-slate-600 text-sm transition-colors"
              placeholder="Ex: Prédio Residencial 10 andares – Jardim de Sintra, SP"
              value={projectType}
              onChange={e => setProjectType(e.target.value)}
            />
            <div className="flex flex-wrap gap-2 mt-1">
              {['Residência unifamiliar 150m²', 'Reforma comercial – escritório', 'Impermeabilização de cobertura', 'Construção de galpão logístico'].map(ex => (
                <button key={ex} onClick={() => setProjectType(ex)}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-300 transition-all">
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Serviços incluídos</label>
            <div className="flex flex-wrap gap-2">
              {['Lavação de Fachada', 'Pintura Externa', 'Impermeabilização', 'Tratamento de Ferragem', 'Troca de Telhado', 'Fundação e Estrutura', 'Acabamento Interno', 'Elétrica e Hidráulica'].map(s => {
                const sel = services.includes(s);
                return (
                  <label key={s} className={"px-3 py-2 rounded-xl border cursor-pointer transition-all text-sm select-none " + (sel ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold" : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600")}>
                    <input type="checkbox" className="hidden" onChange={e => {
                      if (e.target.checked) setServices(p => [...p, s]);
                      else setServices(p => p.filter(x => x !== s));
                    }} />
                    {s}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/15 rounded-xl p-3.5">
            <span className="text-blue-400 text-base mt-0.5">💡</span>
            <p className="text-[11px] text-blue-200/60 leading-relaxed">
              <strong className="text-blue-300">Dica:</strong> No próximo passo você informa valores, prazos e condições de pagamento. A IA estrutura cláusulas contratuais completas a partir dessas informações.
            </p>
          </div>

          <button onClick={() => setStep(2)} disabled={!projectType.trim()}
            className={"p-4 font-bold rounded-xl transition-all text-sm " + (!projectType.trim() ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-emerald-500 text-black shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_28px_rgba(16,185,129,0.45)] hover:scale-[1.01]')}>
            Próximo Passo →
          </button>
        </div>
      )}

      {/* ===== STEP 2 ===== */}
      {step === 2 && (
        <div className="flex flex-col gap-5 max-w-2xl">
          <ProgressBar current={2} />

          <div>
            <h3 className="text-base font-bold text-white mb-0.5">Condições Comerciais & Financeiras</h3>
            <p className="text-sm text-slate-400">Informe valores, prazos e formas de pagamento para o contrato.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Modelos rápidos de condições (clique para preencher)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { label: '30 / 30 / 40', desc: 'Entrada + Medição + Entrega', template: 'Valor total R$ [inserir]. Pagamento: 30% entrada, 30% Medição 1 (30 dias), 40% entrega final (60 dias).' },
                { label: '50 / 50', desc: 'Entrada e entrega', template: 'Valor total R$ [inserir]. 50% no início e 50% na entrega da obra.' },
                { label: '3x iguais mensais', desc: 'Parcelas mensais fixas', template: 'Valor total R$ [inserir], dividido em 3 parcelas mensais iguais com vencimento em 30, 60 e 90 dias.' },
                { label: 'Medição semanal', desc: 'Cobranças por avanço físico', template: 'Valor total R$ [inserir]. Pagamento semanal conforme avanço físico, medições às sextas-feiras.' },
              ].map((t, i) => (
                <button key={i} onClick={() => setNotes(t.template)}
                  className="text-left px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group">
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300">{t.label}</div>
                  <div className="text-[10px] text-slate-500">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Ou descreva livremente</label>
            <textarea
              className="p-3.5 h-28 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:border-emerald-500 resize-none text-sm text-white placeholder-slate-600 transition-colors"
              placeholder="Ex: Valor total R$ 150.000. Pagamento 30% entrada, 30% após 30 dias e 40% na entrega. Prazo 90 dias corridos."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3.5">
            <span className="text-emerald-400 text-base mt-0.5">🪄</span>
            <p className="text-[11px] text-emerald-200/60 leading-relaxed">
              <strong className="text-emerald-300">Após gerar,</strong> você pode pedir à Catarina para alterar qualquer detalhe — mudar um valor, trocar um fornecedor, adicionar cláusula — e ela reescreve o documento na hora.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 p-3.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors text-sm">← Voltar</button>
            <button onClick={handleGenerate} disabled={loading}
              className="flex-[2] p-3.5 font-bold rounded-xl text-sm transition-all disabled:opacity-60 disabled:cursor-wait bg-emerald-500 text-black shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_28px_rgba(16,185,129,0.45)] hover:scale-[1.01]">
              {loading
                ? `⏳ Catarina gerando... ${countdown > 0 ? `(~${countdown}s)` : ''}`
                : '✨ Gerar Proposta com IA'}
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 3: EDITOR ===== */}
      {step === 3 && (
        <div className="flex flex-col lg:flex-row gap-4 w-full" style={{ height: 'calc(100vh - 220px)', minHeight: 500 }}>

          {/* PREVIEW DO DOCUMENTO */}
          <div className="flex-[2] flex flex-col rounded-xl overflow-hidden border border-slate-700 shadow-xl" style={{ minWidth: 0 }}>
            <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <span className="text-[11px] text-slate-400 ml-2 font-medium">Pré-visualização do Contrato</span>
              </div>
              {loading && countdown > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  IA processando... {countdown}s
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-black opacity-40">
                  <div className="animate-spin text-5xl mb-4">🐍</div>
                  <p className="font-bold text-sm">Catarina reescrevendo o documento...</p>
                  <p className="text-xs text-gray-500 mt-1">Aplicando normas NBR e recalculando cláusulas</p>
                  {countdown > 0 && (
                    <div className="mt-4 flex items-center gap-2">
                      <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${(1 - countdown / 30) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">~{countdown}s</span>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                  className="prose max-w-none text-sm p-6 md:p-10 text-black"
                  style={{ fontFamily: 'Georgia, serif', lineHeight: 1.7 }}
                />
              )}
            </div>
          </div>

          {/* PAINEL LATERAL */}
          <div className="lg:w-72 xl:w-80 flex flex-col gap-3 flex-shrink-0">

            {/* CATARINA COPILOT */}
            <div className="bg-[#0C0E1A] rounded-xl border border-slate-800 p-4 flex flex-col flex-1 shadow-lg overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 flex-shrink-0">
                <h3 className="font-bold text-emerald-400 text-sm">Catarina Copilot 🪄</h3>
                <span className="text-[9px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full font-semibold tracking-wider">IA</span>
              </div>

              {/* Sugestões */}
              <div className="mb-3 flex-shrink-0">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Clique para aplicar instantaneamente</p>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {PROMPT_SUGGESTIONS.map((s, i) => (
                    <button key={i} onClick={() => handleChatEdit(s.text)} disabled={loading}
                      className="flex items-start gap-2 text-left px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 transition-all group disabled:opacity-40 disabled:cursor-wait">
                      <span className="text-sm mt-0.5 flex-shrink-0">{s.icon}</span>
                      <span className="text-[11px] text-slate-400 group-hover:text-slate-200 leading-snug">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Imagens anexadas */}
              {images.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mb-2 flex-shrink-0">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative w-10 h-10 rounded-lg border border-slate-700 overflow-hidden flex-shrink-0">
                      <img src={img.preview} alt="upload" className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(idx)} className="absolute inset-0 bg-black/60 text-white text-[10px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input livre */}
              <div className="flex-shrink-0 border-t border-slate-800 pt-3 mt-auto">
                <p className="text-[10px] text-slate-500 mb-2">Ou escreva livremente:</p>
                <div className="flex gap-1.5">
                  <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                  <button onClick={() => fileInputRef.current?.click()} title="Anexar foto da vistoria"
                    className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-sm hover:bg-slate-700 transition-colors flex-shrink-0">
                    📷
                  </button>
                  <input
                    className="flex-1 min-w-0 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs outline-none focus:border-emerald-500 text-white placeholder-slate-600 transition-colors"
                    placeholder="Ex: Adicione garantia de 5 anos..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleChatEdit()}
                  />
                  <button onClick={() => handleChatEdit()} disabled={loading || !chatInput.trim()}
                    className="p-2 bg-emerald-500 text-black rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-wait hover:bg-emerald-400 transition-colors flex-shrink-0 px-3">
                    →
                  </button>
                </div>
              </div>
            </div>

            {/* MÓDULO FINANCEIRO */}
            <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/30 p-4 flex-shrink-0">
              <h3 className="font-bold text-emerald-400 mb-1 text-sm flex items-center gap-1.5">⚡ Sincronização Financeira</h3>
              <p className="text-[11px] text-emerald-200/70 mb-3 leading-relaxed">
                Orçamento aprovado? A IA extrai as parcelas e cria <strong>cobranças Pix</strong> direto no painel.
              </p>
              <button onClick={handleExportCharges} disabled={exportLoading}
                className="w-full p-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-bold text-xs shadow-md shadow-emerald-500/20 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2">
                {exportLoading ? '⏳ Extraindo...' : exportedCount > 0 ? `✅ ${exportedCount} Parcelas Exportadas` : '💸 Extrair Parcelas de Medição'}
              </button>
            </div>

            {/* NOVO ORÇAMENTO */}
            <button onClick={() => { setStep(1); setHtmlContent(''); setProjectId(null); setExportedCount(0); setImages([]); setNotes(''); setProjectType(''); setServices([]); }}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors text-center py-1 flex-shrink-0">
              ← Criar novo orçamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
