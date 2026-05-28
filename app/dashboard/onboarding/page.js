'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const NICHES = [
  { id: 'construcao_civil', label: '🏗️ Construção Civil & Reformas', desc: 'Geração de orçamentos por IA, laudos e diários de obra inteligentes.', rigor: 'neutral', popular: true },
  { id: 'locacao_veiculos', label: '🚗 Locação de Veículos', desc: 'Controle de diárias, alertas de quilometragem e devolução da frota.', rigor: 'neutral', popular: true },
  { id: 'emprestimo', label: '💰 Empréstimos e Finanças', desc: 'Controle de parcelas, juros diários estritos e termos contratuais.', rigor: 'firm', popular: true },
  { id: 'clinica', label: '🩺 Clínica e Consultório', desc: 'Régua de cobrança altamente diplomática para preservar a relação médica.', rigor: 'gentle' },
  { id: 'personal', label: '🏋️‍♂️ Personal Trainer / Fitness', desc: 'Foco na recorrência de planos, aulas e energia profissional.', rigor: 'gentle' },
  { id: 'estetica', label: '🌸 Estética e Beleza', desc: 'Lembretes amigáveis focados em confirmação de horários agendados.', rigor: 'gentle' },
  { id: 'educacao', label: '🎓 Cursos e Educação', desc: 'Cobrança de mensalidades estudantis e acesso a plataformas.', rigor: 'neutral' },
  { id: 'geral', label: '💼 Freelancer e Serviços Gerais', desc: 'Régua comercial limpa, direta e profissional.', rigor: 'neutral' }
];

const RIGORS = [
  { id: 'gentle', label: 'Gentil (Suave) 💚', desc: 'Mensagens acolhedoras com foco na retenção e relacionamento.' },
  { id: 'neutral', label: 'Neutro (Profissional) 📋', desc: 'Mensagens formais, claras, diretas e equilibradas.' },
  { id: 'firm', label: 'Firme (Assertivo) ⚡', desc: 'Mensagens rápidas, assertivas e com avisos nítidos de juros contratuais.' }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Onboarding States
  const [businessName, setBusinessName] = useState('');
  const [niche, setNiche] = useState('locacao_veiculos');
  const [rigor, setRigor] = useState('neutral');
  const [pixKeyType, setPixKeyType] = useState('email');
  const [pixKey, setPixKey] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUser(d.user);
          // Pre-populate business name if exists
          if (d.user.business_name) setBusinessName(d.user.business_name);
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Handle dynamic rigor adjustment on niche selection
  const handleNicheSelect = (nicheId) => {
    setNiche(nicheId);
    const selected = NICHES.find(n => n.id === nicheId);
    if (selected) {
      setRigor(selected.rigor);
    }
  };

  const handleNext = () => {
    if (step === 1 && !businessName.trim()) {
      alert('Por favor, informe o nome do seu negócio.');
      return;
    }
    if (step === 4 && !pixKey.trim()) {
      alert('Por favor, insira sua chave Pix para receber os pagamentos (Taxa Zero).');
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
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          business_niche: niche,
          collection_rigor: rigor,
          pix_key: pixKey,
          pix_key_type: pixKeyType
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar onboarding');
      
      // Redirect to dashboard with a query trigger to refresh
      window.location.href = '/dashboard?welcome=1';
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate real-time WhatsApp preview based on selection
  const getWhatsAppPreviewText = () => {
    const cName = 'Carlos Silva';
    const amount = 'R$ 150,00';
    const date = 'amanhã';
    
    if (niche === 'construcao_civil') {
      if (rigor === 'gentle') {
        return `Oi ${cName}! 🏗️ Passando para enviar o boleto Pix da medição de hoje da obra (${amount}). Vence ${date}. Fique à vontade para tirar dúvidas! Link: {link}`;
      } else if (rigor === 'firm') {
        return `Atenção ${cName}. 🏗️ Fatura de medição de obra no valor de ${amount} vence ${date}. O não pagamento pode acarretar pausa na prestação de serviço. Pague via Pix: {link}`;
      } else {
        return `Olá ${cName}, enviamos a cobrança da medição atual da obra no valor de ${amount} com vencimento para ${date}. Segue link de pagamento Pix: {link}`;
      }
    }

    if (niche === 'locacao_veiculos') {
      const vehicle = 'Fiat Uno (ABC-1234)';
      if (rigor === 'gentle') {
        return `Oi ${cName}! 🚗 Lembrete gentil: o contrato de locação do veículo *${vehicle}* ({valor}) vence ${date}. Você pode renovar pelo Pix no link: {link}. Abraços! 💚`;
      } else if (rigor === 'firm') {
        return `Prezado ${cName}. Alerta de Locação 🚗: O aluguel do veículo *${vehicle}* no valor de ${amount} vence ${date}. Para evitar diárias adicionais ou multas contratuais, efetue a quitação Pix: {link}`;
      } else {
        return `Olá, ${cName}! 🚗 Lembramos que o aluguel do veículo *${vehicle}* (${amount}) vence ${date}. Segue link Pix para pagamento/renovação do contrato: {link}`;
      }
    }

    if (niche === 'emprestimo') {
      if (rigor === 'gentle') {
        return `Oi ${cName}! 💚 Passando para lembrar que sua parcela de ${amount} vence ${date}. Se precisar de qualquer ajuda com a fatura, me avise! O Pix de pagamento está no link: {link}`;
      } else if (rigor === 'firm') {
        return `ATENÇÃO ${cName} ⚡: Sua parcela de empréstimo no valor de ${amount} vence ${date}. Conforme termos pactuados, o atraso gerará juros diários adicionais de 0.5% ao dia. Regularize pelo Pix: {link}`;
      } else {
        return `Olá ${cName}. Lembrete de vencimento: sua parcela de ${amount} está agendada para vencer ${date}. Por favor, utilize a chave Pix copia e cola para quitação: {link}`;
      }
    }

    // Default other niches
    if (rigor === 'gentle') {
      return `Oi ${cName}! 💚 Lembrete simpático: sua fatura de Pilates/Serviço (${amount}) vence ${date}. Segue o link para pagamento Pix: {link}. Obrigado! 🙏`;
    } else if (rigor === 'firm') {
      return `${cName}, informamos que sua fatura de ${amount} vence ${date}. Efetue o Pix pelo link {link} para manter o serviço ativo e evitar juros.`;
    } else {
      return `Olá, ${cName}. Lembrete de vencimento: sua fatura de ${amount} vence ${date}. Link de pagamento via Pix: {link}`;
    }
  };

  const currentPreviewText = getWhatsAppPreviewText();

  // Glassmorphic Styles
  const progressStyle = (stepNum) => ({
    flex: 1,
    height: 4,
    borderRadius: 2,
    background: step >= stepNum ? '#10b981' : 'rgba(255,255,255,0.06)',
    transition: 'background 0.3s ease'
  });

  const touchCardStyle = (isActive, isPopular = false) => ({
    background: isActive ? 'rgba(16, 185, 129, 0.06)' : 'rgba(15, 23, 42, 0.4)',
    border: isActive ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  });

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    fontSize: 15,
    color: '#f8fafc',
    background: 'rgba(15, 23, 42, 0.6)',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: 'Inter, sans-serif'
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0C0E1A', 
      color: '#f8fafc', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: "'Inter', sans-serif",
      position: 'relative'
    }}>
      
      {/* Background compositor protections */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '400px', background: 'radial-gradient(circle at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Header Tracker */}
      <header style={{ 
        padding: '20px 24px', 
        borderBottom: '1px solid rgba(255,255,255,0.04)', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 12,
        background: '#0C0E1A',
        zIndex: 10 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🐍</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>Cobbra Setup</span>
          </div>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Passo {step} de 5</span>
        </div>
        
        {/* Progress Tracker Bar */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4, 5].map(num => (
            <div key={num} style={progressStyle(num)} />
          ))}
        </div>
      </header>

      {/* Central Wizard Area */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '32px 20px',
        zIndex: 5
      }}>
        <div style={{ 
          width: '100%', 
          maxWidth: 580, 
          background: 'rgba(12, 14, 26, 0.98)', 
          border: '1px solid rgba(255,255,255,0.04)', 
          borderRadius: 24, 
          padding: '28px 24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>

          {/* STEP 1: BUSINESS NAME & DESC */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <span style={{ fontSize: 32 }}>✨</span>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', marginTop: 12 }}>Como se chama o seu negócio?</h2>
                <p style={{ fontSize: 14.5, color: '#94a3b8', lineHeight: 1.5, marginTop: 4 }}>
                  Olá, {user?.name ? user.name.split(' ')[0] : 'Parceiro'}! Vamos dar um nome profissional ao seu dashboard e painel de recebimentos.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>Nome Comercial / Empresa</label>
                <input 
                  type="text" 
                  value={businessName} 
                  onChange={e => setBusinessName(e.target.value)} 
                  placeholder="Ex: Prime Veículos, Financeira Silva, Studio Pilates" 
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 20 }}>🔒</span>
                <span style={{ fontSize: 12.5, color: '#a7f3d0', lineHeight: 1.4 }}>
                  Você está no plano de teste de 3 dias com acesso irrestrito a todos os nichos de automação.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: BUSINESS NICHE */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>Qual o seu nicho de atuação?</h2>
                <p style={{ fontSize: 14.5, color: '#94a3b8', lineHeight: 1.5, marginTop: 4 }}>
                  Selecione o seu setor primário. A Catarina AI ativará módulos dinâmicos exclusivos para o seu dashboard baseado nessa escolha!
                </p>
              </div>

              {/* Niches Grade */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                {NICHES.map(item => {
                  const isActive = niche === item.id;
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => handleNicheSelect(item.id)}
                      style={touchCardStyle(isActive)}
                      onMouseEnter={e => e.currentTarget.style.borderColor = isActive ? '#10b981' : 'rgba(255,255,255,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = isActive ? '#10b981' : 'rgba(255,255,255,0.08)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: isActive ? '#34d399' : '#ffffff' }}>{item.label}</span>
                        {item.popular && (
                          <span style={{ fontSize: 9, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: '3px 8px', borderRadius: 20, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Popular 🔥
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.4 }}>{item.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: COLLECTION RIGOR */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>Defina o rigor das cobranças</h2>
                <p style={{ fontSize: 14.5, color: '#94a3b8', lineHeight: 1.5, marginTop: 4 }}>
                  Como as automações e a Catarina devem abordar seus clientes? Nosso motor irá auto-configurar a régua de disparo com base neste tom.
                </p>
              </div>

              {/* Rigor Selector cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {RIGORS.map(r => {
                  const isActive = rigor === r.id;
                  return (
                    <div 
                      key={r.id} 
                      onClick={() => setRigor(r.id)}
                      style={touchCardStyle(isActive)}
                    >
                      <span style={{ fontSize: 14.5, fontWeight: 700, color: isActive ? '#34d399' : '#ffffff' }}>{r.label}</span>
                      <span style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.4 }}>{r.desc}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', fontSize: 12, color: '#64748b', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>💡</span>
                <span>Qualquer template gerado sob esse tom poderá ser alterado por você depois.</span>
              </div>
            </div>
          )}

          {/* STEP 4: PIX CONFIG */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>Configure sua chave Pix</h2>
                <p style={{ fontSize: 14.5, color: '#94a3b8', lineHeight: 1.5, marginTop: 4 }}>
                  Para receber pagamentos **direto na sua conta bancária sem taxas (0%)**, informe a chave onde os Pix devem ser creditados.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>Tipo de Chave</label>
                  <select 
                    value={pixKeyType} 
                    onChange={e => setPixKeyType(e.target.value)} 
                    style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
                  >
                    <option value="email">E-mail</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="phone">Celular</option>
                    <option value="random">Chave Aleatória (EVP)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>Valor da Chave Pix</label>
                  <input 
                    type="text" 
                    value={pixKey} 
                    onChange={e => setPixKey(e.target.value)} 
                    placeholder="Sua chave Pix Pix" 
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 20 }}>💸</span>
                <span style={{ fontSize: 12, color: '#a7f3d0', lineHeight: 1.4 }}>
                  Taxa zero real! O dinheiro não passa pelo Cobbra. Ele cai direto no seu banco na hora.
                </span>
              </div>
            </div>
          )}

          {/* STEP 5: WHATSAPP PREVIEW & FINISH */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>Tudo pronto! Pronto para decolar?</h2>
                <p style={{ fontSize: 14.5, color: '#94a3b8', lineHeight: 1.5, marginTop: 4 }}>
                  Aqui está uma simulação em tempo real da régua de WhatsApp gerada para o seu nicho no tom selecionado:
                </p>
              </div>

              {/* Realistic WhatsApp Message Preview */}
              <div style={{ background: '#0b141a', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ background: '#202c33', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🐍</div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#e9edef', margin: 0 }}>Catarina AI — Cobbra 🐍</p>
                    <p style={{ fontSize: 9, color: '#8696a0', margin: 0 }}>online</p>
                  </div>
                </div>

                {/* Body */}
                <div style={{ 
                  backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', 
                  backgroundSize: 'contain',
                  padding: '16px 14px',
                  minHeight: 180
                }}>
                  {/* Chat bubble */}
                  <div style={{ 
                    background: '#005c4b', 
                    borderRadius: '10px 10px 0 10px', 
                    padding: '10px 12px', 
                    maxWidth: '85%', 
                    marginLeft: 'auto',
                    border: '1px solid rgba(255,255,255,0.03)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    <p style={{ fontSize: 12, color: '#e9edef', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap', fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif' }}>
                      {currentPreviewText}
                    </p>
                    <p style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.5)', textAlign: 'right', margin: '4px 0 0 0' }}>10:30 ✓✓</p>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', fontSize: 12.5, color: '#94a3b8', lineHeight: 1.45 }}>
                ✨ Seu painel será moldado com o tema **{niche === 'locacao_veiculos' ? 'Frota de Locações' : niche === 'emprestimo' ? 'Gestão de Empréstimos' : 'Recursos Padrão'}**. Catarina AI já está sintonizada na sua indústria!
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: 28,
            borderTop: '1px solid rgba(255,255,255,0.04)',
            paddingTop: 20
          }}>
            {step > 1 ? (
              <button 
                onClick={handleBack} 
                disabled={loading}
                style={{ 
                  background: 'transparent', 
                  border: '1px solid rgba(255,255,255,0.12)', 
                  color: '#cbd5e1', 
                  padding: '10px 20px', 
                  borderRadius: 10, 
                  fontSize: 13.5, 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontFamily: 'Inter'
                }}
              >
                Voltar
              </button>
            ) : <div />}

            {step < 5 ? (
              <button 
                onClick={handleNext} 
                style={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  border: 'none', 
                  color: '#fff', 
                  padding: '11px 24px', 
                  borderRadius: 10, 
                  fontSize: 13.5, 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.2)',
                  fontFamily: 'Inter'
                }}
              >
                Avançar ➜
              </button>
            ) : (
              <button 
                onClick={handleFinish} 
                disabled={loading}
                style={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  border: 'none', 
                  color: '#fff', 
                  padding: '11px 24px', 
                  borderRadius: 10, 
                  fontSize: 13.5, 
                  fontWeight: 700, 
                  cursor: loading ? 'default' : 'pointer',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
                  fontFamily: 'Inter'
                }}
              >
                {loading ? 'Inicializando Catarina AI...' : 'Ativar Meu Painel 🚀'}
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
