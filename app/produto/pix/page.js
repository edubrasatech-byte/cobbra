import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function PixPage() {
  return (
    <InfoPageWrapper title="Pix Direto 0% Taxas" category="Produto">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        Receba seus pagamentos direto na sua conta bancária sem qualquer tipo de intermediação financeira ou tarifas por transação.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Como funciona o Pix Direto?</h3>
      <p style={{ marginBottom: 18 }}>
        Ao contrário de intermediadores de pagamento, gateways tradicionais ou maquininhas de cartão que cobram taxas percentuais por transação adimplida e retêm seus fundos por dias, o Cobbra opera sob um modelo revolucionário de **"Pix Direto"**.
      </p>
      <p style={{ marginBottom: 18 }}>
        Você cadastra sua chave Pix pessoal ou corporativa (CPF, CNPJ, e-mail, telefone ou chave aleatória) no painel. O Cobbra gera os lembretes com códigos Pix "Copia e Cola" e QR Codes que direcionam o pagamento do devedor diretamente para a sua conta de destino em qualquer instituição bancária do país.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Principais Diferenciais</h3>
      <ul style={{ paddingLeft: 20, marginBottom: 18, listStyleType: 'disc' }}>
        <li style={{ marginBottom: 8 }}><strong>0% de Comissão:</strong> O Cobbra não retém nenhuma porcentagem do valor recebido. R$ 500 cobrados são R$ 500 liquidados na sua conta.</li>
        <li style={{ marginBottom: 8 }}><strong>Liquidação Instantânea:</strong> O dinheiro cai na mesma hora. Sem prazos de 14 ou 30 dias para liberação.</li>
        <li style={{ marginBottom: 8 }}><strong>Segurança Extrema:</strong> Zero riscos de bloqueio judicial ou administrativo de saldo na nossa plataforma.</li>
      </ul>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Economia de Escala</h3>
      <p style={{ marginBottom: 18 }}>
        Se o seu faturamento mensal é de R$ 10.000,00 e você utiliza um intermediador tradicional com taxa média de 2.99%, você perde **R$ 299,00/mês**. Com o plano único de R$ 49,90/mês da Cobbra, você economiza **R$ 249,10/mês**, o que representa uma economia anualizada fantástica de quase R$ 3.000,00!
      </p>
    </InfoPageWrapper>
  );
}
