'use client';
import { useState } from 'react';

const changelog = [
  {
    version: 'Versão 4.0 — Nova Interface Mobile-First, Catarina AI 2.0 & Espaçamentos Pixel-Perfect 🐍💎✨',
    date: '25 de Maio de 2026 (Hoje)',
    badge: '🚀 DESTAQUE',
    badgeColor: 'rgba(16,185,129,0.15)',
    textColor: '#10b981',
    description: 'Uma revolução completa na usabilidade e design do Cobbra! Redesenhamos o dashboard sob a nova engine de estilos do Tailwind CSS v4, trazendo uma experiência minimalista ultra-premium inspirada em fintechs internacionais (Stripe, Nubank, Revolut), focando em ergonomia móvel e respiros perfeitos.',
    categories: [
      {
        title: '📐 Espaçamentos Generosos & Alinhamento Horizontal (Pixel-Perfect Spacing)',
        items: [
          '**Mais Respiro nas Extremidades:** Ampliamos o padding horizontal de todo o dashboard para 24px no celular e 48px no computador, eliminando de forma definitiva textos encostados nas bordas.',
          '**Alinhamento Perfeito:** O cabeçalho superior e o conteúdo principal agora alinham-se simetricamente em todas as resoluções.'
        ]
      },
      {
        title: '🤖 Catarina AI 2.0 & Copilot Otimizado',
        items: [
          '**Gaveta Lateral Retrátil:** O antigo botão flutuante redondo (FAB) que cobria inputs no celular foi substituído por um ícone elegante no cabeçalho superior. Ao clicar, o chatbot Catarina desliza suavemente a partir do canto como um painel lateral.',
          '**Copilot Anti-Achatamento:** A modal de comandos da Catarina AI foi blindada e reestruturada de forma que o teclado móvel do celular nunca esmague os botões ou caixas de digitação.'
        ]
      },
      {
        title: '📱 Experiência Mobile-First Ergonômica',
        items: [
          '**Menu Inferior Nubank-Style:** Introdução de barra flutuante inferior para smartphones, permitindo transicionar entre as telas principais com um único polegar.',
          '**Chips Horizontais & Grids Fluidos:** Telas de Ajustes, Lembretes, Clientes, Relatórios e Calendário adaptadas com abas horizontais roláveis e formulários empilhados de forma harmoniosa.'
        ]
      },
      {
        title: '📈 Gráficos SVG Interativos & Performance',
        items: [
          '**Leitura Dinâmica:** Substituição do gráfico de receita por uma linha com preenchimento em degrade suave (SVG), permitindo tocar em qualquer ponto para ler o faturamento exato daquele dia instantaneamente.'
        ]
      }
    ]
  },
  {
    version: 'Versão 3.8 — Gemini 2.5 Flash & Liberador Pública do Chatbot 🐍🤖',
    date: '24 de Maio de 2026',
    badge: '🚀 NOVO',
    badgeColor: 'rgba(16,185,129,0.15)',
    textColor: '#10b981',
    description: 'Nesta nova versão de elite, elevamos a inteligência da Catarina AI ao novo modelo de alta velocidade Gemini 2.5 Flash, e liberamos o chatbot de suporte de forma pública no middleware Next.js para que visitantes e clientes possam interagir e tirar dúvidas na Landing Page!',
    categories: [
      {
        title: '🤖 Google Gemini 2.5 Flash Ativado',
        items: [
          '**Zero Erros de Conexão:** Migração completa da antiga versão 1.5 para o superveloz **Gemini 2.5 Flash** nas rotas de Chat, Copilot e Insights Financeiros, eliminando 100% dos erros 404 e timeouts de rede.',
          '**Inteligência Contextual Avançada:** Respostas muito mais completas, amigáveis e com insights contábeis precisos.'
        ]
      },
      {
        title: '🔓 Acesso Público de Visitantes (Bypass de Middleware)',
        items: [
          '**Catarina na Landing Page:** Ajustamos o `middleware.js` para permitir que visitantes que ainda não possuem conta possam falar com a Catarina AI para tirar dúvidas sobre os planos, limites e suporte antes de se registrarem!'
        ]
      }
    ]
  },
  {
    version: 'Versão 3.7 — Pix Dinâmico EMV, QR Code ao vivo & Juros por Atraso ⚡',
    date: '24 de Maio de 2026',
    badge: '🚀 LANÇADO',
    badgeColor: 'rgba(16,185,129,0.15)',
    textColor: '#10b981',
    description: 'Uma atualização contábil histórica! O Cobbra agora gera Pix dinâmicos recalculando o saldo automaticamente com juros de mora acumulados pós-vencimento, anexando QR Codes dinâmicos nos e-mails e blocos de cópia monospaçados no WhatsApp.',
    categories: [
      {
        title: '📈 Cálculo de Juros Moratórios Automático',
        items: [
          '**Recálculo Pro Rata Die:** Se a cobrança estiver vencida e possuir taxa diária ativa (ex: 0.3%/dia), o backend calcula os dias de atraso decorridos e atualiza o saldo a pagar de forma instantânea.'
        ]
      },
      {
        title: '✉️ E-mail Premium com QR Code e Copia e Cola',
        items: [
          '**QR Code ao Vivo:** O template HTML de e-mail agora exibe um card verde-esmeralda contendo um QR Code gerado em tempo real via API do QRServer e um bloco dashed monospaçado de fácil cópia rápida.',
          '**Detalhamento Transparente:** Exibição dos juros acumulados, dias em atraso e valor original detalhadamente para o cliente devedor.'
        ]
      },
      {
        title: '📱 WhatsApp Copia e Cola Formatado',
        items: [
          '**Bloco Monospaçado:** O Pix Copia e Cola é enviado em bloco de código monospaçado no WhatsApp (\`código\`), permitindo ao cliente copiar o Pix instantaneamente com um toque no celular.'
        ]
      }
    ]
  },
  {
    version: 'Versão 3.6 — API do Resend: Disparos de E-mail Sem Bloqueio de Portas ✉️🚀',
    date: '24 de Maio de 2026',
    badge: '🚀 LANÇADO',
    badgeColor: 'rgba(16,185,129,0.15)',
    textColor: '#10b981',
    description: 'Substituímos o disparo de e-mails clássico via SMTP pela API HTTP de alta performance do Resend na nuvem. Isso elimina 100% dos bloqueios de portas de e-mail efetuados por provedores como DigitalOcean, AWS ou Railway.',
    categories: [
      {
        title: '✉️ Resend REST API Híbrido',
        items: [
          '**Entrega Segura na Porta 443:** Disparos efetuados via requisições HTTPS criptografadas, garantindo taxa de entrega máxima na caixa de entrada do cliente.',
          '**Fallback para SMTP:** Se a chave do Resend não estiver configurada no ambiente local, o sistema volta de forma inteligente para o SMTP clássico (Hostinger).'
        ]
      }
    ]
  },
  {
    version: 'Versão 3.5 — Resiliência de Infraestrutura & Abort Controllers ⚡🔧',
    date: '24 de Maio de 2026',
    badge: 'HISTÓRICO',
    badgeColor: 'rgba(255,255,255,0.05)',
    textColor: '#94a3b8',
    description: 'Aprimoramos o backend para evitar qualquer tipo de travamento indefinido (telas presas em carregamento) e garantir que falhas reais de SMTP ou API de WhatsApp sejam reportadas ao usuário na hora.',
    categories: [
      {
        title: '⏱️ Limites de Tempo Rígidos (Timeouts)',
        items: [
          '**Abort Controllers no WhatsApp:** Limite máximo de 8 segundos para requisições de mensageria móvel. Se a API de WhatsApp falhar ou demorar, a requisição é cancelada e reportada.',
          '**SMTP Timeouts:** Limite rígido de 8 segundos para conexões SMTP da Hostinger, prevenindo travamento indefinido das rotas da API.'
        ]
      },
      {
        title: '🚨 Propagação de Erros nos Toasts',
        items: [
          '**Exceções Visíveis:** Erros do servidor no envio de lembretes são propagados até a tela e exibidos nos toasts flutuantes, permitindo ação e diagnóstico rápido do emissor.'
        ]
      }
    ]
  },
  {
    version: 'Versão 3.4 — Tabela Responsiva & Lembretes Avulsos sob Demanda 📱✉️',
    date: '24 de Maio de 2026',
    badge: 'HISTÓRICO',
    badgeColor: 'rgba(255,255,255,0.05)',
    textColor: '#94a3b8',
    description: 'Melhoramos drasticamente a visualização do painel em celulares e adicionamos dois botões de ação rápida para disparar cobranças avulsas manualmente pelo WhatsApp ou E-mail.',
    categories: [
      {
        title: '📱 Tabela de Cobranças Responsiva',
        items: [
          '**Overflow Adaptativo:** A tabela na aba de cobranças agora possui rolagem horizontal fluida em smartphones, prevenindo quebra de texto ou esmagamento de colunas em resoluções menores.'
        ]
      },
      {
        title: '✉️ Lembretes Avulsos WhatsApp e E-mail',
        items: [
          '**Disparo sob Demanda:** Novos botões "📱 Whats" e "✉️ Email" na coluna de Ações de cada fatura. Clique para enviar imediatamente o link, Pix e resumo da fatura para o celular ou caixa de e-mail do devedor.'
        ]
      }
    ]
  },
  {
    version: 'Versão 3.3 — Correção de Travamento no Dashboard de Clientes 🔧',
    date: '24 de Maio de 2026',
    badge: 'HISTÓRICO',
    badgeColor: 'rgba(255,255,255,0.05)',
    textColor: '#94a3b8',
    description: 'Corrigimos com sucesso um travamento de página client-side que impedia a renderização do painel de clientes devido ao consumo de limites de score sem o estado do usuário inicializado.',
    categories: [
      {
        title: '🔧 Inicialização de State',
        items: [
          '**ReferenceError Sanado:** Declaramos o estado `user` com `useState(null)` e atualizamos o `useEffect` para carregar o perfil de `/api/auth/me` na aba Clientes, eliminando a tela de erro fatal no Next.js.'
        ]
      }
    ]
  },
  {
    version: 'Versão 3.2 — SMTP Hostinger, Boas-Vindas & Tickets de Suporte 📧',
    date: '23 de Maio de 2026',
    badge: 'HISTÓRICO',
    badgeColor: 'rgba(255,255,255,0.05)',
    textColor: '#94a3b8',
    description: 'Ativação do transporte de e-mails profissionais utilizando os servidores de alta disponibilidade da Hostinger, acompanhados de e-mails de boas-vindas automatizados e abertura de chamados direto para nossa caixa suporte@cobbra.com.br.',
    categories: [
      {
        title: '📧 E-mail de Boas-Vindas Onboarding',
        items: [
          '**Boas-vindas Automatizado:** Novos assinantes agora recebem um e-mail de onboarding espetacular vindo de `suporte@cobbra.com.br` ensinando a configurar Pix, WhatsApp e disparar as faturas.'
        ]
      },
      {
        title: '🎫 Tickets de Suporte Automáticos',
        items: [
          '**Notificação em 1-Clique:** Quando a Catarina AI abre um chamado por solicitação do usuário, um e-mail formatado em design laranja-crítico é enviado na hora para `suporte@cobbra.com.br` contendo a mensagem do assinante e plano ativo.'
        ]
      }
    ]
  },
  {
    version: 'Versão 3.1 & 3.0 — Catarina AI Engine, Dashboard Copilot & WhatsApp Live 🤖📱',
    date: '23 de Maio de 2026',
    badge: 'HISTÓRICO',
    badgeColor: 'rgba(255,255,255,0.05)',
    textColor: '#94a3b8',
    description: 'O grande marco inteligente do Cobbra! Lançamos a integração conversacional nativa Catarina AI, a barra de comandos Copilot de Dashboard em linguagem natural e o painel de pareamento móvel via QR Code dinâmico.',
    categories: [
      {
        title: '🤖 Catarina AI Engine & Copilot',
        items: [
          '**Dashboard Copilot:** Digite frases livres como *"Cobrar R$ 200 da Mariana amanhã"* no topo do cabeçalho e veja a modal de faturamento ser pré-preenchida instantaneamente por IA.',
          '**AI Insights Contábeis:** Visualização de estatísticas reais e dicas inteligentes de inadimplência no topo da página inicial do painel.'
        ]
      },
      {
        title: '📱 Integração de WhatsApp e QR Code ao vivo',
        items: [
          '**Pareamento Instantâneo:** Nova aba em Configurações > Integrações permitindo gerar o QR Code da Evolution API ao vivo e parear o celular comercial de sua empresa em menos de 2 minutos.'
        ]
      }
    ]
  }
];

export default function AtualizacoesPage() {
  const [expandedIndex, setExpandedIndex] = useState(0);

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(5,150,105,0.2) 0%, rgba(13,148,136,0.1) 100%)', 
        borderRadius: 20, 
        padding: '36px', 
        border: '1px solid rgba(5,150,105,0.25)', 
        marginBottom: 32,
        textAlign: 'center'
      }}>
        <span style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>🐍</span>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>Central de Atualizações Cobbra</h2>
        <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Fique por dentro das novidades, correções de bugs e otimizações contínuas da plataforma.</p>
      </div>

      {/* Changelog Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {changelog.map((log, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <div 
              key={index} 
              style={{ 
                background: '#1e293b', 
                borderRadius: 16, 
                border: isExpanded ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)', 
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: isExpanded ? '0 8px 30px rgba(5,150,105,0.08)' : 'none'
              }}
            >
              
              {/* Version Header (Clickable) */}
              <div 
                onClick={() => toggleExpand(index)}
                style={{ 
                  padding: '24px 28px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  background: isExpanded ? 'rgba(5,150,105,0.03)' : 'transparent',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = isExpanded ? 'rgba(5,150,105,0.03)' : 'transparent'}
              >
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: isExpanded ? '#10b981' : '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                    {log.version}
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '6px 0 0 0' }}>Lançamento: {log.date}</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ 
                    fontSize: 10, 
                    fontWeight: 700, 
                    padding: '4px 10px', 
                    borderRadius: 6, 
                    background: log.badgeColor, 
                    color: log.textColor,
                    letterSpacing: 0.5
                  }}>
                    {log.badge}
                  </span>
                  <span style={{ fontSize: 16, color: '#64748b', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                    ▼
                  </span>
                </div>
              </div>

              {/* Version Content (Collapsible) */}
              {isExpanded && (
                <div style={{ padding: '0 28px 28px 28px', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(15,23,42,0.15)' }}>
                  
                  {/* Intro Description */}
                  <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, marginTop: 20, marginBottom: 20 }}>
                    {log.description}
                  </p>

                  {/* Feature categories */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {log.categories.map((cat, catIdx) => (
                      <div key={catIdx} style={{ background: 'rgba(255,255,255,0.01)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.03)' }}>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>
                          {cat.title}
                        </h4>
                        <ul style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {cat.items.map((item, itemIdx) => {
                            // Format bold text markdown inline
                            const formattedText = item.split('**').map((part, pIdx) => 
                              pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: '#e2e8f0' }}>{part}</strong> : part
                            );
                            return (
                              <li key={itemIdx} style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                                {formattedText}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>

                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
