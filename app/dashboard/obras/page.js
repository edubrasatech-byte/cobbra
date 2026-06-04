'use client';
import { useState, useRef, useEffect } from 'react';

const PROMPT_SUGGESTIONS = [
  { icon: '💰', text: 'Altere o valor total para R$ 80.000' },
  { icon: '📅', text: 'Adicione multa de 2% por atraso no pagamento' },
  { icon: '🏗️', text: 'Inclua cláusula de garantia de 5 anos NBR 15.575' },
  { icon: '🖼️', text: 'Insira o laudo fotográfico com as imagens enviadas' },
  { icon: '🔄', text: 'Mude o prazo de entrega para 90 dias corridos' },
  { icon: '✍️', text: 'Adicione campo de assinatura e data ao final' },
  { icon: '🧱', text: 'Troque a marca da tinta de Suvinil para Coral' },
  { icon: '📋', text: 'Inclua escopo detalhado de limpeza pós-obra' },
];

const stepStyle = {
  outer: { display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 },
  label: { fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 },
  input: { width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  textarea: { width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', minHeight: 100 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
};

function ProgressBar({ current, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
      {Array.from({ length: total }, (_, i) => i + 1).map((n, idx) => (
        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, flexShrink: 0,
            background: current > n ? '#059669' : current === n ? '#10b981' : '#1e293b',
            color: current > n ? '#fff' : current === n ? '#000' : '#475569',
          }}>
            {current > n ? '✓' : n}
          </div>
          {idx < total - 1 && <div style={{ width: 32, height: 2, background: current > n ? '#10b981' : '#1e293b', borderRadius: 1 }} />}
        </div>
      ))}
      <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>Passo {current} de {total}</span>
    </div>
  );
}

export default function ObrasPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [bleed, setBleed] = useState(40); // mirrors layout horizontalPadding
  const [isMobile, setIsMobile] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const loadProjects = async () => {
    setProjectsLoading(true);
    try {
      const res = await fetch('/api/ai/budget-generator');
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (e) {
      console.error("Falha ao buscar projetos", e);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(e => console.error("Erro ao carregar dados do usuário logado:", e));
  }, []);

  const handleStartNewProject = () => {
    setHtmlContent('');
    setProjectId(null);
    setExportedCount(0);
    setImages([]);
    setNotes('');
    setProjectType('');
    setServices([]);
    
    // Pre-populate contractor details using onboarding information
    if (currentUser) {
      setContractorName(currentUser.business_name || currentUser.name || '');
      setContractorCnpj(currentUser.pix_key || '');
      setContractorAddress(currentUser.business_description || '');
    } else {
      setContractorName('');
      setContractorCnpj('');
      setContractorAddress('');
    }
    
    setClientName('');
    setClientDoc('');
    setClientAddress('');
    setChatHistory([]);
    setStep(1);
  };

  const handleLoadProject = async (projId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/budget-generator?project_id=${projId}`);
      const data = await res.json();
      if (data.project) {
        const p = data.project;
        setProjectId(p.id);
        setHtmlContent(p.content_html);
        setProjectType(p.name.replace('Obra - ', ''));
        setClientName(p.client_name || '');
        setClientDoc(p.client_doc || '');
        setClientAddress(p.client_address || '');
        setChatHistory([{ role: 'ai', text: '✅ Contrato reaberto! Você pode continuar lapidando escrevendo qualquer alteração no chat abaixo.' }]);
        setStep(4);
      } else {
        alert('Erro ao carregar o projeto.');
      }
    } catch (e) {
      alert('Erro de conexão ao reabrir.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projId) => {
    if (!confirm('Deseja realmente excluir este contrato? Esta ação é irreversível.')) return;
    try {
      const res = await fetch(`/api/ai/budget-generator?project_id=${projId}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== projId));
      } else {
        alert('Erro ao excluir.');
      }
    } catch (e) {
      alert('Erro de conexão ao excluir.');
    }
  };

  useEffect(() => {
    const check = () => {
      setBleed(window.innerWidth >= 768 ? 40 : 24);
      setIsMobile(window.innerWidth < 1024);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Step 1 - Escopo
  const [projectType, setProjectType] = useState('');
  const [services, setServices] = useState([]);

  // Step 2 - Partes do contrato
  const [contractorName, setContractorName] = useState('');
  const [contractorCnpj, setContractorCnpj] = useState('');
  const [contractorAddress, setContractorAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientDoc, setClientDoc] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  // Step 3 - Condições financeiras
  const [notes, setNotes] = useState('');

  // Step 4 - Editor
  const [htmlContent, setHtmlContent] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [images, setImages] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportedCount, setExportedCount] = useState(0);
  const [chatHistory, setChatHistory] = useState([]);

  const fileInputRef = useRef(null);
  const countdownRef = useRef(null);
  const chatEndRef = useRef(null);

  const startCountdown = (s) => {
    setCountdown(s);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(p => { if (p <= 1) { clearInterval(countdownRef.current); return 0; } return p - 1; });
    }, 1000);
  };

  useEffect(() => () => clearInterval(countdownRef.current), []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleImageUpload = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages(prev => [...prev, { mime: file.type, base64: ev.target.result.split(',')[1], preview: ev.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    startCountdown(30);
    const fullNotes = `
CONTRATADA: ${contractorName} | CNPJ: ${contractorCnpj} | Endereço: ${contractorAddress}
CONTRATANTE: ${clientName} | CPF/CNPJ: ${clientDoc} | Endereço: ${clientAddress}
CONDIÇÕES: ${notes}
    `.trim();
    try {
      const res = await fetch('/api/ai/budget-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_initial',
          project_type: projectType,
          services,
          notes: fullNotes,
          images: images.map(i => ({ mime: i.mime, base64: i.base64 })),
          client_name: clientName,
          client_doc: clientDoc,
          client_address: clientAddress
        })
      });
      const data = await res.json();
      clearInterval(countdownRef.current); setCountdown(0);
      if (data.html) {
        setHtmlContent(data.html);
        setProjectId(data.project_id);
        setChatHistory([{ role: 'ai', text: '✅ Contrato gerado! Clique nas sugestões ou escreva abaixo para ajustar qualquer cláusula, valor ou prazo.' }]);
        setStep(4);
      } else alert('Erro: ' + (data.error || 'resposta inválida'));
    } catch { alert('Erro ao gerar. Verifique sua conexão.'); }
    finally { setLoading(false); clearInterval(countdownRef.current); setCountdown(0); }
  };

  const handleChatEdit = async (inputOverride) => {
    const input = (inputOverride || chatInput).trim();
    if (!input) return;
    setChatInput('');
    setChatHistory(p => [...p, { role: 'user', text: input }]);
    setLoading(true);
    startCountdown(20);
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
      clearInterval(countdownRef.current); setCountdown(0);
      if (data.html) {
        setHtmlContent(data.html);
        setImages([]);
        setChatHistory(p => [...p, { role: 'ai', text: data.ai_response || '✅ Documento atualizado! Revise a prévia ao lado.' }]);
      }
    } catch { setChatHistory(p => [...p, { role: 'ai', text: '❌ Erro ao editar. Tente novamente.' }]); }
    finally { setLoading(false); clearInterval(countdownRef.current); setCountdown(0); }
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
      if (data.success) { setExportedCount(data.count); alert(`✅ ${data.count} cobrança(s) criada(s) no painel Pix!`); }
      else alert('Erro: ' + data.error);
    } catch { alert('Erro na exportação.'); }
    finally { setExportLoading(false); }
  };

  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para fazer o download do PDF.');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Contrato - ${projectType || 'Obra'}</title>
          <style>
            body {
              font-family: Georgia, serif;
              padding: 40px;
              color: #111;
              line-height: 1.6;
              font-size: 14px;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const btnPrimary = { background: '#10b981', color: '#070913', border: 'none', fontWeight: 700, borderRadius: 12, cursor: 'pointer', fontSize: 14, transition: 'opacity 0.2s' };
  const btnGhost = { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid #334155', fontWeight: 700, borderRadius: 12, cursor: 'pointer', fontSize: 14 };
  const btnDisabled = { background: 'var(--bg-surface)', color: '#475569', border: '1px solid #334155', fontWeight: 700, borderRadius: 12, cursor: 'not-allowed', fontSize: 14, opacity: 0.6 };

  // ────────────────────────── RENDER ──────────────────────────
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: 'var(--text-primary)' }}>

      <div style={{ marginBottom: isMobile ? 16 : 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', margin: 0 }}>🏗️ Obras e Orçamentos</h2>
          {!isMobile && (
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2, marginBottom: 0 }}>Gere propostas comerciais, diários de obra e contratos inteligentes com o Catarina Copilot.</p>
          )}
        </div>
        {step > 0 && (
          <button 
            onClick={() => { setStep(0); loadProjects(); }}
            style={{ ...btnGhost, padding: '8px 14px', borderRadius: 10, fontSize: 11, cursor: 'pointer' }}
          >
            ← Painel
          </button>
        )}
      </div>

      {/* ── STEP 0: DASHBOARD GERAL DE OBRAS ── */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Header Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Seus Contratos e Orçamentos Salvos
            </span>
            <button 
              onClick={handleStartNewProject}
              style={{ ...btnPrimary, padding: '12px 20px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(16,185,129,0.2)' }}
            >
              <span>🏗️</span> Criar Nova Obra
            </button>
          </div>

          {projectsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', padding: '60px 0' }}>
              <div style={{ width: 32, height: 32, border: '4px solid rgba(16,185,129,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 12 }}></div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Buscando seus contratos salvos...</p>
            </div>
          ) : projects.length === 0 ? (
            <div style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 20, padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 40, marginBottom: 16 }}>📝</span>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Nenhum contrato gerado ainda</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, maxWidth: 360, lineHeight: 1.5 }}>
                Crie seu primeiro projeto de engenharia ou reforma com o Catarina Copilot para automatizar seus escopos, termos e medições Pix.
              </p>
              <button 
                onClick={handleStartNewProject}
                style={{ ...btnPrimary, padding: '10px 18px', borderRadius: 8, marginTop: 16 }}
              >
                Começar Agora
              </button>
            </div>
          ) : isMobile ? (
            /* 📱 Mobile First Card List */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {projects.map(p => (
                <div key={p.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        🏗️ {p.name}
                      </h4>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                        Cliente: {p.client_name === 'Cliente Avulso' ? 'Avulso' : p.client_name}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 6 }}>
                      v{p.version || 1}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12 }}>
                    <span style={{ 
                      background: p.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      color: p.status === 'completed' ? '#34d399' : '#f59e0b',
                      padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700
                    }}>
                      {p.status === 'budgeting' ? 'Orçamento' : p.status === 'in_progress' ? 'Em Andamento' : 'Concluído'}
                    </span>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        onClick={() => handleLoadProject(p.id)}
                        style={{ ...btnPrimary, padding: '6px 12px', borderRadius: 8, fontSize: 11 }}
                      >
                        Lapidar
                      </button>
                      <button 
                        onClick={() => handleDeleteProject(p.id)}
                        style={{ ...btnGhost, padding: '6px 12px', borderRadius: 8, fontSize: 11, color: '#f87171' }}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 🖥️ Desktop Table view */
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e293b', background: '#0f172a' }}>
                      <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>Nome do Projeto</th>
                      <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>Cliente</th>
                      <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>Status</th>
                      <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>Versão</th>
                      <th style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', fontSize: 10, textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(30,41,59,0.5)', transition: 'background 0.15s' }}>
                        <td style={{ padding: '16px 18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          <span style={{ marginRight: 6 }}>🏗️</span> {p.name}
                        </td>
                        <td style={{ padding: '16px 18px', color: 'var(--text-secondary)' }}>
                          {p.client_name === 'Cliente Avulso' ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Avulso</span> : p.client_name}
                        </td>
                        <td style={{ padding: '16px 18px' }}>
                          <span style={{ 
                            background: p.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                            color: p.status === 'completed' ? '#34d399' : '#f59e0b',
                            padding: '4px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700
                          }}>
                            {p.status === 'budgeting' ? 'Orçamento' : p.status === 'in_progress' ? 'Em Andamento' : 'Concluído'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          v{p.version || 1}
                        </td>
                        <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => handleLoadProject(p.id)}
                              style={{ ...btnPrimary, padding: '6px 12px', borderRadius: 8, fontSize: 11 }}
                            >
                              Lapidar Orçamento
                            </button>
                            <button 
                              onClick={() => handleDeleteProject(p.id)}
                              style={{ ...btnGhost, padding: '6px 12px', borderRadius: 8, fontSize: 11, color: '#f87171' }}
                            >
                              Excluir
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
        </div>
      )}

      {/* ── STEP 1: ESCOPO ── */}
      {step === 1 && (
        <div style={stepStyle.outer}>
          <ProgressBar current={1} total={3} />
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>O que vamos construir ou reformar?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Descreva o projeto. Quanto mais detalhe, mais preciso o contrato.</p>
          </div>

          <div>
            <label style={stepStyle.label}>Descrição do projeto</label>
            <input
              style={stepStyle.input}
              placeholder="Ex: Pintura externa de prédio residencial 10 andares – Jardim de Sintra, SP"
              value={projectType}
              onChange={e => setProjectType(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#10b981'}
              onBlur={e => e.target.style.borderColor = '#1e293b'}
            />

          </div>

          <div>
            <label style={stepStyle.label}>Serviços incluídos</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Lavação de Fachada', 'Pintura Externa', 'Impermeabilização', 'Tratamento de Ferragem', 'Troca de Telhado', 'Fundação e Estrutura', 'Acabamento Interno', 'Elétrica e Hidráulica', 'Outros'].map(s => {
                const sel = services.includes(s);
                return (
                  <button key={s} onClick={() => setServices(p => sel ? p.filter(x => x !== s) : [...p, s])}
                    style={{ padding: '8px 14px', borderRadius: 10, border: sel ? '1.5px solid #10b981' : '1px solid #1e293b', background: sel ? 'rgba(16,185,129,0.12)' : '#0f172a', color: sel ? '#34d399' : '#94a3b8', fontSize: 13, cursor: 'pointer', fontWeight: sel ? 700 : 400, transition: 'all 0.15s' }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!projectType.trim()}
            style={{ ...(projectType.trim() ? btnPrimary : btnDisabled), padding: '14px 24px', boxShadow: projectType.trim() ? '0 4px 20px rgba(16,185,129,0.3)' : 'none' }}>
            Próximo Passo →
          </button>
        </div>
      )}

      {/* ── STEP 2: PARTES DO CONTRATO ── */}
      {step === 2 && (
        <div style={stepStyle.outer}>
          <ProgressBar current={2} total={3} />
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Quem assina o contrato?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Essas informações serão inseridas diretamente nas cláusulas do contrato.</p>
          </div>

          {/* CONTRATADA */}
          <div style={{ background: '#0b1220', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>🏢 Sua Empresa (Contratada / Prestador de Serviço)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={stepStyle.label}>Nome ou razão social da empresa</label>
                <input style={stepStyle.input} placeholder="Ex: Silva Construções e Reformas Ltda." value={contractorName} onChange={e => setContractorName(e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#1e293b'} />
              </div>
              <div style={stepStyle.row}>
                <div>
                  <label style={stepStyle.label}>CNPJ / CPF</label>
                  <input style={stepStyle.input} placeholder="00.000.000/0001-00" value={contractorCnpj} onChange={e => setContractorCnpj(e.target.value)}
                    onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#1e293b'} />
                </div>
                <div>
                  <label style={stepStyle.label}>Endereço</label>
                  <input style={stepStyle.input} placeholder="Rua, Nº, Cidade - UF" value={contractorAddress} onChange={e => setContractorAddress(e.target.value)}
                    onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#1e293b'} />
                </div>
              </div>
            </div>
          </div>

          {/* CONTRATANTE */}
          <div style={{ background: '#0b1220', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>👤 Cliente (Contratante / Tomador do Serviço)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={stepStyle.label}>Nome completo ou razão social do cliente</label>
                <input style={stepStyle.input} placeholder="Ex: João Carlos de Oliveira" value={clientName} onChange={e => setClientName(e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#1e293b'} />
              </div>
              <div style={stepStyle.row}>
                <div>
                  <label style={stepStyle.label}>CPF / CNPJ do cliente</label>
                  <input style={stepStyle.input} placeholder="000.000.000-00" value={clientDoc} onChange={e => setClientDoc(e.target.value)}
                    onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#1e293b'} />
                </div>
                <div>
                  <label style={stepStyle.label}>Endereço da obra</label>
                  <input style={stepStyle.input} placeholder="Rua, Nº, Cidade - UF" value={clientAddress} onChange={e => setClientAddress(e.target.value)}
                    onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#1e293b'} />
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 condições inline */}
          <div style={{ background: '#0b1220', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>💰 Condições Financeiras</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 500 }}>
              Explique aqui como e de que forma você vai receber pelo projeto.
            </p>
            <textarea style={stepStyle.textarea}
              placeholder="Descreva valor total, forma de pagamento e prazos. Ex: Valor total R$ 120.000. Pagamento 30% entrada, saldo em 2 medições..."
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setStep(1)} style={{ ...btnGhost, flex: 1, padding: '13px 0' }}>← Voltar</button>
            <button onClick={handleGenerate} disabled={loading || !contractorName.trim() || !clientName.trim()}
              style={{
                ...(loading || !contractorName.trim() || !clientName.trim() ? btnDisabled : btnPrimary),
                flex: 2, padding: '13px 0',
                boxShadow: (!loading && contractorName.trim() && clientName.trim()) ? '0 4px 20px rgba(16,185,129,0.3)' : 'none'
              }}>
              {loading ? `⏳ Gerando contrato... ${countdown > 0 ? `(~${countdown}s)` : ''}` : '✨ Gerar Contrato com IA'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: EDITOR ── */}
      {step === 4 && (
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          gap: 16, 
          width: `calc(100% + ${bleed * 2}px)`, 
          marginLeft: -bleed, 
          padding: `0 ${bleed}px`, 
          height: isMobile ? 'auto' : 'calc(100vh - 160px)', 
          minHeight: isMobile ? 'none' : 600, 
          boxSizing: 'border-box' 
        }}>

          {/* PREVIEW */}
          <div style={{ 
            flex: isMobile ? 'none' : 2, 
            height: isMobile ? '500px' : '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            borderRadius: 12, 
            overflow: 'hidden', 
            border: '1px solid var(--border-color)', 
            minWidth: 0 
          }}>
            {/* Barra do documento */}
            <div style={{ background: '#0f172a', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(239,68,68,0.5)' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(234,179,8,0.5)' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(16,185,129,0.5)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>Pré-visualização do Contrato</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {!loading && htmlContent && (
                  <button 
                    onClick={handleDownloadPdf}
                    style={{ 
                      background: '#10b981', 
                      color: '#070913', 
                      border: 'none', 
                      padding: '4px 10px', 
                      borderRadius: 6, 
                      fontSize: 11, 
                      fontWeight: 700, 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
                    onMouseLeave={e => e.currentTarget.style.opacity = 1}
                  >
                    📥 Baixar PDF
                  </button>
                )}
                
                {loading && <span style={{ fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                  Catarina processando... {countdown > 0 ? `${countdown}s` : ''}
                </span>}
              </div>
            </div>
            {/* Conteúdo */}
            <div style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#374151', opacity: 0.5 }}>
                  <div style={{ fontSize: 40, marginBottom: 12, animation: 'spin 1s linear infinite' }}>🐍</div>
                  <p style={{ fontWeight: 700, margin: 0 }}>Catarina reescrevendo o documento...</p>
                  {countdown > 0 && (
                    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 140, height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#10b981', borderRadius: 2, transition: 'width 1s linear', width: `${Math.min(100, (1 - countdown / 30) * 100)}%` }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>~{countdown}s</span>
                    </div>
                  )}
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: htmlContent }}
                  style={{ padding: isMobile ? '24px 16px' : '40px 48px', fontSize: 13, lineHeight: 1.75, fontFamily: 'Georgia, serif', color: '#111' }} />
              )}
            </div>
          </div>

          {/* PAINEL COPILOT */}
          <div style={{ 
            width: isMobile ? '100%' : 300, 
            flexShrink: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 12,
            height: isMobile ? 'auto' : '100%'
          }}>

            {/* Chat box */}
            <div style={{ 
              flex: isMobile ? 'none' : 1, 
              height: isMobile ? '450px' : 'auto',
              background: 'var(--bg-surface)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 12, 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden', 
              minHeight: 0 
            }}>

              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ fontWeight: 700, color: '#10b981', fontSize: 13 }}>Catarina Copilot 🪄</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: 20, fontWeight: 700, letterSpacing: '0.05em' }}>IA</span>
              </div>

              {/* Histórico do chat */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
                {chatHistory.length <= 1 && (
                  <div style={{ 
                    position: 'absolute', 
                    inset: '20px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    textAlign: 'center', 
                    opacity: 0.18,
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}>
                    <span style={{ fontSize: 32, marginBottom: 8 }}>🐍</span>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Catarina Copilot Ativa</p>
                    <p style={{ fontSize: 11, marginTop: 4, lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                      Escreva abaixo as alterações que deseja fazer no contrato.<br />
                      Ex: "Altere o valor para R$ 90.000" ou "Adicione garantia de 5 anos".
                    </p>
                  </div>
                )}
                {chatHistory.map((m, i) => (
                  <div key={i} style={{
                    padding: '8px 12px', borderRadius: 10, fontSize: 11, lineHeight: 1.5, maxWidth: '95%',
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    background: m.role === 'user' ? 'rgba(16,185,129,0.15)' : '#1e293b',
                    color: m.role === 'user' ? '#34d399' : '#94a3b8',
                    border: m.role === 'user' ? '1px solid rgba(16,185,129,0.25)' : '1px solid #334155',
                  }}>
                    {m.text}
                  </div>
                ))}
                {loading && (
                  <div style={{ padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 10, fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🐍</span>
                    Catarina está pensando...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Imagens anexadas em linha horizontal rolável para não empurrar o layout */}
              {images.length > 0 && (
                <div style={{ padding: '6px 12px', display: 'flex', gap: 6, overflowX: 'auto', borderTop: '1px solid #1e293b', flexShrink: 0, scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="scrollbar-none">
                  {images.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: 36, height: 36, borderRadius: 6, overflow: 'hidden', border: '1px solid #334155', flexShrink: 0 }}>
                      <img src={img.preview} alt="foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => setImages(p => p.filter((_, i) => i !== idx))}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', color: 'var(--text-primary)', fontSize: 10, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input */}
              <div style={{ padding: '10px 12px', borderTop: '1px solid #1e293b', display: 'flex', gap: 8, flexShrink: 0 }}>
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                <button onClick={() => fileInputRef.current?.click()} title="Anexar foto da vistoria"
                  style={{ ...btnGhost, padding: '8px 10px', borderRadius: 8, fontSize: 15, flexShrink: 0 }}>
                  📷
                </button>
                <input
                  style={{ flex: 1, minWidth: 0, padding: '8px 12px', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }}
                  placeholder="Ex: Adicione garantia de 5 anos..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && handleChatEdit()}
                  onFocus={e => e.target.style.borderColor = '#10b981'}
                  onBlur={e => e.target.style.borderColor = '#1e293b'}
                />
                <button onClick={() => handleChatEdit()} disabled={loading || !chatInput.trim()}
                  style={{ ...(loading || !chatInput.trim() ? btnDisabled : btnPrimary), padding: '8px 14px', borderRadius: 8, fontSize: 14, flexShrink: 0 }}>
                  →
                </button>
              </div>
            </div>

            {/* Sincronização financeira */}
            <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: 16, flexShrink: 0 }}>
              <p style={{ fontWeight: 700, color: '#10b981', fontSize: 13, marginBottom: 6 }}>⚡ Sincronização Financeira</p>
              <p style={{ fontSize: 11, color: 'rgba(167,243,208,0.6)', marginBottom: 12, lineHeight: 1.5 }}>
                Orçamento aprovado? A IA extrai as parcelas e cria cobranças Pix direto no painel.
              </p>
              <button onClick={handleExportCharges} disabled={exportLoading}
                style={{ ...btnPrimary, width: '100%', padding: '10px 0', borderRadius: 8, fontSize: 12, opacity: exportLoading ? 0.7 : 1 }}>
                {exportLoading ? '⏳ Extraindo...' : exportedCount > 0 ? `✅ ${exportedCount} Pagamentos Exportados` : '💸 Extrair Pagamentos'}
              </button>
            </div>

            {/* Novo orçamento */}
            <button onClick={() => { setStep(1); setHtmlContent(''); setProjectId(null); setExportedCount(0); setImages([]); setNotes(''); setProjectType(''); setServices([]); setContractorName(''); setContractorCnpj(''); setContractorAddress(''); setClientName(''); setClientDoc(''); setClientAddress(''); setChatHistory([]); }}
              style={{ background: 'transparent', border: 'none', color: '#475569', fontSize: 12, cursor: 'pointer', padding: '4px 0', textAlign: 'center' }}>
              ← Criar novo orçamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
