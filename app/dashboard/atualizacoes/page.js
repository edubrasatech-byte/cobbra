'use client';

const changelog = [
  {
    version: 'Versão 2.4 — Sincronização de Planos, Limitação de Recursos & Auditoria de Vendas 💎',
    date: '23 de Maio de 2026 (Hoje)',
    description: 'Atualização robusta focada no alinhamento de planos de assinatura do SaaS. Implementamos travas de segurança e limites de uso conforme cada plano no backend e frontend, além de reestruturar a Landing Page comercial com foco em conversão.',
    categories: [
      {
        title: '💎 Sincronização Real de Planos',
        items: [
          '**Banco de Dados Integrado:** O plano selecionado nas Configurações agora é salvo de forma persistente na tabela `users` do banco de dados SQLite real.',
          '**Atualização Automática:** Trocar de plano nas Configurações atualiza imediatamente o status da conta do usuário em toda a aplicação.'
        ]
      },
      {
        title: '🔒 Limites de Cobranças e Recursos',
        items: [
          '**Starter (R$ 9,90/mês):** Bloqueio estrito no backend ao tentar criar mais de 3 cobranças simultâneas ativas. Canal de lembrete forçado apenas para E-mail e cadeado na impressão de contratos.',
          '**Crescimento (R$ 19,90/mês):** Limite de 20 cobranças simultâneas ativas e até 1 faturamento diário ativo simultaneamente por conta.',
          '**Cobra Pro (R$ 49,90/mês):** Cobranças ilimitadas, suporte completo a duplo faturamento diário por cliente, e acesso a integrações personalizadas SMTP e WhatsApp (Z-API).'
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
          '**Plano Starter Synced:** O plano de entrada Starter foi atualizado de Grátis para R$ 9,90/mês na grade de preços e subtítulos comerciais da Landing Page.',
          '**Tabela Comparativa de Recursos:** Inclusão de uma tabela comparativa completa e visual dos planos para total transparência.',
          '**Copies com Foco em ROI:** Blocos informativos persuadindo autônomos sobre o retorno do investimento do plano (uma cobrança recuperada paga a assinatura) e garantias de segurança do Pix.'
        ]
      }
    ]
  },
  {
    version: 'Versão 2.3 — Duplo Faturamento, Quitação Antecipada & Histórico Expandido 📅',
    date: '23 de Maio de 2026 (Hoje)',
    description: 'Nova versão contendo a possibilidade de faturamento diário duplo por cliente, fluxo completo para quitações antecipadas ou abatimentos de faturamentos diários com registro de receita e histórico de início de dívidas.',
    categories: [
      {
        title: '👥 Duplo Faturamento Diário',
        items: [
          '**Até 2 Contratos por Cliente:** Removida a limitação de faturamento exclusivo por cliente, permitindo até 2 faturamentos diários paralelos e concorrentes para o mesmo cliente.',
          '**Controle de Limites Inteligente:** A API agora valida o total de contratos diários ativos do cliente e impede qualquer nova inserção acima do limite máximo de 2.'
        ]
      },
      {
        title: '💸 Quitações e Abatimentos Antecipados',
        items: [
          '**Quitação Antecipada Completa:** Novo fluxo para quitar e encerrar contratos diários antes do prazo, mudando automaticamente o status para `✓ QUITADO` e interrompendo as cobranças futuras.',
          '**Abatimentos Parciais:** Possibilidade de registrar pagamentos antecipados avulsos sem desativar o faturamento diário.',
          '**Registro de Receita Automático:** Cada quitação ou abatimento gera transações de entrada (`income`) na receita contábil do painel geral, com histórico e log de atividades de controle.'
        ]
      },
      {
        title: '🗓️ Histórico Expandido de Dívidas',
        items: [
          '**Data de Início da Dívida:** A listagem detalhada de cobranças no perfil do cliente agora exibe de forma clara e legível a data em que a dívida foi criada originalmente (`Início: DD/MM/AAAA`), ao lado do vencimento.'
        ]
      }
    ]
  },
  {
    version: 'Versão 2.2 — Centralização Contábil & Filtros nos Relatórios 📊',
    date: '23 de Maio de 2026 (Hoje)',
    description: 'Atualização crítica focada na estabilização de banco de dados para usuários antigos, prevenção de erros e implementação de filtros de dias altamente interativos nos relatórios diários de faturamento.',
    categories: [
      {
        title: '📊 Filtro de Dia nos Relatórios',
        items: [
          '**Gráfico Interativo de Relatórios:** O gráfico diário na aba de Relatórios agora é 100% interativo, permitindo clicar em cada barra individualmente.',
          '**Visualizador de Datas e Valores:** Ao selecionar qualquer barra de data, um readout formatado idêntico ao do Dashboard é exibido com a data e valor corretos.',
          '**Limpeza de Estados:** Seleções são automaticamente limpas ao alternar entre períodos e abas de relatórios para evitar inconsistência visual.'
        ]
      },
      {
        title: '🛠️ Estabilização de Banco de Dados',
        items: [
          '**Migrações Automáticas Integradas:** Centralização da injeção de colunas de score de juros (`interest_rate_excellent`, `interest_rate_regular`, `interest_rate_risk`) na tabela `users` para garantir compatibilidade retroativa total.',
          '**Prevenção de Falhas Silenciosas:** Implementada notificação por modal popup no front-end em caso de falha de conexão ou erro ao criar novas cobranças.',
          '**Correção de Sintaxe SQLite:** Resolvida falha crítica de aspas no literal `datetime("now")` na API de cobranças avulsas.'
        ]
      }
    ]
  },
  {
    version: 'Versão 2.1 — Calendário & Recorrência Exclusiva 📅',
    date: '23 de Maio de 2026 (Hoje)',
    description: 'Nova versão com o Calendário de Pagamentos interativo, opções avançadas de exclusão de cobrança em finais de semana e feriados nacionais brasileiros, datas detalhadas nos gráficos do painel e responsividade total para celulares.',
    categories: [
      {
        title: '📅 Calendário de Pagamentos',
        items: [
          '**Grade Mensal Interativa:** Nova aba "Calendário" no painel exibindo todas as cobranças avulsas e faturamentos diários projetados em um calendário premium com cores por tipo de cobrança.',
          '**Detalhamento por Dia:** Ao tocar/clicar em qualquer dia do calendário, abre um painel deslizante com detalhamento completo de todas as cobranças daquele dia, discriminando cliente, valor, tipo e status.',
          '**Indicadores de Feriados:** Feriados nacionais brasileiros são destacados automaticamente no calendário com indicadores visuais e badges informativos.',
          '**Resumo Financeiro Mensal:** Cards de resumo no topo do calendário com total do mês, cobranças avulsas, faturamento diário e dias com cobrança ativa.'
        ]
      },
      {
        title: '🚫 Exclusão de Finais de Semana e Feriados',
        items: [
          '**Não Cobrar aos Sábados:** Novo checkbox na configuração de cobrança diária permitindo excluir sábados do calendário de cobranças.',
          '**Não Cobrar em Domingos e Feriados:** Checkbox dedicado para excluir domingos e os 9 feriados nacionais fixos brasileiros (Confraternização Universal, Tiradentes, Dia do Trabalho, Independência, Nossa Senhora Aparecida, Finados, Proclamação da República, Consciência Negra e Natal).',
          '**Badges de Restrição nos Cards:** Indicadores visuais elegantes (🚫 Sem Sábado, 🚫 Sem Dom/Feriados) nos cards de faturamento diário para fácil identificação.',
          '**Sincronização com Calendário:** As exclusões são automaticamente respeitadas na projeção do Calendário de Pagamentos.'
        ]
      },
      {
        title: '📊 Datas nos Gráficos do Dashboard',
        items: [
          '**Gráfico de Receita Interativo:** Ao tocar ou passar o mouse nas barras do gráfico de receita, exibe imediatamente a data completa e o valor em uma badge descritiva abaixo do gráfico.',
          '**Rótulos de Período:** Adição de labels de data inicial e final no eixo do gráfico de barras de receita.',
          '**Datas na Atividade Recente:** Cada item do feed de atividades agora inclui a data formatada junto ao tempo relativo.',
          '**Data no Resumo Diário:** Exibição da data completa de hoje (dia da semana, dia, mês e ano) no bloco de resumo financeiro diário.'
        ]
      },
      {
        title: '📱 Responsividade Total para Celular',
        items: [
          '**Dashboard Mobile-First:** Todos os grids do painel (estatísticas, gráficos, resumos) se adaptam automaticamente de 4 colunas para 2 e depois 1 em telas menores.',
          '**Cobrança Diária Responsiva:** Cards e formulários de faturamento diário se empilham verticalmente no celular com modal bottom-sheet otimizado para toque.',
          '**Calendário Responsivo:** Células compactas no celular com painel slide-up nativo ao tocar em um dia, facilitando a visualização em telas menores.',
          '**Formulários Adaptáveis:** Modais e drawers se transformam em painéis inferiores deslizantes no mobile, com botões amplos e área de toque confortável.'
        ]
      }
    ]
  },
  {
    version: 'Versão 2.0 — Platinum Update 🐍',
    date: '23 de Maio de 2026 (Hoje)',
    description: 'A maior e mais robusta atualização do Cobbra até hoje! Introduzimos a cobrança diária contratual, o poderoso sistema de abatimentos parciais, score de adimplência do pagador, barra de pesquisa inteligente e o nosso assistente virtual IA Cobrinha.',
    categories: [
      {
        title: '📅 Cobrança Diária & Juros Inteligentes',
        items: [
          '**Contratos Diários:** Nova modalidade de cobrança recorrente diária projetada para prestadores de serviços recorrentes, aluguel de equipamentos/veículos ou mensalistas.',
          '**Juros Diários Personalizáveis:** Adição de campo flexível de juros por dia pós-vencimento configurável no momento de registrar o contrato diário.',
          '**Juros Padrão por Score:** Integração inteligente com as configurações globais de juros automáticos com base no score de adimplência do pagador.',
          '**Vigência Opcional:** Adicionada a opção de criar recorrências diárias limitadas até certa data final de vigência.',
          '**Widgets no Dashboard Geral:** Inclusão de um novo bloco na aba Visão Geral ("Contratos Diários Ativos"), mostrando o faturamento diário recorrente ativo e atalhos rápidos.'
        ]
      },
      {
        title: '💸 Abatimentos de Pagamentos (Baixas Parciais)',
        items: [
          '**Pagamentos Parciais:** Agora você pode registrar baixas parciais nas dívidas ativas dos clientes sem precisar dar baixa total na cobrança.',
          '**Recálculo de Saldos Automático:** O sistema deduz o valor abatido instantaneamente do saldo devedor do cliente e recalcula seu score adimplente em tempo real.',
          '**Transações e Histórico:** Cada abatimento gera uma transação dedicada na receita e no feed de atividades para total controle contábil.'
        ]
      },
      {
        title: '🐍 Assistente de Cobrança IA Cobrinha',
        items: [
          '**Chatbot Flutuante:** Mascote interativo Cobrinha integrado ao Dashboard e à Landing Page.',
          '**Respostas Inteligentes (FAQ):** Responde a dúvidas frequentes instantaneamente e interage com os usuários em linguagem natural de forma descontraída e simpática.'
        ]
      },
      {
        title: '📊 Dashboard e Visão Geral Renovados',
        items: [
          '**Resumo Diário Completo:** Substituição do gráfico de aging pelo novo card de resumos diários ("A receber hoje", "A receber amanhã", "Pago hoje até agora").',
          '**Status Totais e Outstanding:** Exibição clara do "Status das Cobranças Totais" juntamente com a legibilidade de todo o valor a receber ativo da sua carteira.',
          '**Atrasos Detalhados:** O widget de clientes em risco agora exibe a data exata desde quando o devedor está inadimplente.'
        ]
      },
      {
        title: '🔍 Pesquisa Inteligente e Modais Drawer',
        items: [
          '**Pesquisa no Top Header:** Digite qualquer nome de cliente na barra de pesquisa superior para buscar instantaneamente.',
          '**Modais Detalhados Globais:** Ao clicar em um resultado, abra um Drawer global com o perfil completo do cliente, pontualidade, score, histórico e controle de cobranças de qualquer página.',
          '**Novos Campos Opcionais:** Cadastro expandido de clientes com CPF/CNPJ, Empresa, Data de Nascimento e Endereço.'
        ]
      },
      {
        title: '🔄 Recarga Manual de Dados',
        items: [
          '**Botões de Atualização (🔄):** Adicionados botões manuais de recarga instantânea nas quatro telas principais do dashboard (Visão Geral, Cobranças, Cobrança Diária, Clientes), permitindo atualizar dados em tempo real sem recarregar a página inteira.'
        ]
      },
      {
        title: '📄 Contratos de Cobrança em 1-Clique',
        items: [
          '**Gerador de Contratos Particular:** Geração instantânea de contratos particulares de prestação de serviços e/ou fornecimento de produtos vinculados a cada cobrança.',
          '**Auto-preenchimento de Dados:** Preenchimento inteligente dos dados da CONTRATADA (cobradores) e da CONTRATANTE (clientes com CPF/CNPJ e endereço), valor, descrição do serviço e vencimento.',
          '**Cláusulas de Mora Automáticas:** Cláusula de inadimplemento estruturada com a porcentagem de juros diários definida na cobrança pro rata die.',
          '**Impressão Limpa:** Suporte a visualização limpa de folha física e função de exportar PDF direto no navegador para assinatura rápida das partes.'
        ]
      }
    ]
  },
  {
    version: 'Versão 1.5 — Integração Z-API',
    date: '10 de Abril de 2026',
    description: 'Melhorias de desempenho no motor SQLite e conectividade com a API oficial do WhatsApp via instâncias integradas.',
    categories: [
      {
        title: '📱 Mensageria automatizada',
        items: [
          'Integração oficial de webhooks com Evolution API e Z-API.',
          'Fluxo de disparos automáticos baseados em gatilhos de vencimento.'
        ]
      }
    ]
  }
];

export default function AtualizacoesPage() {
  const cardS = { background: '#1e293b', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      
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
      <div style={{ position: 'relative', paddingLeft: 12 }}>
        {changelog.map((log, index) => (
          <div key={index} style={cardS}>
            
            {/* Version Meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#10b981', margin: 0 }}>{log.version}</h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0 0' }}>Lançamento: {log.date}</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: index === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', color: index === 0 ? '#10b981' : '#64748b' }}>
                {index === 0 ? '🚀 DESTAQUE' : 'HISTÓRICO'}
              </span>
            </div>

            {/* Version Intro */}
            <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 24 }}>{log.description}</p>

            {/* Feature categories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {log.categories.map((cat, catIdx) => (
                <div key={catIdx} style={{ background: 'rgba(255,255,255,0.01)', borderRadius: 12, padding: 18, border: '1px solid rgba(255,255,255,0.03)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {cat.title}
                  </h4>
                  <ul style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cat.items.map((item, itemIdx) => {
                      // Format bold text markdown inline
                      const formattedText = item.split('**').map((part, pIdx) => 
                        pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: '#e2e8f0' }}>{part}</strong> : part
                      );
                      return (
                        <li key={itemIdx} style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                          {formattedText}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
