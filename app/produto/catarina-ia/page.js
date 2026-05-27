import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function CatarinaIaPage() {
  return (
    <InfoPageWrapper title="Catarina IA Robot" category="Produto">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        Seu Robô Financeiro e Copilot Inteligente. Catarina IA gera mensagens personalizadas, analisa o risco de inadimplência e automatiza seu fluxo financeiro.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Inteligência Artificial Generativa Voltada a Recebíveis</h3>
      <p style={{ marginBottom: 18 }}>
        Catarina IA é o cérebro por trás da plataforma Cobbra. Longe de ser apenas um disparador de alertas comum, Catarina compreende a dívida, o perfil de pontualidade do cliente (health score) e redige em tempo real lembretes Pix totalmente adaptados ao tom que você escolher: gentil, neutro, firme ou descontraído.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Principais Recursos da Catarina IA</h3>
      <ul style={{ paddingLeft: 20, marginBottom: 18, listStyleType: 'disc' }}>
        <li style={{ marginBottom: 8 }}><strong>Geração de Mensagens Contextuais:</strong> Catarina cria mensagens dinâmicas contendo o nome do tomador, valor e prazo, soando 100% natural (humano-like).</li>
        <li style={{ marginBottom: 8 }}><strong>Análise Preditiva de Risco:</strong> Monitora o histórico de pagamentos e categoriza devedores em faixas de score (Excelente, Regular, Alto Risco) para aplicar juros justos automatizados.</li>
        <li style={{ marginBottom: 8 }}><strong>Extração de Metadados:</strong> Ajuda a estruturar contratos e extrair dados de faturamento de forma extremamente rápida.</li>
      </ul>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Um Robô que Nunca Dorme</h3>
      <p style={{ marginBottom: 18 }}>
        Enquanto você dorme ou se foca na atividade principal do seu negócio, Catarina IA gerencia o agendamento de disparos e garante a saúde financeira do seu fluxo de caixa de maneira 100% autônoma e silenciosa.
      </p>
    </InfoPageWrapper>
  );
}
