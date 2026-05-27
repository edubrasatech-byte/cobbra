import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function TemplatesPage() {
  return (
    <InfoPageWrapper title="Biblioteca de Templates" category="Educação">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        Templates de mensagens financeiras amigáveis prontos para uso. Copie e personalize para seu WhatsApp ou e-mail corporativo.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Templates para WhatsApp</h3>
      <p style={{ marginBottom: 18 }}>
        As mensagens no celular devem ser curtas, diretas e conter espaçamento limpo. Veja nossos modelos de régua de disparos:
      </p>

      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <h4 style={{ color: '#10b981', margin: '0 0 10px 0', fontSize: 15 }}>🟢 Lembrete Amigável (1 Dia Antes)</h4>
        <p style={{ fontFamily: 'monospace', fontSize: 13, color: '#f1f5f9', margin: 0, lineHeight: 1.5 }}>
          "Olá, [Nome]! Tudo bem? 💚 Passando apenas para te lembrar que sua mensalidade de [Serviço] no valor de R$ [Valor] vence amanhã ([Data]). Segue o Pix copia e cola abaixo para facilitação do pagamento. Obrigado pela parceria! 🤝"
        </p>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <h4 style={{ color: '#f59e0b', margin: '0 0 10px 0', fontSize: 15 }}>🟡 Alerta Neutro (Dia do Vencimento)</h4>
        <p style={{ fontFamily: 'monospace', fontSize: 13, color: '#f1f5f9', margin: 0, lineHeight: 1.5 }}>
          "Olá, [Nome]! 📢 Sua fatura Pix de R$ [Valor] vence hoje ([Data]). Segue o código de pagamento abaixo. Caso já tenha efetuado, por favor desconsidere este aviso. Ótimo dia! 🌸"
        </p>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <h4 style={{ color: '#ef4444', margin: '0 0 10px 0', fontSize: 15 }}>🔴 Alerta Firme (Atrasado - 2 Dias Depois)</h4>
        <p style={{ fontFamily: 'monospace', fontSize: 13, color: '#f1f5f9', margin: 0, lineHeight: 1.5 }}>
          "Olá, [Nome]. Registramos que sua fatura de R$ [Valor] com vencimento em [Data] encontra-se em atraso. Segue o código atualizado contendo o acréscimo de encargos moratórios diários para regularização imediata do saldo. Agradecemos a atenção. 📞"
        </p>
      </div>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Personalização Ilimitada por IA</h3>
      <p style={{ marginBottom: 18 }}>
        *Dica:* Embora você possa copiar e colar esses templates manualmente, os assinantes do **Cobbra** contam com a **Catarina IA Robot**, que reescreve e adapta esses textos de forma única a cada cliente com base no tom desejado, eliminando completamente qualquer monotonia ou mensagens que pareçam spam!
      </p>
    </InfoPageWrapper>
  );
}
