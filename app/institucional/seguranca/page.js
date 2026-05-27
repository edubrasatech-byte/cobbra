import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function SegurancaPage() {
  return (
    <InfoPageWrapper title="Segurança da Informação" category="Institucional">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        A proteção dos seus dados financeiros e cadastrais é a nossa prioridade número um.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>1. Infraestrutura Segura</h3>
      <p style={{ marginBottom: 18 }}>
        A plataforma Cobbra opera sob servidores em nuvem isolados, localizados nos data centers mais modernos do mundo (AWS e Google Cloud Platform), contando com monitoramento 24h contra invasões, backups automáticos de banco de dados e criptografia de ponta a ponta em trânsito e em repouso (AES-256).
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>2. Integrações Isoladas (WhatsApp & VPS)</h3>
      <p style={{ marginBottom: 18 }}>
        Nossas integrações de WhatsApp utilizam instâncias e servidores de mensageria em VPS de alta segurança. O pareamento via QR Code gera um token de acesso de leitura exclusivo que impede qualquer tipo de interceptação do conteúdo das suas conversas pessoais ou roubo de dados.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>3. Pix Direto 100% Protegido</h3>
      <p style={{ marginBottom: 18 }}>
        Nenhuma transação Pix transita ou fica retida nas contas da Cobbra. O sistema apenas facilita a geração e o rastreamento da chave Pix copia e cola e do QR Code dinâmico do próprio devedor para a sua conta bancária. Isso elimina qualquer risco de custódia indevida ou bloqueio de fundos.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>4. Práticas de Desenvolvimento</h3>
      <p style={{ marginBottom: 18 }}>
        Nossa equipe adota diretrizes de desenvolvimento seguro (OWASP Top 10) para proteger nosso código contra vulnerabilidades comuns como Injeção de SQL, XSS, quebra de autenticação e vazamento de informações. Realizamos auditorias periódicas e testes de invasão constantes.
      </p>
    </InfoPageWrapper>
  );
}
