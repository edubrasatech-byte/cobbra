import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function EmprestimosPage() {
  return (
    <InfoPageWrapper title="Gestão de Empréstimos" category="Produto">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        Controle de créditos mútuos e parcelamentos cíveis com juros diários acumulados automáticos por atraso.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Créditos Cíveis e Mútuos Controlados</h3>
      <p style={{ marginBottom: 18 }}>
        O Cobbra disponibiliza uma ferramenta administrativa especializada para quem atua na concessão de créditos mútuos autorizados pela legislação civil brasileira (mútuo entre particulares, parcelamentos de transações mercantis, acordos comerciais ou financiamentos cíveis de bens).
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Funcionalidades e Parâmetros Financeiros</h3>
      <ul style={{ paddingLeft: 20, marginBottom: 18, listStyleType: 'disc' }}>
        <li style={{ marginBottom: 8 }}><strong>Juros Diários Acumulados:</strong> Defina a taxa de mora diária (ex: 0.1% ao dia). O sistema recalcula automaticamente a multa a cada dia de atraso.</li>
        <li style={{ marginBottom: 8 }}><strong>Rastreamento de Tomador:</strong> Centralize o cadastro dos devedores com CPF/CNPJ, e-mail e telefone de faturamento.</li>
        <li style={{ marginBottom: 8 }}><strong>Catarina IA Copilot:</strong> Geração e reescrita de e-mails formais e notificações Pix detalhando a evolução da dívida.</li>
      </ul>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Conformidade Legal</h3>
      <p style={{ marginBottom: 18 }}>
        *Atenção:* O Cobbra atua como ferramenta exclusivamente tecnológica de controle de ativos e recebíveis. É de total responsabilidade do assinante assegurar que a taxa de juros e encargos moratórios definidos nos empréstimos mútuos estejam em estrita conformidade com o Decreto nº 22.626/1933 (Lei de Usura) e com o Código Civil brasileiro.
      </p>
    </InfoPageWrapper>
  );
}
