import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function ParceriasPage() {
  return (
    <InfoPageWrapper title="Parcerias Comerciais" category="Contato">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        Conecte seu produto, comunidade ou instituição financeira ao ecossistema Cobbra.ai.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Por que ser um parceiro?</h3>
      <p style={{ marginBottom: 18 }}>
        O Cobbra é a plataforma de cobrança automatizada que mais cresce entre profissionais autônomos, frotistas e prestadores de serviços no Brasil. Nossas soluções de inteligência artificial de faturamento e dashboards integrados abrem margens ideais para criar valor conjunto com outros players e comunidades do ecossistema empreendedor.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Modelos de Parceria</h3>
      <ul style={{ paddingLeft: 20, marginBottom: 18, listStyleType: 'disc' }}>
        <li style={{ marginBottom: 8 }}><strong>Plataformas SaaS & ERPs:</strong> Integre nosso robô Catarina IA e automatize os lembretes Pix via WhatsApp dentro do seu próprio ecossistema utilizando nossa API robusta.</li>
        <li style={{ marginBottom: 8 }}><strong>Associações & Coletivos:</strong> Ofereça planos corporativos com descontos de volume exclusivos para seus filiados, conselhos de contabilidade, CRM ou sindicatos de prestadores de serviços.</li>
        <li style={{ marginBottom: 8 }}><strong>Fintechs & Instituições:</strong> Associe suas soluções de crédito, Pix e subadquirência à nossa plataforma facilitadora para acelerar a bancarização e reduzir a inadimplência nacional.</li>
      </ul>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Entre em contato</h3>
      <p style={{ marginBottom: 18 }}>
        Tem uma proposta comercial ou deseja discutir integrações estratégicas? Envie um e-mail com detalhes para o nosso time de Business Development: <strong>parcerias@cobbra.ai</strong>.
      </p>
    </InfoPageWrapper>
  );
}
