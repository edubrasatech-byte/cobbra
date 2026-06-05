import Link from 'next/link';

// Static dictionaries for programmatic SEO mapping
export const SEGMENTS = {
  'aluguel-carros-frota': {
    title: 'Sistema de Aluguel de Carros e Frotas',
    niche: 'Locação de Veículos',
    keywords: 'aluguel de carros, gestão de frotas, contrato locação de veículo, caução pix',
    benefitTitle: 'Controle diárias e cauções de frotas em segundos',
    description: 'Gerencie diárias, vistorias de entrega e devolução, controle de quilometragem e depósitos de caução 100% integrados no Pix.',
    whatsappMessage: 'Olá {cliente_nome}! 🚗 Passando para lembrar que o aluguel do veículo {modelo} vence em 2 dias. Segue o Pix para pagamento: {chave_pix}',
    features: [
      'Controle estrito de prazos de devolução de veículos',
      'Gerador de termo de retirada e vistorias detalhadas',
      'Cobrança e devolução automáticas do depósito caução',
      'Alertas automáticos de vencimento e atraso via WhatsApp'
    ]
  },
  'aluguel-carros-uber': {
    title: 'Aluguel de Carros para Uber e Aplicativos',
    niche: 'Locação para Uber',
    keywords: 'aluguel de carros para uber, locação uber, aluguel carro motorista aplicativo, carro para trabalhar 99',
    benefitTitle: 'Locação descomplicada de carros para motoristas Uber',
    description: 'Gerencie o aluguel semanal de veículos para motoristas de aplicativos (Uber, 99, InDrive). Controle cauções, vistorias e mande lembretes Pix recorrentes automáticos com taxa zero.',
    whatsappMessage: 'Oi {cliente_nome}! 🚗 Passando para lembrar que a semanalidade da locação do seu carro para Uber vence hoje ({valor}). Segue o Pix para quitação: {link_pagamento}',
    features: [
      'Controle de semanalidades e limite de quilometragem',
      'Cobrança e controle automatizado de caução de danos',
      'Lembretes recorrentes automáticos no WhatsApp no dia do vencimento',
      'Geração de termos de responsabilidade para sinistros e multas'
    ]
  },
  'locacao-equipamentos': {
    title: 'Gestão de Cobranças de Locação de Equipamentos',
    niche: 'Locação de Equipamentos',
    keywords: 'locação de máquinas, aluguel de andaime, contrato locação ferramentas, boleto pix',
    benefitTitle: 'Evite atrasos no aluguel de máquinas e ferramentas',
    description: 'Automatize a emissão de cobranças de aluguel de maquinários, ferramentas civis ou equipamentos médicos direto no Pix com taxa zero.',
    whatsappMessage: 'Olá {cliente_nome}! 🛠️ Lembramos que a locação do maquinário {equipamento} ({valor}) vence hoje. Efetue o Pix no link: {link_pagamento}',
    features: [
      'Controle de faturas mensais, quinzenais ou diárias',
      'Termos de responsabilidade civil e avarias integrados',
      'Cobrança automática de prorrogações de contratos',
      'Links Pix rápidos que geram recibos instantâneos'
    ]
  },
  'locacao-imoveis-temporada': {
    title: 'Gestão de Aluguel de Imóveis e Temporada',
    niche: 'Aluguel de Temporada',
    keywords: 'aluguel temporada, contrato locação curta temporada, cobrança pix aluguel, airbnb direto',
    benefitTitle: 'Cobrança profissional de estadias e faxinas',
    description: 'Emita contratos de locação por temporada, cobre diárias de hospedagem, calções de danos e taxas de limpeza sem pagar taxas abusivas.',
    whatsappMessage: 'Oi {cliente_nome}! 🏡 Tudo pronto para o seu check-in? Segue o link Pix para quitação da taxa de limpeza e caução: {link_pagamento}',
    features: [
      'Contratos de locação temporária gerados por IA',
      'Controle automático de check-in e check-out',
      'Cobrança integrada de taxas extras e consumo de energia',
      'Régua amigável de cobrança via WhatsApp e e-mail'
    ]
  },
  'aluguel-ferramentas': {
    title: 'Controle de Cobranças de Locação de Ferramentas',
    niche: 'Locação de Ferramentas',
    keywords: 'aluguel betoneira, locadora ferramentas, cobrança aluguel furadeira, contrato ferramentas',
    benefitTitle: 'Gerencie sua locadora de ferramentas sem planilhas',
    description: 'Livre-se das planilhas! Controle quem está com suas ferramentas, envie alertas de atraso e receba via Pix na hora.',
    whatsappMessage: 'Olá {cliente_nome}! 🔩 O prazo de devolução das ferramentas vence amanhã. Caso precise renovar ou pagar a diária, use o Pix: {link_pagamento}',
    features: [
      'Controle visual de ferramentas locadas e disponíveis',
      'Emissão automática de termos de responsabilidade física',
      'Cobrança diária pro-rata automática por atraso',
      'Acabe com o esquecimento de devoluções físicas'
    ]
  },
  'locacao-vestuario': {
    title: 'Controle de Aluguel de Ternos e Vestidos',
    niche: 'Aluguel de Vestuário',
    keywords: 'aluguel vestidos de festa, aluguel ternos, multa atraso devolução roupa, cobrança pix',
    benefitTitle: 'Monitore devoluções de ternos e vestidos na data',
    description: 'Automatize a lembrança de devolução de trajes finos, ternos e vestidos de noiva. Evite atrasos e prejuízos com multas automáticas.',
    whatsappMessage: 'Olá {cliente_nome}! 👗 Lembramos que a devolução do vestido alugado deve ser feita até amanhã às 18h. Evite multas diárias! Dúvidas: {fone}',
    features: [
      'Alerta automático de data limite de devolução física',
      'Cálculo e cobrança imediata de multas de atraso no Pix',
      'Contratos com cláusula de danos ao tecido e ajustes',
      'Recibo digital emitido na devolução do traje'
    ]
  },
  'controle-emprestimos-juros': {
    title: 'Controle de Empréstimos a Juros Pessoais',
    niche: 'Microcrédito e Empréstimos',
    keywords: 'controle agiota, controle empréstimos juros diários, sistema cobrança juros, empréstimos pessoais',
    benefitTitle: 'Controle estrito de parcelas, multas e juros diários',
    description: 'Monitore suas operações de microcrédito e empréstimos pessoais. Calcule juros moratórios estritos e dispare réguas de cobrança automatizadas.',
    whatsappMessage: 'Atenção {cliente_nome}! ⚠️ Hoje vence a parcela do seu empréstimo ({valor}). O não pagamento hoje gerará juros adicionais diários. Pix: {chave}',
    features: [
      'Cálculo dinâmico de juros moratórios e multas diárias',
      'Visualização clara de datas de repasse e parcelamento',
      'Régua de cobrança firme no WhatsApp para atrasos',
      'Privacidade absoluta com banco de dados seguro'
    ]
  },
  'gestao-microcredito': {
    title: 'Sistema de Cobrança Financeira de Microcrédito',
    niche: 'Microcrédito',
    keywords: 'sistema microcrédito gratuito, cobrar empréstimo whatsapp, controle carteira cobrança, carnê pix',
    benefitTitle: 'Profissionalize suas operações de crédito local',
    description: 'Automatize o envio de carnês, lembretes de cobrança de parcelas e facilite a quitação total ou parcial de empréstimos direto no Pix.',
    whatsappMessage: 'Prezado {cliente_nome}. Segue o lembrete da parcela de microcrédito com vencimento em 3 dias ({valor}). Efetue o Pix no link: {link}',
    features: [
      'Emissão automática de links Pix copia e cola e QR Code',
      'Histórico completo de pagamentos e parcelas quitadas',
      'Seeding de réguas de cobrança rígidas e insistentes',
      'Relatórios consolidados de rendimento de juros'
    ]
  },
  'controle-crediario-proprio': {
    title: 'Gestão de Crediário e Carnê Próprio Comercial',
    niche: 'Crediário Comercial',
    keywords: 'carnê próprio de loja, controle de fiado, carnê pix automático, cobrança whatsapp fiado',
    benefitTitle: 'Venda no crediário e acabe com o famoso fiado',
    description: 'Monitore as parcelas do carnê dos seus clientes locais. Envie lembretes amigáveis no WhatsApp e receba via Pix sem taxas bancárias.',
    whatsappMessage: 'Oi {cliente_nome}! 😊 Lembramos que a parcela do seu carnê da loja vence amanhã ({valor}). Segue a chave Pix para pagamento fácil: {chave_pix}',
    features: [
      'Geração de carnês Pix inteligentes sem tarifa de emissão',
      'Lembretes de cobrança com tom amigável no WhatsApp',
      'Facilitação de acordos e parcelas de renegociação',
      'Painel estatístico de clientes adimplentes e inadimplentes'
    ]
  },
  'cobranca-juros-diarios': {
    title: 'Cobrança Financeira e Controle de Juros Diários',
    niche: 'Cobrança Estrita',
    keywords: 'calcular juros diários atraso, cobrar juros no pix, régua cobrança rígida, inadimplência zero',
    benefitTitle: 'Atualize cobranças com juros diários acumulados',
    description: 'Configure regras estritas de juros moratórios por dia de atraso. O sistema atualiza o valor final do Pix do cliente automaticamente.',
    whatsappMessage: 'URGENTE {cliente_nome}! ⚡ Sua parcela está em atraso. O valor atualizado hoje com juros diários acumulados é {valor}. Link Pix: {link}',
    features: [
      'Atualização automática do Pix Copia e Cola com juros diários',
      'Régua de lembretes que aumenta o rigor conforme os dias',
      'Envio em massa de alertas de atraso e notificações',
      'Redução de até 60% no tempo médio de recebimento de dívidas'
    ]
  },
  'lembrete-whatsapp-pix': {
    title: 'Lembrete de Cobrança por WhatsApp com Pix',
    niche: 'Lembrete Recorrente',
    keywords: 'lembrete pix whatsapp, cobrança whatsapp automática, notificar cliente pix, controle financeiro',
    benefitTitle: 'Envie lembretes Pix no WhatsApp e receba na hora',
    description: 'Envie avisos automáticos de faturamento ou mensalidades diretamente no WhatsApp do cliente com o código Pix pronto para pagar.',
    whatsappMessage: 'Olá {cliente_nome}! 🐍 Passando para lembrar que sua mensalidade vence em 3 dias ({valor}). Efetue o Pix prático no link: {link}',
    features: [
      'Disparos integrados de WhatsApp e e-mail combinados',
      'Importação em lote de contatos e clientes via planilha',
      'Régua de cobrança automática pré e pós-vencimento',
      'Confirmação automática de recebimento em tempo real'
    ]
  },
  'sistema-cobranca-autonomo': {
    title: 'Plataforma de Cobranças para Autônomos',
    niche: 'Cobranças para Autônomos',
    keywords: 'cobrar cliente autônomo, aplicativo cobrança freelancer, gestão faturas pix, receber sem taxa',
    benefitTitle: 'Ideal para personal trainers, psicólogos e freelancers',
    description: 'A solução definitiva para profissionais independentes. Automatize suas cobranças de mensalidades e diárias e receba 100% livre de taxas.',
    whatsappMessage: 'Olá {cliente_nome}! 🏋️‍♂️ Sua mensalidade do plano de treinamentos vence hoje ({valor}). Bora manter a consistência! Pague no Pix: {link}',
    features: [
      'Geração de links de pagamento e propostas com IA',
      'Painel de controle de mensalidades ativas e pendentes',
      'Zero taxas de intermediação: o dinheiro cai direto no seu banco',
      'Catarina AI: assistente inteligente que redige propostas'
    ]
  },
  'gestao-mensalidades-atrasadas': {
    title: 'Cobrança Automática de Mensalidades Atrasadas',
    niche: 'Mensalidades Recorrentes',
    keywords: 'recuperar mensalidades em atraso, como cobrar cliente inadimplente, régua cobrança recorrente',
    benefitTitle: 'Reduza a taxa de inadimplência em até 40%',
    description: 'Configure réguas de lembretes recorrentes e amigáveis para regularizar mensalidades em atraso de academias, estúdios, cursos ou consultórios.',
    whatsappMessage: 'Oi {cliente_nome}! 🌸 Notamos que a mensalidade do dia {data} ficou pendente. Tudo bem? Segue o link Pix para regularizar: {link}',
    features: [
      'Cálculo e agrupamento automático de parcelas em aberto',
      'Envio automático de acordos com desconto para quitação',
      'Notificações insistentes no WhatsApp e e-mail integradas',
      'Bloqueio automático temporário em caso de inadimplência longa'
    ]
  },
  'recibos-automaticos-pix': {
    title: 'Emissor de Recibos Automáticos Pix',
    niche: 'Recibos Financeiros',
    keywords: 'gerar recibo pix automático, comprovante de pagamento profissional, emissor recibo online',
    benefitTitle: 'Dispare recibos em PDF imediatamente após o pagamento',
    description: 'Seu cliente pagou o Pix? O sistema gera automaticamente um recibo em PDF timbrado com sua logomarca e envia no WhatsApp dele.',
    whatsappMessage: 'Obrigado pelo pagamento, {cliente_nome}! 🎉 Seu recibo digital oficial referente à fatura {codigo} já está disponível em PDF: {link_pdf}',
    features: [
      'Geração imediata de PDFs de quitação profissional',
      'Assinatura digital e código de verificação de autenticidade',
      'Envio automático sem necessidade de intervenção humana',
      'Personalização com logotipo da sua empresa e assinatura'
    ]
  }
};

export const CITIES = {
  'sao-paulo': { name: 'São Paulo', state: 'SP', article: 'em' },
  'rio-de-janeiro': { name: 'Rio de Janeiro', state: 'RJ', article: 'no' },
  'belo-horizonte': { name: 'Belo Horizonte', state: 'MG', article: 'em' },
  'porto-alegre': { name: 'Porto Alegre', state: 'RS', article: 'em' },
  'curitiba': { name: 'Curitiba', state: 'PR', article: 'em' },
  'florianopolis': { name: 'Florianópolis', state: 'SC', article: 'em' },
  'salvador': { name: 'Salvador', state: 'BA', article: 'em' },
  'fortaleza': { name: 'Fortaleza', state: 'CE', article: 'em' },
  'recife': { name: 'Recife', state: 'PE', article: 'em' },
  'brasilia': { name: 'Brasília', state: 'DF', article: 'em' },
  'goiania': { name: 'Goiânia', state: 'GO', article: 'em' },
  'campinas': { name: 'Campinas', state: 'SP', article: 'em' }
};

// Next.js Server Components Dynamic Metadata generator
export async function generateMetadata({ params }) {
  const { segmento, cidade } = params;
  const segData = SEGMENTS[segmento];
  const citData = CITIES[cidade];

  if (!segData || !citData) {
    return {
      title: 'Plataforma de Cobranças e Gestão Financeira',
      description: 'Automatize cobranças e contratos com o Cobbra.'
    };
  }

  const title = `${segData.title} ${citData.article} ${citData.name} - ${citData.state} | Cobbra`;
  const description = `Procurando por ${segData.keywords.split(',')[0]} ${citData.article} ${citData.name} (${citData.state})? Conheça o Cobbra. Crie contratos e automatize cobranças Pix no WhatsApp sem taxas.`;

  return {
    title,
    description,
    keywords: segData.keywords.split(',').map(k => `${k.trim()} ${citData.name}`),
    alternates: {
      canonical: `https://cobbra.ai/modelo/${segmento}/${cidade}`
    }
  };
}

export default function SeoProgrammaticPage({ params }) {
  const { segmento, cidade } = params;
  
  const seg = SEGMENTS[segmento];
  const cit = CITIES[cidade];

  // Fallback if route variables do not match dictionary
  if (!seg || !cit) {
    return (
      <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f1f5f9' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Página não encontrada</h2>
          <p style={{ color: '#94a3b8', margin: '8px 0 24px 0' }}>O segmento ou cidade especificado não consta em nosso catálogo de SEO.</p>
          <Link href="/" style={{ background: '#10b981', color: '#070913', padding: '12px 24px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>Voltar para Home</Link>
        </div>
      </div>
    );
  }

  const formattedHeadline = `${seg.title} ${cit.article} ${cit.name} - ${cit.state}`;
  const callToActionUrl = `/contrato-gratis?segmento=${segmento}&cidade=${cidade}`;

  // Localized dynamic reviews and testimonials based on city
  const testimonials = [
    {
      name: `Marcos de Oliveira`,
      business: `${seg.niche} ${cit.name}`,
      quote: `Utilizar o Cobbra revolucionou o meu negócio de ${seg.niche.toLowerCase()} aqui em ${cit.name}. Nossos clientes recebem o lembrete profissional no WhatsApp e pagam imediatamente no Pix. A inadimplência caiu praticamente a zero!`,
      rating: '5/5 ★★★★★'
    },
    {
      name: `Patrícia Schmidt`,
      business: `Gestora Comercial - ${cit.name} / ${cit.state}`,
      quote: `Antes do Cobbra nós gastávamos horas cobrando clientes de forma constrangedora. A régua automatizada no WhatsApp fez tudo parecer leve, e a geração de contratos com a Catarina AI nos poupou dias de trabalho manual.`,
      rating: '4.9/5 ★★★★★'
    }
  ];

  return (
    <div style={{
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif",
      color: '#f1f5f9',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Background Gradient Mesh */}
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
          <span style={{ fontSize: 24 }}>🐍</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px' }}>
            Cobbra <span style={{ color: '#10b981', fontSize: 11, fontWeight: 500, padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 20, marginLeft: 6 }}>Nicho Local</span>
          </span>
        </div>
        <Link 
          href="/" 
          style={{
            color: '#cbd5e1',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
            transition: 'color 0.2s'
          }}
        >
          Conhecer Plataforma
        </Link>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '80px 24px 40px 24px',
        maxWidth: 1100,
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 10,
        textAlign: 'center'
      }}>
        <span style={{
          background: 'rgba(16, 185, 129, 0.1)',
          color: '#10b981',
          padding: '6px 16px',
          borderRadius: 30,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          display: 'inline-block',
          marginBottom: 16
        }}>
          🎯 Solução Localizada para {seg.niche} em {cit.name} - {cit.state}
        </span>
        <h1 style={{
          fontSize: 'clamp(28px, 4.5vw, 42px)',
          fontWeight: 900,
          color: '#ffffff',
          lineHeight: 1.2,
          letterSpacing: '-1px',
          maxWidth: 900,
          margin: '0 auto 20px auto'
        }}>
          {formattedHeadline}
        </h1>
        <p style={{
          fontSize: 'clamp(15px, 2vw, 17px)',
          color: '#cbd5e1',
          lineHeight: 1.6,
          maxWidth: 800,
          margin: '0 auto 32px auto'
        }}>
          {seg.description} Automatize seus recebimentos via Pix, configure réguas de notificações gentis ou estritas pelo WhatsApp e reduza sua inadimplência sem tarifas bancárias abusivas.
        </p>

        {/* Dynamic CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Link 
            href={callToActionUrl}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              padding: '16px 36px',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.3)',
              transition: 'transform 0.2s'
            }}
          >
            Gerar Contrato de {seg.niche} Grátis ➜
          </Link>
          <span style={{ fontSize: 12, color: '#64748b' }}>🎁 Sem cartão · Grátis para testar · Configuração em 2 minutos</span>
        </div>
      </section>

      {/* Main Content Info Grid */}
      <section style={{
        padding: '40px 24px 80px 24px',
        maxWidth: 1200,
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 10,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 32
      }}>
        {/* Left Card: Benefits */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginBottom: 12 }}>
            {seg.benefitTitle}
          </h3>
          <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5, marginBottom: 24 }}>
            Projetado sob medida para as necessidades e regulamentações comerciais {cit.article} {cit.name} ({cit.state}). Tenha total conformidade e eficiência de ponta a ponta.
          </p>

          <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {seg.features.map((f, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: '#cbd5e1' }}>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Card: Interactive WhatsApp Preview */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 24,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <h4 style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Preview do Lembrete no WhatsApp do Cliente
          </h4>
          
          {/* WhatsApp bubble mockup */}
          <div style={{
            backgroundColor: '#075e54',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
          }}>
            {/* Header bar */}
            <div style={{ backgroundColor: '#128c7e', padding: '10px 14px', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>🐍</span>
              <span>Cobbra Notificações - {cit.name}</span>
            </div>
            
            {/* Message body */}
            <div style={{ padding: 14, backgroundImage: 'radial-gradient(#dfd9d0 20%, transparent 20%)', backgroundColor: '#efeae2', backgroundSize: '10px 10px' }}>
              <div style={{
                backgroundColor: '#ffffff',
                color: '#111827',
                borderRadius: '8px 8px 8px 0',
                padding: 12,
                fontSize: 13,
                lineHeight: 1.5,
                maxWidth: '90%',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                position: 'relative'
              }}>
                {seg.whatsappMessage
                  .replace('{cliente_nome}', 'Carlos Souza')
                  .replace('{modelo}', 'Chevrolet Onix')
                  .replace('{equipamento}', 'Mini Escavadeira Bobcat')
                  .replace('{valor}', 'R$ 2.500,00')
                  .replace('{chave_pix}', 'contato@empresa.com')
                  .replace('{link_pagamento}', 'https://cobbra.ai/p/1293a')
                  .replace('{vencimento}', 'amanhã')
                  .replace('{link}', 'https://cobbra.ai/p/1293a')
                  .replace('{chave}', 'contato@empresa.com')
                  .replace('{fone}', '(41) 99999-8888')
                }
                <span style={{ fontSize: 9, color: '#999', display: 'block', textAlign: 'right', marginTop: 4 }}>14:32</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 12, textAlign: 'center' }}>
            🔔 Réguas 100% editáveis. O Pix cai na hora, direto na sua conta bancária cadastrada.
          </p>
        </div>
      </section>

      {/* Localized Testimonials */}
      <section style={{
        backgroundColor: '#1e293b',
        borderTop: '1px solid #334155',
        borderBottom: '1px solid #334155',
        padding: '60px 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', textAlign: 'center', marginBottom: 32, letterSpacing: '-0.5px' }}>
            Quem usa o Cobbra em {cit.name} - {cit.state} aprova
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {testimonials.map((t, idx) => (
              <div key={idx} style={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, fontStyle: 'italic', margin: '0 0 16px 0' }}>
                  "{t.quote}"
                </p>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#10b981', marginTop: 2 }}>{t.business}</div>
                  <div style={{ fontSize: 11, color: '#eab308', marginTop: 6, fontWeight: 600 }}>{t.rating}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Localized FAQ Section */}
      <section style={{
        padding: '60px 24px 80px 24px',
        maxWidth: 900,
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 10
      }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#ffffff', textAlign: 'center', marginBottom: 8, letterSpacing: '-0.5px' }}>
          Perguntas Frequentes sobre {seg.niche} em {cit.name}
        </h2>
        <p style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 40 }}>
          Esclareça suas principais dúvidas sobre o funcionamento do emissor de contratos e réguas no Pix.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <details style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 12,
            padding: 16,
            cursor: 'pointer'
          }}>
            <summary style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>O Cobbra cobra comissão sobre o que eu receber no Pix?</span>
              <span style={{ color: '#10b981', fontSize: 18 }}>+</span>
            </summary>
            <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, marginTop: 12, cursor: 'default' }}>
              Não! Exatamente zero. Nós não intermediamos os seus recebimentos. Você cadastra sua própria chave Pix (CPF, CNPJ, Celular, etc.) e o cliente paga diretamente para o seu banco. O Cobbra apenas automatiza a cobrança e o envio dos lembretes pelo WhatsApp.
            </p>
          </details>

          <details style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 12,
            padding: 16,
            cursor: 'pointer'
          }}>
            <summary style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Como funciona a elaboração de contratos para {cit.name}?</span>
              <span style={{ color: '#10b981', fontSize: 18 }}>+</span>
            </summary>
            <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, marginTop: 12, cursor: 'default' }}>
              Nosso gerador inteligente (Catarina AI) elabora o contrato completo com a qualificação jurídica perfeita das partes de acordo com as leis do Brasil. Você pode adaptar regras de caução, juros de mora diários e termos de devolução diretamente no chat interativo antes de exportar o PDF.
            </p>
          </details>

          <details style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 12,
            padding: 16,
            cursor: 'pointer'
          }}>
            <summary style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Os disparos de lembretes no WhatsApp realmente funcionam?</span>
              <span style={{ color: '#10b981', fontSize: 18 }}>+</span>
            </summary>
            <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, marginTop: 12, cursor: 'default' }}>
              Sim! Nossa régua de cobrança automática envia notificações gentis pré e pós-vencimento com o código Pix pronto para pagamento. Estudos de caso em {cit.name} mostram que o uso de lembretes via WhatsApp reduz atrasos e mensalidades em aberto em mais de 40% já no primeiro mês de uso.
            </p>
          </details>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #1e293b',
        padding: '40px 24px',
        textAlign: 'center',
        backgroundColor: '#0b1329',
        fontSize: 12,
        color: '#64748b',
        position: 'relative',
        zIndex: 10
      }}>
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} Cobbra - Automatização Financeira e Lembretes Pix. Todos os direitos reservados.</p>
        <p style={{ margin: '6px 0 0 0' }}>Disponível para {cit.name} - {cit.state} e todo o Brasil 🐍🇧🇷</p>
      </footer>

      {/* Localized FAQ Structured Data (JSON-LD) for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': [
              {
                '@type': 'Question',
                'name': 'O Cobbra cobra comissão sobre o que eu receber no Pix?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Não! Exatamente zero. Nós não intermediamos os seus recebimentos. Você cadastra sua própria chave Pix (CPF, CNPJ, Celular, etc.) e o cliente paga diretamente para o seu banco. O Cobbra apenas automatiza a cobrança e o envio dos lembretes pelo WhatsApp.'
                }
              },
              {
                '@type': 'Question',
                'name': `Como funciona a elaboração de contratos para ${cit.name}?`,
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': `Nosso gerador inteligente (Catarina AI) elabora o contrato completo com a qualificação jurídica perfeita das partes de acordo com as leis do Brasil. Você pode adaptar regras de caução, juros de mora diários e termos de devolução diretamente no chat interativo antes de exportar o PDF.`
                }
              },
              {
                '@type': 'Question',
                'name': 'Os disparos de lembretes no WhatsApp realmente funcionam?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': `Sim! Nossa régua de cobrança automática envia notificações gentis pré e pós-vencimento com o código Pix pronto para pagamento. Estudos de caso em ${cit.name} mostram que o uso de lembretes via WhatsApp reduz atrasos e mensalidades em aberto em mais de 40% já no primeiro mês de uso.`
                }
              }
            ]
          })
        }}
      />
    </div>
  );
}
