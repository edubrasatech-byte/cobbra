'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const NICHES = [
  { id: 'locacao_veiculos', label: '🚗 Locação de Veículos', desc: 'Controle de frotas, diárias, alertas de quilometragem e devoluções.' },
  { id: 'emprestimo', label: '💰 Empréstimos e Finanças', desc: 'Controle de parcelas, juros contratuais estritos e cobranças rígidas.' },
  { id: 'construcao_civil', label: '🏗️ Construção Civil & Reformas', desc: 'Geração de contratos por IA, medições e diários de obra inteligentes.' },
  { id: 'clinica', label: '🩺 Clínica e Consultório', desc: 'Régua altamente diplomática para preservar a relação médica.' },
  { id: 'personal', label: '🏋️‍♂️ Personal Trainer / Fitness', desc: 'Foco na recorrência de planos de treinos e energia profissional.' },
  { id: 'estetica', label: '🌸 Estética e Beleza', desc: 'Lembretes amigáveis focados em confirmação de horários.' },
  { id: 'educacao', label: '🎓 Cursos e Educação', desc: 'Mensalidades de turmas, materiais e acesso a plataformas.' },
  { id: 'geral', label: '💼 Freelancer e Serviços Gerais', desc: 'Régua comercial limpa, direta, ágil e profissional.' }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // URL Query Parameters (PLG)
  const [source, setSource] = useState('');
  const [projectId, setProjectId] = useState('');
  const [targetAction, setTargetAction] = useState('');

  // Step 1 State
  const [businessName, setBusinessName] = useState('');

  // Step 2 State
  const [niche, setNiche] = useState('locacao_veiculos');
  const [nicheDetails, setNicheDetails] = useState(''); // Conditional questions based on Niche

  // Step 3 State
  const [businessAudience, setBusinessAudience] = useState('both'); // pf, pj, both
  const [defaultRateGoal, setDefaultRateGoal] = useState('medium'); // low, medium, high
  const [monthlyVolume, setMonthlyVolume] = useState('10k-50k'); // <10k, 10k-50k, >50k

  // Step 4 State
  const [pixKeyType, setPixKeyType] = useState('email');
  const [pixKey, setPixKey] = useState('');

  // Step 5 Tone / Preview Auto-Suggestion
  const [collectionRigor, setCollectionRigor] = useState('neutral');

  useEffect(() => {
    // 1. Fetch current logged-in user
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUser(d.user);
          if (d.user.business_name) setBusinessName(d.user.business_name);
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));

    // 2. Parse URL parameters
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setSource(params.get('source') || '');
      setProjectId(params.get('project_id') || '');
      setTargetAction(params.get('action') || '');
    }
  }, [router]);

  // Dynamically configure collection rigor and details when niche changes
  useEffect(() => {
    // Default sub-question reset
    if (niche === 'locacao_veiculos') {
      setNicheDetails('6-25'); // default fleet range
      setCollectionRigor('neutral');
    } else if (niche === 'emprestimo') {
      setNicheDetails('2k-10k'); // loan ticket
      setCollectionRigor('firm');
    } else if (niche === 'construcao_civil') {
      setNicheDetails('3-5'); // active projects
      setCollectionRigor('neutral');
    } else {
      setNicheDetails('11-50'); // clients count
      setCollectionRigor('gentle');
    }
  }, [niche]);

  // Dynamically adjust rigor suggestion based on Niche and Default Rate
  useEffect(() => {
    if (niche === 'emprestimo' || defaultRateGoal === 'high') {
      setCollectionRigor('firm');
    } else if (defaultRateGoal === 'low' || niche === 'clinica' || niche === 'estetica') {
      setCollectionRigor('gentle');
    } else {
      setCollectionRigor('neutral');
    }
  }, [niche, defaultRateGoal]);

  const handleNext = () => {
    if (step === 1 && !businessName.trim()) {
      alert('Por favor, informe o nome do seu negócio.');
      return;
    }
    if (step === 4 && !pixKey.trim()) {
      alert('Por favor, insira sua chave Pix para receber sem taxas.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const answers = {
        business_audience: businessAudience,
        monthly_volume: monthlyVolume,
        default_rate_goal: defaultRateGoal,
        niche_details: nicheDetails
      };

      // 1. Submit onboarding answers
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          business_niche: niche,
          collection_rigor: collectionRigor,
          pix_key: pixKey,
          pix_key_type: pixKeyType,
          onboarding_answers: answers
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar o onboarding.');

      // 2. Perform PLG Actions if source is 'contrato-gratis'
      if (source === 'contrato-gratis' && projectId) {
        const guestSessionId = localStorage.getItem('guest_session_id');

        // Link the guest projects and clients to the new account
        if (guestSessionId) {
          await fetch('/api/ai/budget-generator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'link_guest_project',
              guest_session_id: guestSessionId
            })
          });
        }

        // Trigger action
        if (targetAction === 'export_charges') {
          const exportRes = await fetch('/api/ai/budget-generator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'export_charges',
              project_id: projectId
            })
          });
          const exportData = await exportRes.json();
          if (exportData.success) {
            alert(`🎉 Cobrança exportada com sucesso! A régua Pix de WhatsApp foi configurada para o seu cliente.`);
          }
        } else if (targetAction === 'download_pdf') {
          // Open PDF print window directly
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            // Fetch document HTML content from API
            const docRes = await fetch(`/api/ai/budget-generator?project_id=${projectId}`).catch(() => null);
            if (docRes && docRes.ok) {
              const docData = await docRes.json();
              const contentHtml = docData.project?.content_html;
              if (contentHtml) {
                printWindow.document.write(`
                  <html>
                    <head><title>Contrato Cobbra</title><style>body { font-family: Georgia, serif; padding: 40px; color: #111; line-height: 1.6; font-size: 14px; }</style></head>
                    <body>
                      ${contentHtml}
                      <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
                    </body>
                  </html>
                `);
                printWindow.document.close();
              }
            }
          }
        }
      }

      // 3. Final Redirect to dashboard home
      window.location.href = '/dashboard?welcome=1';
    } catch (e) {
      alert('Erro ao concluir o setup: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Simulated WhatsApp Text Generator
  const getWhatsAppPreviewText = () => {
    const name = 'Carlos Silva';
    const amount = 'R$ 250,00';
    const date = 'amanhã';
    
    if (niche === 'locacao_veiculos') {
      const vehicle = 'Fiat Uno (ABC-1234)';
      if (collectionRigor === 'gentle') {
        return `Oi ${name}! 🚗 Passando para lembrar que o aluguel do carro *${vehicle}* vence ${date} (${amount}). Link Pix de renovação: {link}. Abraços! 💚`;
      } else if (collectionRigor === 'firm') {
        return `Aviso de Locação 🚗: O vencimento do veículo *${vehicle}* no valor de ${amount} é ${date}. Atrasos geram diárias contratuais adicionais. Pague via Pix: {link}`;
      } else {
        return `Olá ${name}! Lembramos que o aluguel do veículo *${vehicle}* (${amount}) vence ${date}. Pague pelo link Pix copia e cola: {link}`;
      }
    }

    if (niche === 'emprestimo') {
      if (collectionRigor === 'gentle') {
        return `Oi ${name}! Lembrete amigável: sua parcela de ${amount} vence ${date}. Segue o link Pix para pagamento: {link}. Qualquer dúvida, me chame!`;
      } else if (collectionRigor === 'firm') {
        return `Atenção ${name} ⚡: Sua parcela de empréstimo (${amount}) vence ${date}. Conforme contrato, o não pagamento acarretará multa contratual e juros diários. Pix: {link}`;
      } else {
        return `Olá ${name}. Sua parcela no valor de ${amount} vence ${date}. Efetue a quitação usando a chave Pix no link: {link}`;
      }
    }

    if (niche === 'construcao_civil') {
      if (collectionRigor === 'gentle') {
        return `Olá ${name}! 🏗️ Segue a cobrança Pix da medição da obra no valor de ${amount}. Vence ${date}. Fique à vontade para tirar dúvidas! Link Pix: {link}`;
      } else if (collectionRigor === 'firm') {
        return `Atenção ${name}. 🏗️ A medição da obra (${amount}) vence ${date}. O atraso poderá suspender as atividades programadas. Link Pix para pagamento: {link}`;
      } else {
        return `Olá ${name}. Enviamos o boleto Pix da medição atual no valor de ${amount} com vencimento para ${date}. Link: {link}`;
      }
    }

    // Default other niches
    if (collectionRigor === 'gentle') {
      return `Oi ${name}! 💚 Lembrete gentil de pagamento de sua fatura (${amount}) que vence ${date}. Agradecemos a parceria! Pix rápido: {link}`;
    } else if (collectionRigor === 'firm') {
      return `${name}, informamos que sua fatura de ${amount} vence ${date}. Evite juros e suspensão dos serviços efetuando o Pix no link: {link}`;
    } else {
      return `Olá, ${name}. Lembramos que sua fatura no valor de ${amount} vence ${date}. Segue o link de pagamento Pix: {link}`;
    }
  };

  // Format Pix Key input visually based on selection
  const formatPixKeyPlaceholder = () => {
    if (pixKeyType === 'cpf') return '000.000.000-00';
    if (pixKeyType === 'cnpj') return '00.000.000/0001-00';
    if (pixKeyType === 'phone') return '(11) 99999-9999';
    if (pixKeyType === 'email') return 'seu@email.com';
    return 'Chave aleatória de 36 caracteres';
  };

  // Custom styling tokens
  const obsidianBg = '#0C0E1A';
  const emeraldGlow = 'rgba(16, 185, 129, 0.1)';
  const activeBorder = '2px solid #10b981';
  const inactiveBorder = '1px solid #334155';

  return (
    <div style={{
      minHeight: '100vh',
      background: obsidianBg,
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background gradients */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 400,
        background: 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* Header bar */}
      <header style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 10,
        background: '#0C0E1A'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🐍</span>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px' }}>Setup Cobbra</span>
            {source === 'contrato-gratis' && (
              <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>PLG Ativação</span>
            )}
          </div>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Passo {step} de 5</span>
        </div>

        {/* Step Progress Bar */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4, 5].map((num) => (
            <div key={num} style={{
              flex: 1, height: 4, borderRadius: 2,
              backgroundColor: step >= num ? '#10b981' : 'rgba(255,255,255,0.06)',
              boxShadow: step >= num ? '0 0 8px rgba(16,185,129,0.5)' : 'none',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>
      </header>

      {/* Center content container */}
      <main className="onboarding-main">
        <div className="onboarding-card">

          {/* STEP 1: BUSINESS NAME */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <span style={{ fontSize: 32 }}>✨</span>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginTop: 12, letterSpacing: '-0.5px' }}>Como se chama o seu negócio?</h2>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, marginTop: 6 }}>
                  Olá, {user?.name ? user.name.split(' ')[0] : 'Parceiro'}! Vamos dar um nome oficial ao seu painel de recebimentos.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>Nome Comercial / Empresa</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex: Prime Veículos, Studio Pilates, Construtora Silva"
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #334155',
                    fontSize: 15, color: '#f8fafc', background: '#0f172a', outline: 'none', boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{
                background: 'rgba(16, 185, 129, 0.05)', border: '1px dashed rgba(16, 185, 129, 0.2)',
                borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center'
              }}>
                <span style={{ fontSize: 20 }}>🔒</span>
                <span style={{ fontSize: 12.5, color: '#a7f3d0', lineHeight: 1.4 }}>
                  Seus dados Pix e cadastros são 100% seguros e criptografados de ponta a ponta.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: NICHE & SUB-QUESTIONS */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>Qual o seu nicho de atuação?</h2>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, marginTop: 4 }}>
                  Escolha o setor principal. Catarina AI adaptará a linguagem dos lembretes e os relatórios do seu painel.
                </p>
              </div>

              {/* Grid selectors */}
              <div className="onboarding-grid-niches">
                {NICHES.map((item) => {
                  const isActive = niche === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setNiche(item.id)}
                      style={{
                        padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                        background: isActive ? 'rgba(16,185,129,0.06)' : '#0f172a',
                        border: isActive ? activeBorder : inactiveBorder,
                        transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 4
                      }}
                    >
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: isActive ? '#34d399' : '#f8fafc' }}>
                        {item.label}
                      </span>
                      <span style={{ fontSize: 10.5, color: '#64748b', lineHeight: 1.3 }}>
                        {item.desc}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Conditional sub-question (Fleet, loan ticket, or project volume) */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                {niche === 'locacao_veiculos' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>
                      Qual o tamanho da sua frota de veículos?
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { id: '1-5', label: '🚗 1 a 5 carros' },
                        { id: '6-25', label: '🚕 6 a 25 carros' },
                        { id: '25+', label: '🚛 Mais de 25' }
                      ].map((card) => (
                        <button
                          type="button" key={card.id}
                          onClick={() => setNicheDetails(card.id)}
                          style={{
                            flex: 1, padding: '12px 10px', borderRadius: 10, border: nicheDetails === card.id ? activeBorder : inactiveBorder,
                            background: nicheDetails === card.id ? 'rgba(16,185,129,0.05)' : '#0f172a', color: '#f8fafc',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          {card.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {niche === 'emprestimo' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>
                      Qual o valor do ticket médio emprestado?
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { id: '<2k', label: 'Até R$ 2k' },
                        { id: '2k-10k', label: 'R$ 2k a R$ 10k' },
                        { id: '>10k', label: 'Mais de R$ 10k' }
                      ].map((card) => (
                        <button
                          type="button" key={card.id}
                          onClick={() => setNicheDetails(card.id)}
                          style={{
                            flex: 1, padding: '12px 10px', borderRadius: 10, border: nicheDetails === card.id ? activeBorder : inactiveBorder,
                            background: nicheDetails === card.id ? 'rgba(16,185,129,0.05)' : '#0f172a', color: '#f8fafc',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          {card.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {niche === 'construcao_civil' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>
                      Quantas obras ativas você gerencia hoje?
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { id: '1-2', label: '🏗️ 1 a 2 obras' },
                        { id: '3-5', label: '🏗️ 3 a 5 obras' },
                        { id: '5+', label: '🏗️ Mais de 5' }
                      ].map((card) => (
                        <button
                          type="button" key={card.id}
                          onClick={() => setNicheDetails(card.id)}
                          style={{
                            flex: 1, padding: '12px 10px', borderRadius: 10, border: nicheDetails === card.id ? activeBorder : inactiveBorder,
                            background: nicheDetails === card.id ? 'rgba(16,185,129,0.05)' : '#0f172a', color: '#f8fafc',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          {card.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {niche !== 'locacao_veiculos' && niche !== 'emprestimo' && niche !== 'construcao_civil' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>
                      Quantos clientes ativos você possui?
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { id: '1-10', label: '1 a 10 clientes' },
                        { id: '11-50', label: '11 a 50 clientes' },
                        { id: '50+', label: 'Mais de 50' }
                      ].map((card) => (
                        <button
                          type="button" key={card.id}
                          onClick={() => setNicheDetails(card.id)}
                          style={{
                            flex: 1, padding: '12px 10px', borderRadius: 10, border: nicheDetails === card.id ? activeBorder : inactiveBorder,
                            background: nicheDetails === card.id ? 'rgba(16,185,129,0.05)' : '#0f172a', color: '#f8fafc',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          {card.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: AUDIENCE & STATISTICS */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>Perfil de Clientes e Faturamento</h2>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, marginTop: 4 }}>
                  Esses dados ajudam a modelar a régua de cobrança padrão e os indicadores financeiros do painel.
                </p>
              </div>

              {/* Target Audience */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>
                  Quem é o seu público-alvo principal?
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'pf', label: '👤 Pessoa Física (PF)' },
                    { id: 'pj', label: '🏢 Pessoa Jurídica (PJ)' },
                    { id: 'both', label: '👥 Ambos (PF e PJ)' }
                  ].map((card) => (
                    <button
                      type="button" key={card.id}
                      onClick={() => setBusinessAudience(card.id)}
                      style={{
                        flex: 1, padding: '12px 10px', borderRadius: 10, border: businessAudience === card.id ? activeBorder : inactiveBorder,
                        background: businessAudience === card.id ? 'rgba(16,185,129,0.05)' : '#0f172a', color: '#f8fafc',
                        fontSize: 11.5, fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      {card.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default rate status */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>
                  Qual a sua taxa de inadimplência (atrasos) hoje?
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: 'low', label: '🟢 Baixa (< 5%)' },
                    { id: 'medium', label: '🟡 Média (5% a 15%)' },
                    { id: 'high', label: '🔴 Alta (> 15%)' }
                  ].map((card) => (
                    <button
                      type="button" key={card.id}
                      onClick={() => setDefaultRateGoal(card.id)}
                      style={{
                        flex: 1, padding: '12px 10px', borderRadius: 10, border: defaultRateGoal === card.id ? activeBorder : inactiveBorder,
                        background: defaultRateGoal === card.id ? 'rgba(16,185,129,0.05)' : '#0f172a', color: '#f8fafc',
                        fontSize: 11.5, fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      {card.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimated monthly volume */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>
                  Volume de cobranças mensal estimado?
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { id: '<10k', label: 'Até R$ 10k' },
                    { id: '10k-50k', label: 'R$ 10k a R$ 50k' },
                    { id: '>50k', label: 'Mais de R$ 50k' }
                  ].map((card) => (
                    <button
                      type="button" key={card.id}
                      onClick={() => setMonthlyVolume(card.id)}
                      style={{
                        flex: 1, padding: '12px 10px', borderRadius: 10, border: monthlyVolume === card.id ? activeBorder : inactiveBorder,
                        background: monthlyVolume === card.id ? 'rgba(16,185,129,0.05)' : '#0f172a', color: '#f8fafc',
                        fontSize: 11.5, fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      {card.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PIX CONFIG & INTERACTIVE LIVE CARD */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>Configure seus recebimentos Pix</h2>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, marginTop: 4 }}>
                  O dinheiro cai direto na sua conta bancária original de forma instantânea e sem taxas de intermediação (0% taxa).
                </p>
              </div>

              {/* Interactive Virtual Card Mockup */}
              <div className="pix-card-mockup">
                {/* Glowing blob */}
                <div style={{
                  position: 'absolute', top: -30, right: -30, width: 90, height: 90, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
                  filter: 'blur(10px)'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', letterSpacing: '2px' }}>COBBRA PAY</span>
                  <span style={{ fontSize: 14 }}>💳</span>
                </div>

                {/* Digital Chip */}
                <div style={{
                  width: 32, height: 24, borderRadius: 4, background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                  opacity: 0.8, display: 'flex', flexDirection: 'column', padding: 2
                }}>
                  <div style={{ flex: 1, borderBottom: '1px solid rgba(0,0,0,0.15)' }} />
                  <div style={{ flex: 1 }} />
                </div>

                <div>
                  <span style={{ fontSize: 8, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Chave Pix ({pixKeyType.toUpperCase()})
                  </span>
                  <p style={{
                    margin: '2px 0 0 0', fontSize: 15, fontWeight: 700, color: '#ffffff',
                    fontFamily: 'monospace', letterSpacing: '0.5px'
                  }}>
                    {pixKey || 'SUA CHAVE AQUI'}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#cbd5e1' }}>
                    {businessName || 'NOME DO NEGÓCIO'}
                  </span>
                  <span style={{ fontSize: 8, color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>TAXA ZERO</span>
                </div>
              </div>

              {/* Form inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
                    Tipo de Chave Pix
                  </label>
                  <select
                    value={pixKeyType}
                    onChange={(e) => setPixKeyType(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', backgroundColor: '#0f172a', border: '1px solid #334155',
                      borderRadius: 12, color: '#f8fafc', fontSize: 14, outline: 'none', cursor: 'pointer', appearance: 'auto'
                    }}
                  >
                    <option value="email">E-mail</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="phone">Celular (WhatsApp)</option>
                    <option value="random">Chave Aleatória (EVP)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
                    Valor da Chave Pix
                  </label>
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder={formatPixKeyPlaceholder()}
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #334155',
                      fontSize: 15, color: '#f8fafc', background: '#0f172a', outline: 'none', boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: PREVIEW & FINISH */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>Tudo pronto! Pronto para faturar?</h2>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, marginTop: 4 }}>
                  Aqui está uma simulação real da régua de WhatsApp da Catarina AI configurada para o seu tom **{collectionRigor === 'gentle' ? 'Gentil' : collectionRigor === 'firm' ? 'Assertivo' : 'Profissional'}**:
                </p>
              </div>

              {/* Realistic WhatsApp Simulator Mockup */}
              <div style={{
                background: '#0b141a', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
              }}>
                {/* Header */}
                <div style={{ background: '#202c33', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#0d9488)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700
                  }}>
                    🐍
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#e9edef', margin: 0 }}>Catarina AI — Cobbra</p>
                    <p style={{ fontSize: 9.5, color: '#8696a0', margin: 0 }}>online</p>
                  </div>
                </div>

                {/* Body with simulated background */}
                <div className="whatsapp-mockup-body">
                  {/* Chat bubble */}
                  <div style={{
                    background: '#005c4b', borderRadius: '10px 10px 0 10px', padding: '10px 12px',
                    maxWidth: '85%', marginLeft: 'auto', border: '1px solid rgba(255,255,255,0.02)',
                    boxShadow: '0 1.5px 2px rgba(0,0,0,0.35)', animation: 'slideUp 0.3s ease-out'
                  }}>
                    <p style={{
                      fontSize: 12, color: '#e9edef', margin: 0, lineHeight: 1.45,
                      whiteSpace: 'pre-wrap', fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif'
                    }}>
                      {getWhatsAppPreviewText()}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3, marginTop: 4 }}>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>11:45</span>
                      <span style={{ fontSize: 10, color: '#53bdeb' }}>✓✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Niche confirmation bubble */}
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: '12px 14px', fontSize: 12.5, color: '#94a3b8', lineHeight: 1.5
              }}>
                ⚙️ O seu painel foi configurado para o nicho de **{niche === 'locacao_veiculos' ? 'Locação de Veículos' : niche === 'emprestimo' ? 'Gestão de Empréstimos' : niche === 'construcao_civil' ? 'Construção Civil' : 'Recursos Gerais'}**. Você poderá alterar os templates e regras do Pix a qualquer momento nas configurações.
              </div>
            </div>
          )}

          {/* Action Footer Buttons */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 28, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20
          }}>
            {step > 1 ? (
              <button
                onClick={handleBack}
                disabled={loading}
                style={{
                  background: 'transparent', border: '1px solid #334155', color: '#cbd5e1',
                  padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Voltar
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                onClick={handleNext}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none',
                  color: '#fff', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.25)'
                }}
              >
                Avançar ➜
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none',
                  color: '#fff', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                  cursor: loading ? 'default' : 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                  opacity: loading ? 0.8 : 1
                }}
              >
                {loading ? 'Inicializando Painel...' : source === 'contrato-gratis' ? 'Vincular Contrato e Ativar Painel 🚀' : 'Ativar Meu Painel 🚀'}
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
