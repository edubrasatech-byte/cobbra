import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function BlogPage() {
  return (
    <InfoPageWrapper title="Blog do Cobbra" category="Educação">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        Artigos práticos, guias de gestão financeira e novidades tecnológicas para autônomos e microempresários.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>1. Como cobrar um cliente atrasado sem perder a amizade?</h3>
      <p style={{ marginBottom: 18 }}>
        Cobrar um saldo pendente é uma das tarefas mais desconfortáveis para prestadores de serviços independentes. No entanto, a inadimplência corrói o caixa do negócio. Abordamos dicas práticas de escrita gentil, o uso correto de gatilhos mentais de reciprocidade e como programar lembretes automáticos no WhatsApp que mantém a parceria comercial saudável.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>2. O Guia do Pix Comercial: Maximizando o faturamento instantâneo</h3>
      <p style={{ marginBottom: 18 }}>
        O Pix revolucionou a circulação de caixa em todo o país. Contudo, muitos freelancers ainda perdem dinheiro com taxas indevidas ou dificuldades no envio do "Copia e Cola" manual. Explicamos como automatizar chaves de faturamento e integrar checkouts Pix 100% livres de intermediações financeiras.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>3. 5 planilhas essenciais de fluxo de caixa que todo MEI precisa</h3>
      <p style={{ marginBottom: 18 }}>
        Rastrear as contas de entrada e saída é vital para evitar surpresas financeiras no fechamento do mês. Apresentamos modelos descomplicados de controle de caixa, conciliação Pix e controle de frotas e cauções para frotistas.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Acompanhe nossa Comunidade</h3>
      <p style={{ marginBottom: 18 }}>
        A educação financeira é a nossa maior arma contra o endividamento informal e o colapso financeiro de freelancers no país. Fique ligado nos nossos boletins semanais contendo insights da Catarina IA.
      </p>
    </InfoPageWrapper>
  );
}
