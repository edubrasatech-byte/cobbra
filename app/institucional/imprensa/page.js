import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function ImprensaPage() {
  return (
    <InfoPageWrapper title="Assessoria de Imprensa" category="Contato">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        Central de comunicação institucional para jornalistas, veículos de comunicação e produtores de conteúdo.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Sobre a Cobbra</h3>
      <p style={{ marginBottom: 18 }}>
        O Cobbra é uma fintech SaaS pioneira no Brasil focada em resolver o fluxo de caixa de microempreendedores individuais (MEIs) e autônomos por meio de cobranças gentis automatizadas pelo WhatsApp. Com nossa tecnologia que integra inteligência artificial generativa (Catarina IA), faturamento Pix direto e ferramentas administrativas verticais, ajudamos milhares de prestadores a reduzir sua inadimplência média de 40% para menos de 6% sem causar desgaste no relacionamento comercial.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Kit de Mídia & Identidade Visual</h3>
      <p style={{ marginBottom: 18 }}>
        Disponibilizamos logotipos oficiais, paletas de cores, ilustrações do mascote cobra e capturas de tela do dashboard corporativo em alta resolução para uso em matérias jornalísticas e reviews tecnológicos. Solicite acesso ao Media Kit diretamente para o nosso time de RP.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Contatos de Imprensa</h3>
      <p style={{ marginBottom: 18 }}>
        Se você está escrevendo um artigo, deseja solicitar entrevistas com nossos fundadores ou precisa de dados agregados do mercado sobre inadimplência de autônomos no Brasil, entre em contato pelo e-mail: <strong>imprensa@cobbra.ai</strong>.
      </p>
    </InfoPageWrapper>
  );
}
