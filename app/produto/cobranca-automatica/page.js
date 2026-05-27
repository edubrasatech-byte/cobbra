import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function CobrancaAutomaticaPage() {
  return (
    <InfoPageWrapper title="Cobrança Automática" category="Produto">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        Recupere até 40% das suas parcelas pendentes com mensagens amigáveis enviadas no momento exato pelo WhatsApp e e-mail.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>A Solução para o Atraso Sem Atrito</h3>
      <p style={{ marginBottom: 18 }}>
        Ninguém gosta de cobrar, e muito menos de ser cobrado. O Cobbra automatiza todo esse fluxo financeiro desgastante de forma profissional e delicada. Você cadastra o cliente, define o vencimento e deixa que o sistema faça o trabalho de acompanhamento utilizando réguas de comunicação validadas por psicólogos e especialistas financeiros.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Como funciona a Régua de Lembretes?</h3>
      <ul style={{ paddingLeft: 20, marginBottom: 18, listStyleType: 'disc' }}>
        <li style={{ marginBottom: 8 }}><strong>⏰ 3 dias antes:</strong> E-mail elegante prevenindo esquecimentos.</li>
        <li style={{ marginBottom: 8 }}><strong>⏰ 1 dia antes:</strong> WhatsApp gentil lembrando que o vencimento é amanhã.</li>
        <li style={{ marginBottom: 8 }}><strong>🏦 No dia:</strong> Mensagem com o Pix copia e cola e botão de pagamento.</li>
        <li style={{ marginBottom: 8 }}><strong>⚠️ Pós-vencimento:</strong> Alertas programados detalhando juros diários moratórios.</li>
      </ul>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Principais Vantagens</h3>
      <p style={{ marginBottom: 18 }}>
        * **94% de Taxa de Adimplemento:** Nossos usuários relatam que os clientes efetuam o pagamento muito mais rápido quando recebem lembretes amigáveis.
        * **Sem Trabalho Manual:** Esqueça o controle de planilhas e o envio manual de mensagens individuais.
        * **100% no seu Pix:** O cliente paga e o dinheiro vai direto para a sua conta bancária sem qualquer intermediação do Cobbra.
      </p>
    </InfoPageWrapper>
  );
}
