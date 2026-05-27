import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function PlanilhaCaixaPage() {
  return (
    <InfoPageWrapper title="Planilha de Fluxo de Caixa" category="Educação">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        Controle o seu saldo mensal e planeje seus recebíveis com nosso modelo prático e descomplicado de planilhas financeiras.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>O Fluxo de Caixa Sem Complicação</h3>
      <p style={{ marginBottom: 18 }}>
        Muitos autônomos e freelancers sentem-se intimidados com softwares de contabilidade complexos. A verdade é que uma planilha limpa e bem estruturada é o primeiro grande passo para a organização do caixa. Disponibilizamos um modelo gratuito que separa claramente suas entradas (receitas financeiras) e saídas (despesas fixas e variáveis).
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Como Baixar e Utilizar o Modelo?</h3>
      <p style={{ marginBottom: 18 }}>
        Nosso modelo é totalmente compatível com o Google Sheets e Microsoft Excel. Siga os passos:
      </p>
      <ol style={{ paddingLeft: 20, marginBottom: 18, listStyleType: 'decimal' }}>
        <li style={{ marginBottom: 8 }}>Clique no link de download em nossa central para obter o arquivo template.</li>
        <li style={{ marginBottom: 8 }}>Vá em <strong>Arquivo &rarr; Fazer uma Cópia</strong> (se estiver no Google Drive).</li>
        <li style={{ marginBottom: 8 }}>Preencha as colunas de "Vencimento" e "Valor Previsto".</li>
        <li style={{ marginBottom: 8 }}>Registre a data e o valor real da liquidação Pix quando o pagamento for efetuado.</li>
      </ol>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Próximo Nível: Automação Total</h3>
      <p style={{ marginBottom: 18 }}>
        As planilhas são ótimas para planejamento estático, mas dependem totalmente da digitação manual de dados. Ao integrar seu faturamento ao **Cobbra**, a conciliação é imediata: a liquidação Pix é identificada no sistema, a régua de WhatsApp é interrompida de forma inteligente e os gráficos financeiros no seu painel são atualizados automaticamente, eliminando qualquer trabalho braçal de conferência!
      </p>
    </InfoPageWrapper>
  );
}
