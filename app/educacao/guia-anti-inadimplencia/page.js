import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function GuiaPage() {
  return (
    <InfoPageWrapper title="Guia Anti-Inadimplência" category="Educação">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        O manual definitivo para blindar o seu caixa, reduzir atrasos e profissionalizar sua comunicação financeira.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Por que os clientes atrasam?</h3>
      <p style={{ marginBottom: 18 }}>
        Na grande maioria dos casos de prestação de serviços a autônomos (como personal trainers, nutricionistas, fotógrafos ou designers), a inadimplência não ocorre por má-fé, mas por **simples esquecimento**. Na correria cotidiana, a fatura passa batida. O envio de lembretes polidos resolve mais de 90% dessas ocorrências sem criar constrangimento.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>3 Pilares da Cobrança de Sucesso</h3>
      <ul style={{ paddingLeft: 20, marginBottom: 18, listStyleType: 'disc' }}>
        <li style={{ marginBottom: 8 }}><strong>1. Freqüência Estruturada (Régua):</strong> Notificar o cliente antes do vencimento demonstra organização e profissionalismo, prevenindo o atraso em primeiro lugar.</li>
        <li style={{ marginBottom: 8 }}><strong>2. Facilidade Absoluta (Ação Direta):</strong> Sempre envie o Pix "Copia e Cola" pronto. Quanto menos passos o cliente precisar tomar para pagar, mais rápido você receberá.</li>
        <li style={{ marginBottom: 8 }}><strong>3. Tom Ajustado (Empatia):</strong> Mensagens gentis no início geram reciprocidade. Alertas de juros diários graduais demonstram firmeza na fase pós-vencimento.</li>
      </ul>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Exemplo de Script Prático (Catarina IA Style)</h3>
      <div style={{ background: 'rgba(255,255,255,0.02)', padding: 18, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'monospace', fontSize: 13, color: '#f1f5f9', marginBottom: 18, lineHeight: 1.5 }}>
        "Oi [Nome]! 💚 Lembrete gentil da Cobbra: sua mensalidade de R$ 300,00 vence amanhã. Segue o código Pix para facilitação do pagamento. Obrigado pela parceria! 🤝"
      </div>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Profissionalize suas cobranças</h3>
      <p style={{ marginBottom: 18 }}>
        Integrar essa rotina de faturamento economiza tempo e blinda o caixa contra a quebra de capital de giro. Profissionalize sua comunicação de cobranças e proteja seu trabalho.
      </p>
    </InfoPageWrapper>
  );
}
