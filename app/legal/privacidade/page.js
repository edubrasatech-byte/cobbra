import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function PrivacidadePage() {
  return (
    <InfoPageWrapper title="Política de Privacidade" category="Legal">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        Última atualização: 27 de maio de 2026.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>1. Coleta de Informações</h3>
      <p style={{ marginBottom: 18 }}>
        O Cobbra.ai respeita integralmente a privacidade dos seus usuários. Coletamos e processamos apenas as informações estritamente necessárias para o funcionamento e melhoria de nossas ferramentas de cobrança inteligente:
      </p>
      <ul style={{ paddingLeft: 20, marginBottom: 18, listStyleType: 'disc' }}>
        <li style={{ marginBottom: 8 }}><strong>Dados cadastrais:</strong> Nome, e-mail, telefone/WhatsApp de contato corporativo e dados do seu negócio.</li>
        <li style={{ marginBottom: 8 }}><strong>Dados Pix:</strong> Tipo de chave Pix e chave configurada para integração direta do checkout.</li>
        <li style={{ marginBottom: 8 }}><strong>Dados de Clientes e Cobranças:</strong> Nomes, telefones, e-mails de devedores e histórico de parcelas geradas no dashboard.</li>
      </ul>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>2. Uso de Dados</h3>
      <p style={{ marginBottom: 18 }}>
        Todos os dados coletados são utilizados exclusivamente para permitir o envio automatizado e seguro de lembretes amigáveis, gerar estatísticas financeiras preditivas no seu painel de gestor, gerar contratos de locações/crédito pela Catarina IA e realizar suporte técnico. O Cobbra **nunca** vende, compartilha ou expõe dados cadastrais de nossos assinantes ou dos clientes devedores a terceiros para fins promocionais.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>3. Retenção e Exclusão</h3>
      <p style={{ marginBottom: 18 }}>
        Os registros de cobranças, mensagens enviadas e arquivos de backup são retidos sob protocolos rígidos de criptografia SSL enquanto durar a assinatura da plataforma. Caso decida cancelar sua conta, todos os registros de clientes e faturas associados serão permanentemente excluídos ou anonimizados dos nossos servidores principais no prazo de 30 dias.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>4. Cookies e Telemetria</h3>
      <p style={{ marginBottom: 18 }}>
        Utilizamos cookies de sessão e telemetria básica apenas para manter a autenticação de segurança ativa no seu painel administrativo corporativo e registrar logs de atividades contra acessos indevidos.
      </p>
    </InfoPageWrapper>
  );
}
