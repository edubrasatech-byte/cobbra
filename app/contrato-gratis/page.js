'use client';
import { useState, useRef, useEffect } from 'react';
import OnboardingModal from '@/app/components/OnboardingModal';

const PROMPT_SUGGESTIONS = [
  { icon: '💰', text: 'Mude a forma de pagamento para 50% de sinal e 50% na entrega' },
  { icon: '📅', text: 'Adicione multa de 10% por atraso no pagamento e juros de 1% ao dia' },
  { icon: '🚗', text: 'Inclua cláusula de quilometragem livre e taxa de higienização de R$ 150' },
  { icon: '⚖️', text: 'Adicione cláusula de rescisão contratual com aviso prévio de 30 dias' },
  { icon: '🔄', text: 'Troque o prazo de vigência para 12 meses renováveis' },
  { icon: '✍️', text: 'Adicione campo de assinatura eletrônica ao final' },
  { icon: '⚡', text: 'Adicione multa contratual por descumprimento de prazos' },
  { icon: '📋', text: 'Inclua escopo detalhado de responsabilidade sobre avarias e sinistros' },
];

const stepStyle = {
  outer: { display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680, width: '100%' },
  label: { fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 },
  input: { width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f1f5f9', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  textarea: { width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f1f5f9', fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', minHeight: 100 },
  select: { width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#f1f5f9', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', cursor: 'pointer' },
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
            background: current > n ? '#059669' : current === n ? '#10b981' : '#334155',
            color: current > n ? '#fff' : current === n ? '#000' : '#94a3b8',
          }}>
            {current > n ? '✓' : n}
          </div>
          {idx < total - 1 && <div style={{ width: 32, height: 2, background: current > n ? '#10b981' : '#334155', borderRadius: 1 }} />}
        </div>
      ))}
      <span style={{ marginLeft: 8, fontSize: 12, color: '#64748b' }}>Passo {current} de {total}</span>
    </div>
  );
}

export default function ContratoGratisPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [guestSessionId, setGuestSessionId] = useState('');
  
  // Onboarding Trigger State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [onboardCallbackAction, setOnboardCallbackAction] = useState(''); // 'download_pdf' or 'export_charges'
  const [registeredUser, setRegisteredUser] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportedCount, setExportedCount] = useState(0);

  // Form Fields
  const [projectType, setProjectType] = useState('Locação de Veículos');
  const [services, setServices] = useState(['Manutenção Preventiva', 'Seguro Casco Incluso', 'Substituição de Veículo Reserva']);
  const [notes, setNotes] = useState('Aluguel de Chevrolet Onix 1.0 Flex pelo valor mensal de R$ 2.500,00, com diárias adicionais pro-rata de R$ 90,00. Km livre. Caução no valor de R$ 1.500,00 paga via Pix no ato de retirada.');
  
  const [contractorName, setContractorName] = useState('');
  const [contractorCnpj, setContractorCnpj] = useState('');
  const [contractorAddress, setContractorAddress] = useState('');
  const [contractorPhone, setContractorPhone] = useState('');
  const [contractorEmail, setContractorEmail] = useState('');

  const [clientName, setClientName] = useState('');
  const [clientDoc, setClientDoc] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  const [htmlContent, setHtmlContent] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const countdownRef = useRef(null);

  useEffect(() => {
    // Generate/Get Guest Session ID
    let gId = localStorage.getItem('guest_session_id');
    if (!gId) {
      gId = 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('guest_session_id', gId);
    }
    setGuestSessionId(gId);

    const checkMobile = () => setIsMobile(window.innerWidth < 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const startCountdown = (sec) => {
    setCountdown(sec);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleGenerate = async () => {
    setLoading(true);
    startCountdown(45);
    const fullNotes = `
CONTRATADA: ${contractorName} | CNPJ/CPF: ${contractorCnpj} | Endereço: ${contractorAddress} | Telefone: ${contractorPhone} | E-mail: ${contractorEmail}
CONTRATANTE: ${clientName} | CPF/CNPJ: ${clientDoc} | Endereço: ${clientAddress}
CONDIÇÕES COMERCIAIS & DETALHES DA LOCAÇÃO OU SERVIÇO: ${notes}
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
          images: [],
          client_name: clientName,
          client_doc: clientDoc,
          client_address: clientAddress,
          guest_session_id: guestSessionId
        })
      });
      const data = await res.json();
      clearInterval(countdownRef.current); 
      setCountdown(0);

      if (data.html) {
        setHtmlContent(data.html);
        setProjectId(data.project_id);
        setChatHistory([{ role: 'ai', text: '✅ Contrato elaborado com sucesso! Eu sou a Catarina AI Copilot. Você pode reescrever qualquer cláusula, alterar valores de juros, incluir termos de devolução de locação ou regras de cobrança simplesmente digitando no chat abaixo! 👇' }]);
        setStep(4);
      } else {
        alert('Erro ao gerar: ' + (data.error || 'resposta inválida'));
      }
    } catch (e) { 
      alert('Erro ao gerar contrato. Por favor, tente novamente.'); 
    } finally { 
      setLoading(false); 
      if (countdownRef.current) clearInterval(countdownRef.current); 
      setCountdown(0); 
    }
  };

  const handleChatEdit = async (inputOverride) => {
    const input = (inputOverride || chatInput).trim();
    if (!input) return;
    setChatInput('');
    setChatHistory(p => [...p, { role: 'user', text: input }]);
    setLoading(true);
    startCountdown(30);

    try {
      const res = await fetch('/api/ai/budget-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit_document',
          project_id: projectId,
          prompt: input,
          notes: htmlContent,
          images: [],
          guest_session_id: guestSessionId
        })
      });

      const data = await res.json();
      clearInterval(countdownRef.current); 
      setCountdown(0);

      if (data.html) {
        setHtmlContent(data.html);
        setChatHistory(p => [...p, { role: 'ai', text: data.ai_response || '✅ Documento ajustado! Você pode conferir os novos termos no painel de visualização ao lado.' }]);
      } else {
        setChatHistory(p => [...p, { role: 'ai', text: '⚠️ Tive um probleminha para ajustar o documento. Poderia reformular o pedido?' }]);
      }
    } catch { 
      setChatHistory(p => [...p, { role: 'ai', text: '❌ Erro de conexão ao enviar ajuste.' }]); 
    } finally { 
      setLoading(false); 
      if (countdownRef.current) clearInterval(countdownRef.current); 
      setCountdown(0); 
    }
  };

  // Funil PLG: Trigger onboarding before export actions
  const triggerOnboard = (actionType) => {
    if (registeredUser) {
      // User is already registered in this session
      executeAuthorizedAction(actionType, registeredUser);
    } else {
      setOnboardCallbackAction(actionType);
      setIsModalOpen(true);
    }
  };

  const executeAuthorizedAction = async (actionType, userObj) => {
    // 1. Link guest projects to registered user
    try {
      await fetch('/api/ai/budget-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'link_guest_project',
          guest_session_id: guestSessionId
        })
      });
    } catch (e) {
      console.error("Erro ao vincular projeto do convidado:", e);
    }

    if (actionType === 'download_pdf') {
      handleDownloadPdf();
    } else if (actionType === 'export_charges') {
      await handleExportCharges();
    }
  };

  const handleOnboardSuccess = (user) => {
    setRegisteredUser(user);
    executeAuthorizedAction(onboardCallbackAction, user);
  };

  const handleExportCharges = async () => {
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
        alert(`🎉 Sucesso absoluto! ${data.count} cobrança(s) Pix foram cadastradas e a régua de lembretes automáticos via WhatsApp foi ativada para o seu cliente!`);
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        alert('Erro ao exportar: ' + data.error);
      }
    } catch {
      alert('Erro na exportação para o Pix.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, autorize pop-ups para realizar a exportação do PDF.');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>${projectType || 'Contrato'}</title>
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

  const handleAddService = (srv) => {
    if (!srv.trim()) return;
    if (services.includes(srv)) return;
    setServices([...services, srv]);
  };

  const handleRemoveService = (srv) => {
    setServices(services.filter(s => s !== srv));
  };

  // Button styles matching emerald theme
  const btnPrimary = { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', border: 'none', fontWeight: 700, borderRadius: 12, cursor: 'pointer', fontSize: 14, transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)' };
  const btnGhost = { background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', fontWeight: 700, borderRadius: 12, cursor: 'pointer', fontSize: 14, transition: 'all 0.2s' };
  const btnDisabled = { background: '#1e293b', color: '#475569', border: '1px solid #334155', fontWeight: 700, borderRadius: 12, cursor: 'not-allowed', fontSize: 14, opacity: 0.6 };

  return (
    <div style={{
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif",
      color: '#f1f5f9',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Dynamic Background Mesh */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 600,
        backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(16, 185, 129, 0.15), transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <header style={{
        borderBottom: '1px solid #1e293b',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>🐍</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
            Cobbra <span style={{ color: '#10b981', fontSize: 12, fontWeight: 500, padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 20, marginLeft: 6 }}>Catarina Copilot</span>
          </span>
        </div>
        <a 
          href="/" 
          style={{
            color: '#cbd5e1',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.color = '#10b981'}
          onMouseOut={(e) => e.target.style.color = '#cbd5e1'}
        >
          Voltar para Home ➜
        </a>
      </header>

      {/* Main Container */}
      <main style={{
        flex: 1,
        padding: isMobile ? '24px 16px' : '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        {step < 4 ? (
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 24,
            padding: isMobile ? '24px' : '40px',
            width: '100%',
            maxWidth: 680,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            boxSizing: 'border-box'
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', marginBottom: 6, letterSpacing: '-0.5px' }}>
              Gerador de Contrato e Lembretes Pix Grátis
            </h2>
            <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24, lineHeight: 1.5 }}>
              Crie termos jurídicos impecáveis em segundos com auxílio da nossa IA Catarina. Qualifique as partes e receba seus pagamentos Pix com taxa 0%.
            </p>

            <ProgressBar current={step} total={3} />

            {/* STEP 1: CONTRATO */}
            {step === 1 && (
              <div style={stepStyle.outer}>
                <div>
                  <label style={stepStyle.label}>Qual o Objeto / Tipo de Contrato? *</label>
                  <select 
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    style={stepStyle.select}
                  >
                    <option value="Locação de Veículos e Frotas">🚗 Locação de Carros / Frotas de Veículos</option>
                    <option value="Contrato de Empréstimo a Juros">💰 Empréstimos e Microcrédito Pessoal</option>
                    <option value="Locação de Equipamentos e Ferramentas">🛠️ Locação de Máquinas e Equipamentos</option>
                    <option value="Aluguel de Imóvel por Temporada">🏡 Aluguel de Imóvel e Temporada</option>
                    <option value="Prestação de Serviços Gerais">💼 Prestação de Serviços / Freelancer</option>
                  </select>
                </div>

                <div>
                  <label style={stepStyle.label}>O que está incluso? (Serviços / Cláusulas chave)</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input 
                      type="text" 
                      id="new-service-input"
                      placeholder="Ex: Cobrança diária por atraso de R$ 50" 
                      style={stepStyle.input}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddService(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('new-service-input');
                        if (input) {
                          handleAddService(input.value);
                          input.value = '';
                        }
                      }}
                      style={{ ...btnGhost, padding: '0 16px', borderRadius: 10 }}
                    >
                      +
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {services.map(s => (
                      <span key={s} style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: 20,
                        padding: '6px 12px',
                        fontSize: 12,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        color: '#cbd5e1'
                      }}>
                        {s}
                        <button 
                          onClick={() => handleRemoveService(s)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontWeight: 700 }}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={stepStyle.label}>Valores, Datas de Pagamento e Condições Especiais *</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Descreva detalhadamente o valor do aluguel ou empréstimo, a taxa de juros diária de atraso, o valor das diárias e as chaves Pix combinadas."
                    style={stepStyle.textarea}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button 
                    onClick={() => setStep(2)}
                    style={{ ...btnPrimary, padding: '14px 28px' }}
                  >
                    Próximo Passo ➜
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CONTRATADA */}
            {step === 2 && (
              <div style={stepStyle.outer}>
                <div>
                  <label style={stepStyle.label}>Nome Completo / Razão Social (Sua Empresa) *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Locadora Prime Ltda" 
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    style={stepStyle.input}
                  />
                </div>

                <div style={stepStyle.row}>
                  <div>
                    <label style={stepStyle.label}>CNPJ / CPF *</label>
                    <input 
                      type="text" 
                      placeholder="00.000.000/0001-00" 
                      value={contractorCnpj}
                      onChange={(e) => setContractorCnpj(e.target.value)}
                      style={stepStyle.input}
                    />
                  </div>
                  <div>
                    <label style={stepStyle.label}>WhatsApp com DDD *</label>
                    <input 
                      type="tel" 
                      placeholder="41999998888" 
                      value={contractorPhone}
                      onChange={(e) => setContractorPhone(e.target.value)}
                      style={stepStyle.input}
                    />
                  </div>
                </div>

                <div style={stepStyle.row}>
                  <div>
                    <label style={stepStyle.label}>Seu E-mail *</label>
                    <input 
                      type="email" 
                      placeholder="contato@empresa.com" 
                      value={contractorEmail}
                      onChange={(e) => setContractorEmail(e.target.value)}
                      style={stepStyle.input}
                    />
                  </div>
                  <div>
                    <label style={stepStyle.label}>Endereço Completo (Sede/Escritório)</label>
                    <input 
                      type="text" 
                      placeholder="Rua, Número, Bairro, Cidade - UF" 
                      value={contractorAddress}
                      onChange={(e) => setContractorAddress(e.target.value)}
                      style={stepStyle.input}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                  <button 
                    onClick={() => setStep(1)}
                    style={{ ...btnGhost, padding: '14px 28px' }}
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={() => setStep(3)}
                    style={{ ...btnPrimary, padding: '14px 28px' }}
                  >
                    Próximo Passo ➜
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CONTRATANTE */}
            {step === 3 && (
              <div style={stepStyle.outer}>
                <div>
                  <label style={stepStyle.label}>Nome Completo / Razão Social do Cliente *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Carlos Eduardo de Souza" 
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    style={stepStyle.input}
                  />
                </div>

                <div style={stepStyle.row}>
                  <div>
                    <label style={stepStyle.label}>CPF ou CNPJ do Cliente *</label>
                    <input 
                      type="text" 
                      placeholder="000.000.000-00" 
                      value={clientDoc}
                      onChange={(e) => setClientDoc(e.target.value)}
                      style={stepStyle.input}
                    />
                  </div>
                  <div>
                    <label style={stepStyle.label}>Endereço do Cliente</label>
                    <input 
                      type="text" 
                      placeholder="Av. Paulista, 1000 - São Paulo - SP" 
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      style={stepStyle.input}
                    />
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px dashed rgba(16, 185, 129, 0.2)',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 13,
                  color: '#a7f3d0',
                  lineHeight: 1.5,
                  marginTop: 12
                }}>
                  💡 <strong>Por que pedimos isso?</strong> A qualificação jurídica das partes torna o contrato válido na justiça em caso de quebra contratual ou execução extrajudicial das garantias Pix.
                </div>

                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', marginTop: 12 }}>
                  <button 
                    onClick={() => setStep(2)}
                    style={{ ...btnGhost, padding: '14px 28px' }}
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={handleGenerate}
                    disabled={!contractorName || !clientName}
                    style={{
                      ...(!contractorName || !clientName ? btnDisabled : btnPrimary),
                      padding: '14px 28px'
                    }}
                  >
                    Elaborar Contrato com IA ➜
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* STEP 4: INTERACTIVE EDITOR WITH SIDE-BY-SIDE PREVIEW */
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '360px 1fr',
            gap: 24,
            width: '100%',
            maxWidth: 1400,
            height: isMobile ? 'auto' : 'calc(100vh - 160px)',
            minHeight: 500,
            boxSizing: 'border-box'
          }}>
            {/* Left: Catarina Copilot Panel */}
            <div style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 20,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
            }}>
              {/* Copilot Header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #334155',
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18
                }}>
                  🐍
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Catarina Copilot</h4>
                  <span style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                    Online e pronta
                  </span>
                </div>
              </div>

              {/* Chat Feed */}
              <div style={{
                flex: 1,
                padding: 16,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                {chatHistory.map((msg, i) => (
                  <div key={i} style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '12px 14px',
                    borderRadius: 14,
                    fontSize: 13,
                    lineHeight: 1.5,
                    backgroundColor: msg.role === 'user' ? '#10b981' : '#0f172a',
                    color: msg.role === 'user' ? '#070913' : '#cbd5e1',
                    border: msg.role === 'user' ? 'none' : '1px solid #334155'
                  }}>
                    {msg.text}
                  </div>
                ))}
                {loading && (
                  <div style={{
                    alignSelf: 'flex-start',
                    padding: '12px 14px',
                    borderRadius: 14,
                    fontSize: 13,
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span className="animate-spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #94a3b8', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    {countdown > 0 ? `Catarina está trabalhando (${countdown}s)...` : 'Processando alteração...'}
                  </div>
                )}
              </div>

              {/* Suggestions Panel */}
              <div style={{
                padding: '8px 12px',
                borderTop: '1px solid #334155',
                background: '#0f172a',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                display: 'flex',
                gap: 8
              }}>
                {PROMPT_SUGGESTIONS.map((s, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleChatEdit(s.text)}
                    disabled={loading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 16,
                      padding: '6px 12px',
                      fontSize: 11,
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.backgroundColor = '#111827'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
                  >
                    <span>{s.icon}</span> {s.text}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div style={{
                padding: 16,
                borderTop: '1px solid #334155',
                backgroundColor: '#1e293b'
              }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Peça alterações para a Catarina..."
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleChatEdit();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: 10,
                      color: '#ffffff',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                  <button 
                    onClick={() => handleChatEdit()}
                    disabled={loading || !chatInput.trim()}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: '#fff',
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      cursor: loading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    ➜
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Contract Render Page & Conversions */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden'
            }}>
              {/* Top export banner */}
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 16,
                padding: '16px 20px',
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>
                    Seu Contrato está Pronto e Qualificado! 🎉
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#a7f3d0' }}>
                    Você pode baixar o PDF oficial agora ou ativar o disparo automático de cobranças no Pix.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    onClick={() => triggerOnboard('download_pdf')}
                    style={{ ...btnGhost, padding: '10px 18px', fontSize: 13 }}
                  >
                    🖨️ Baixar PDF Oficial
                  </button>
                  <button 
                    onClick={() => triggerOnboard('export_charges')}
                    disabled={exportLoading}
                    style={{ ...btnPrimary, padding: '10px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {exportLoading ? 'Ativando...' : '⚡ Ligar Cobrança Automática Pix'}
                  </button>
                </div>
              </div>

              {/* Scrollable Document Render Area */}
              <div style={{
                flex: 1,
                backgroundColor: '#ffffff',
                color: '#1e293b',
                borderRadius: 20,
                padding: isMobile ? 20 : 40,
                overflowY: 'auto',
                boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)',
                border: '1px solid #334155'
              }}>
                {/* HTML Document Inject */}
                <div 
                  dangerouslySetInnerHTML={{ __html: htmlContent }} 
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Onboarding Trigger Modal */}
      <OnboardingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleOnboardSuccess}
      />
    </div>
  );
}
