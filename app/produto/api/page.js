import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function ApiPage() {
  return (
    <InfoPageWrapper title="APIs & Integrações" category="Produto">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        Integre o disparo automático de mensagens, a Catarina IA e a gestão de faturamento diretamente com o seu produto, site ou ERP corporativo.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>API RESTful Robusta para Desenvolvedores</h3>
      <p style={{ marginBottom: 18 }}>
        O Cobbra disponibiliza um ecossistema completo de endpoints HTTP estruturados em formato JSON, permitindo que times de engenharia de software automatizem ações financeiras complexas programaticamente.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>O que você pode fazer com a API?</h3>
      <ul style={{ paddingLeft: 20, marginBottom: 18, listStyleType: 'disc' }}>
        <li style={{ marginBottom: 8 }}><strong>Criar e Liquidar Faturas:</strong> Lançar cobranças no Pix ou boleto de forma dinâmica no momento do checkout no seu site.</li>
        <li style={{ marginBottom: 8 }}><strong>Disparar Lembretes no WhatsApp:</strong> Acionar nossa régua de mensagens no WhatsApp dos tomadores a partir de ações externas do seu sistema.</li>
        <li style={{ marginBottom: 8 }}><strong>Webhooks em Tempo Real:</strong> Receber notificações HTTP instantâneas (POST) no seu servidor sempre que uma cobrança for paga, vencida ou cancelada.</li>
      </ul>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Segurança por Chave de API (Bearer Token)</h3>
      <p style={{ marginBottom: 18 }}>
        Nossas integrações operam sob protocolos rigorosos de criptografia SSL/TLS. A autenticação é realizada de forma segura enviando seu token privado corporativo no cabeçalho `Authorization: Bearer seu_token_privado`, mantendo os dados financeiros dos seus clientes totalmente blindados.
      </p>
    </InfoPageWrapper>
  );
}
