import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function LocacoesPage() {
  return (
    <InfoPageWrapper title="Gestão de Locações" category="Produto">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        Controle rígido para locadores de frotas, imóveis, equipamentos e estúdios. Automatize o aluguel, o caução e as devoluções de forma profissional.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Gestão de Frotas e Aluguéis Integrada</h3>
      <p style={{ marginBottom: 18 }}>
        O Cobbra conta com um módulo robusto e verticalizado exclusivo para o nicho de locações. Criamos um ecossistema que simplifica a vida de quem aluga bens de alto valor (como carros de aplicativo, maquinários, imóveis por temporada ou instrumentos de filmagem), alinhando faturamento e controle de ativos.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Recursos de Ponta do Módulo de Locação</h3>
      <ul style={{ paddingLeft: 20, marginBottom: 18, listStyleType: 'disc' }}>
        <li style={{ marginBottom: 8 }}><strong>Caução de Garantia (Deposit Amount):</strong> Lance e rastreie o valor de garantia pago pelo inquilino. Restitua ou execute o reembolso de forma simples com logs automáticos.</li>
        <li style={{ marginBottom: 8 }}><strong>Contratos Cíveis Rígidos:</strong> Geração automatizada de contratos de locação detalhados com foro, vigências e multas moratórias.</li>
        <li style={{ marginBottom: 8 }}><strong>Confirmar Devolução de Ativos:</strong> Ao receber o veículo ou equipamento de volta, registre a devolução e liquide o aluguel financeiro instantaneamente no sistema.</li>
      </ul>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Transparência nos Atrasos</h3>
      <p style={{ marginBottom: 18 }}>
        Se o inquilino atrasar o repasse da parcela do aluguel, o Cobbra aciona a régua de lembretes no WhatsApp informando os juros diários acumulados até a entrega física do bem, garantindo a redução rápida da inadimplência.
      </p>
    </InfoPageWrapper>
  );
}
