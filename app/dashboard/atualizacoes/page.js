'use client';
import { useState } from 'react';

const changelog = [
  {
    version: 'Versão 3.0 — Catarina AI Engine & Copilot de Dashboard 🐍🤖',
    date: 'Em desenvolvimento / Em breve',
    badge: '⚡ EM BREVE',
    badgeColor: 'rgba(245,158,11,0.15)',
    textColor: '#f59e0b',
    description: 'A revolução inteligente do Cobbra! Integraremos inteligência artificial generativa real para responder dúvidas de suporte automaticamente, gerenciar o painel por comando de texto (Copilot), criar redações inteligentes de cobrança baseadas no humor do cliente e analisar dados para dar insights financeiros inteligentes.',
    categories: [
      {
        title: '🤖 Catarina IA Conversacional 2.0 & Auto-Suporte',
        items: [
          '**Gemini 2.5 Flash Integrado:** Respostas instantâneas e super inteligentes às suas dúvidas sobre o site, integradas com a IA mais rápida e barata do Google.',
          '**Abertura de Chamados Automática:** Se a Catarina detectar que você tem um problema que exige a intervenção humana, ela abrirá um chamado de suporte e enviará um e-mail para `suporte@cobbra.com.br` sozinha!'
        ]
      },
      {
        title: '🪄 Copilot de Dashboard (Comandos por Texto)',
        items: [
          '**AI Assist:** Uma barra de comandos unificada no topo do painel. Digite frases livres como *"Cadastre cobrança de R$ 200 para Gustavo amanhã"* ou *"Gere uma cobrança diária"* e a IA executa a ação para você ou pré-preenche o formulário para confirmação em 1-clique.'
        ]
      },
      {
        title: '💡 AI Insights Contábeis e Financeiros',
        items: [
          '**Previsão e Conselhos:** A IA estuda seus dados e dá dicas valiosas: *"Seu cliente Rodrigo costuma atrasar em média 5 dias quando cobrado às segundas. Que tal alterar o vencimento para as sextas?"*'
        ]
      },
      {
        title: '✍️ Copywriter AI (Humor da Cobrança)',
        items: [
          '**Mensagens sob Medida:** No modal de cobrança, escolha o tom de humor (Gentil, Firme, Urgente, Poético) e a IA redige uma mensagem de WhatsApp sob medida para o devedor.'
        ]
      }
    ]
  },
  {
    version: 'Versão 2.5 — Cybersegurança Avançada, SEO de Elite & UI Mobile Otimizada 🔒',
    date: '23 de Maio de 2026 (Hoje)',
    badge: '🚀 LANÇADO',
    badgeColor: 'rgba(16,185,129,0.15)',
    textColor: '#10b981',
    description: 'Uma atualização focada em blindagem cibernética e visibilidade comercial. Adicionamos barreiras contra acessos não autorizados e força-bruta, otimizamos o motor de indexação para o Google exibir os preços e notas do Cobbra, e reconstruímos a gaveta lateral de navegação no celular.',
    categories: [
      {
        title: '🔒 Cybersegurança e Proteção de APIs',
        items: [
          '**Rate Limiting Dinâmico:** Nova camada de proteção em memória que bloqueia abusos e tentativas de força-bruta nas rotas de login (máx. 10 reqs/min) e APIs gerais.',
          '**Cookies e Sessões Blindadas:** Envio do cookie de sessão `cobroo_token` com as flags de segurança `HttpOnly`, `SameSite=Lax` e `Secure` (em produção).',
          '**Assinaturas JWT Fortalecidas:** Uso de claims restritas de emissor e público-alvo, impedindo interceptações e validação de tokens falsificados.',
          '**Headers de Segurança HTTP:** Injetados headers como CSP (Content Security Policy) estrito e `X-Frame-Options: DENY` contra clickjacking.'
        ]
      },
      {
        title: '🔍 SEO de Elite & Descoberta do SaaS',
        items: [
          '**Metadados de Alta Conversão:** Mapeamento OpenGraph, Twitter Cards e dados estruturados JSON-LD nativos para o Google exibir preços e a ótima reputação do Cobbra direto nas buscas.',
          '**Sitemap e Robots Dinâmicos:** Indexação inteligente das páginas públicas do site e ocultação segura das rotas do painel.'
        ]
      },
      {
        title: '📱 Menu Sanduíche & Dashboard Mobile drawer',
        items: [
          '**Gaveta Lateral Tátil (Drawer):** A barra lateral do dashboard no celular agora desliza de forma elegante, com overlay de fundo escurecido para fechamento prático.',
          '**Menu Sanduíche Responsivo:** Novo menu hambúrguer na página inicial com animações limpas e visual adaptativo para smartphones.'
        ]
      }
    ]
  },
  {
    version: 'Versão 2.4 — Sincronização de Planos, Limitação de Recursos & Vendas 💎',
    date: '23 de Maio de 2026 (Hoje)',
    badge: 'HISTÓRICO',
    badgeColor: 'rgba(255,255,255,0.05)',
    textColor: '#94a3b8',
    description: 'Atualização robusta focada no alinhamento de planos de assinatura do SaaS. Implementamos travas de segurança e limites de uso conforme cada plano no backend e frontend, além de reestruturar a Landing Page comercial com foco em conversão.',
    categories: [
      {
        title: '💎 Sincronização Real de Planos',
        items: [
          '**Banco de Dados Integrado:** O plano selecionado nas Configurações agora é salvo de forma persistente na tabela `users` do banco de dados SQLite real.',
          '**Novos Limites Ampliados:** Starter suporta até **20 cobranças simultâneas ativas** (anteriormente 3) por R$ 9,90/mês. Crescimento suporta até **50 cobranças simultâneas** por R$ 19,90/mês.'
        ]
      },
      {
        title: '🚪 Bloqueios Premium & Upgrades Estéticos',
        items: [
          '**Telas de Bloqueio Educativas:** Usuários do plano Starter ao acessarem as abas restritas "Cobrança Diária" e "Relatórios" visualizam um elegante painel Dark Glassmorphic listando os benefícios do recurso e incentivando o upgrade.',
          '**Cadeados no Menu:** Ícone de cadeado de segurança (🔒) exibido nos itens de menu restritos na barra lateral e botões da UI para maior clareza visual.'
        ]
      },
      {
        title: '🚀 Otimizações de Vendas na Landing Page',
        items: [
          '**Tabela Comparativa de Recursos:** Inclusão de uma tabela comparativa completa e visual dos planos para total transparência.',
          '**Copies com Foco em ROI:** Blocos informativos persuadindo autônomos sobre o retorno do investimento do plano (uma cobrança recuperada paga a assinatura) e garantias de segurança do Pix.'
        ]
      }
    ]
  },
  {
    version: 'Versão 2.3 — Duplo Faturamento, Quitação Antecipada & Histórico Expandido 📅',
    date: '23 de Maio de 2026 (Hoje)',
    badge: 'HISTÓRICO',
    badgeColor: 'rgba(255,255,255,0.05)',
    textColor: '#94a3b8',
    description: 'Nova versão contendo a possibilidade de faturamento diário duplo por cliente, fluxo completo para quitações antecipadas ou abatimentos de faturamentos diários com registro de receita e histórico de início de dívidas.',
    categories: [
      {
        title: '👥 Duplo Faturamento Diário',
        items: [
          '**Até 2 Contratos por Cliente:** Removida a limitação de faturamento exclusivo por cliente, permitindo até 2 faturamentos diários paralelos e concorrentes para o mesmo cliente.'
        ]
      },
      {
        title: '💸 Quitações e Abatimentos Antecipados',
        items: [
          '**Quitação Antecipada Completa:** Novo fluxo para quitar e encerrar contratos diários antes do prazo, mudando automaticamente o status para `✓ QUITADO` e interrompendo as cobranças.',
          '**Abatimentos Parciais:** Possibilidade de registrar pagamentos antecipados avulsos sem desativar o faturamento diário.'
        ]
      }
    ]
  },
  {
    version: 'Versão 2.2 — Centralização Contábil & Filtros nos Relatórios 📊',
    date: '23 de Maio de 2026 (Hoje)',
    badge: 'HISTÓRICO',
    badgeColor: 'rgba(255,255,255,0.05)',
    textColor: '#94a3b8',
    description: 'Atualização crítica focada na estabilização de banco de dados para usuários antigos, prevenção de erros e implementação de filtros de dias altamente interativos nos relatórios diários de faturamento.',
    categories: [
      {
        title: '📊 Filtro de Dia nos Relatórios',
        items: [
          '**Gráfico Interativo de Relatórios:** O gráfico diário na aba de Relatórios agora é 100% interativo, permitindo clicar em cada barra individualmente para ver os readouts formatados com data e valor correspondentes.'
        ]
      },
      {
        title: '🛠️ Estabilização de Banco de Dados',
        items: [
          '**Correção de Sintaxe SQLite & Migrações:** Resolvida falha crítica de aspas no literal de datas e centralizada a injeção de colunas de score de juros na tabela `users`.'
        ]
      }
    ]
  },
  {
    version: 'Versão 2.1 — Calendário & Recorrência Exclusiva 📅',
    date: '23 de Maio de 2026 (Hoje)',
    badge: 'HISTÓRICO',
    badgeColor: 'rgba(255,255,255,0.05)',
    textColor: '#94a3b8',
    description: 'Nova versão com o Calendário de Pagamentos interativo, opções avançadas de exclusão de cobrança em finais de semana e feriados nacionais brasileiros, datas detalhadas nos gráficos do painel e responsividade total para celulares.',
    categories: [
      {
        title: '📅 Calendário de Pagamentos',
        items: [
          '**Grade Mensal Interativa:** Nova aba "Calendário" no painel exibindo todas as cobranças avulsas e faturamentos diários projetados com painel de detalhamento por dia.'
        ]
      },
      {
        title: '🚫 Exclusão de Finais de Semana e Feriados',
        items: [
          '**Não Cobrar aos Sábados/Domingos/Feriados:** Opção de excluir fins de semana e feriados nacionais do calendário de cobranças diárias recorrentes.'
        ]
      }
    ]
  },
  {
    version: 'Versão 2.0 — Platinum Update 🐍',
    date: '23 de Maio de 2026 (Hoje)',
    badge: 'HISTÓRICO',
    badgeColor: 'rgba(255,255,255,0.05)',
    textColor: '#94a3b8',
    description: 'A maior e mais robusta atualização do Cobbra até hoje! Introduzimos a cobrança diária contratual, o poderoso sistema de abatimentos parciais, score de adimplência do pagador, barra de pesquisa inteligente e o nosso assistente virtual IA Cobrinha.',
    categories: [
      {
        title: '📅 Cobrança Diária & Juros Inteligentes',
        items: [
          '**Contratos Diários:** Nova modalidade de cobrança recorrente diária projetada para prestadores de serviços recorrentes e aluguel de equipamentos.'
        ]
      },
      {
        title: '💸 Abatimentos de Pagamentos (Baixas Parciais)',
        items: [
          '**Pagamentos Parciais:** Agora você pode registrar baixas parciais nas dívidas ativas dos clientes sem precisar dar baixa total na cobrança, recalculando o saldo automaticamente.'
        ]
      },
      {
        title: '📄 Contratos de Cobrança em 1-Clique',
        items: [
          '**Gerador de Contratos Particular:** Geração instantânea de contratos particulares de prestação de serviços vinculados a cada cobrança com cláusulas de juros automatizadas.'
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
