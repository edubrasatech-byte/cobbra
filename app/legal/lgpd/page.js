import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function LgpdPage() {
  return (
    <InfoPageWrapper title="Conformidade LGPD" category="Legal">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        Garantimos conformidade estrita com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>1. Agentes de Tratamento</h3>
      <p style={{ marginBottom: 18 }}>
        Na prestação dos serviços do Cobbra, os papéis regulados pela LGPD são divididos da seguinte forma:
      </p>
      <ul style={{ paddingLeft: 20, marginBottom: 18, listStyleType: 'disc' }}>
        <li style={{ marginBottom: 8 }}><strong>Você (Assinante):</strong> Atua na qualidade de <strong>Controlador</strong> dos dados pessoais dos seus clientes e tomadores de obrigações cadastrados no sistema, cabendo a você determinar a base legal do tratamento.</li>
        <li style={{ marginBottom: 8 }}><strong>O Cobbra.ai:</strong> Atua como <strong>Operador</strong> dos dados pessoais a comando e sob as diretrizes de faturamento especificadas pelo controlador nas configurações do software.</li>
      </ul>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>2. Direitos dos Titulares</h3>
      <p style={{ marginBottom: 18 }}>
        Garantimos canais rápidos para que os titulares de dados possam solicitar, por meio do Controlador:
      </p>
      <ul style={{ paddingLeft: 20, marginBottom: 18, listStyleType: 'disc' }}>
        <li style={{ marginBottom: 8 }}>Confirmação da existência de tratamento de seus registros.</li>
        <li style={{ marginBottom: 8 }}>Acesso rápido aos dados arquivados nas tabelas de clientes e faturas.</li>
        <li style={{ marginBottom: 8 }}>Correção de dados incompletos, inexatos ou desatualizados.</li>
        <li style={{ marginBottom: 8 }}>Exclusão permanente de dados pessoais tratados com o consentimento do titular.</li>
      </ul>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>3. Segurança Operacional</h3>
      <p style={{ marginBottom: 18 }}>
        Para assegurar a integridade física dos registros de devedores e usuários, aplicamos rotinas diárias de backup criptografado em ambiente cloud isolado, barreiras de firewall contra acessos indevidos na API do WhatsApp, autenticação de sessão do assinante via JSON Web Token (JWT) e auditoria de auditoria contra injeção de dados.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>4. Contato do Encarregado (DPO)</h3>
      <p style={{ marginBottom: 18 }}>
        Dúvidas sobre o processamento de registros pessoais no Cobbra podem ser encaminhadas diretamente ao nosso Encarregado pelo e-mail <strong>lgpd@cobbra.ai</strong>.
      </p>
    </InfoPageWrapper>
  );
}
