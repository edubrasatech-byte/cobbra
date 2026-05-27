import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function TermosPage() {
  return (
    <InfoPageWrapper title="Termos de Serviço" category="Legal">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        Última atualização: 27 de maio de 2026.
      </p>
      
      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>1. Aceitação dos Termos</h3>
      <p style={{ marginBottom: 18 }}>
        Ao acessar, navegar ou utilizar a plataforma Cobbra.ai (doravante denominada "Cobbra"), de propriedade da Cobbra Tecnologia e Serviços Financeiros Ltda., você concorda de forma expressa, irrevogável e irrestrita com estes Termos de Serviço. Caso não concorde com qualquer disposição constante neste documento, orientamos que interrompa imediatamente o uso do sistema.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>2. Descrição das Soluções</h3>
      <p style={{ marginBottom: 18 }}>
        O Cobbra é um software como serviço (SaaS) voltado a profissionais autônomos, prestadores de serviços independentes, freelancers e microempresas. Oferecemos ferramentas integradas de automação de lembretes de cobrança via e-mail e WhatsApp, robô financeiro inteligente (Catarina IA), gestão de carteira de empréstimos mútuos sob termos cíveis e gestão administrativa de locações de veículos e equipamentos.
      </p>
      <p style={{ marginBottom: 18 }}>
        <strong>Disponibilidade Regulatória:</strong> O Cobbra atua puramente como plataforma tecnológica de facilitação. Não somos uma instituição financeira regulada pelo Banco Central do Brasil. Quaisquer soluções de pagamento e faturamento Pix ou boleto são operadas em parceria com facilitadores autorizados, atuando na qualidade de correspondentes ou integradores técnicos.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>3. Responsabilidades do Usuário</h3>
      <p style={{ marginBottom: 18 }}>
        O assinante da plataforma é integralmente responsável por:
      </p>
      <ul style={{ paddingLeft: 20, marginBottom: 18, listStyleType: 'disc' }}>
        <li style={{ marginBottom: 8 }}>Manter os dados de acesso de sua conta em total sigilo e segurança.</li>
        <li style={{ marginBottom: 8 }}>Garantir a veracidade, autenticidade e validade jurídica dos dados e obrigações cobradas de terceiros por meio da plataforma.</li>
        <li style={{ marginBottom: 8 }}>Obter o devido consentimento dos devedores/clientes para envio de notificações por WhatsApp e e-mail em conformidade com as leis vigentes de spam e privacidade.</li>
        <li style={{ marginBottom: 8 }}>A correta parametrização dos juros de mora e encargos diários, garantindo a conformidade com as regras civis.</li>
      </ul>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>4. Quotas e Assinaturas</h3>
      <p style={{ marginBottom: 18 }}>
        Nossas ferramentas operam sob planos mensais ou anuais fixos. Os volumes de cobranças, envios e geração de contratos por IA respeitam as quotas estabelecidas no painel de consumo do usuário. Ao extrapolar os limites estipulados de trial ou quotas vigentes, o usuário deverá efetuar o upgrade para o plano completo ilimitado ou adimplir taxas excedentes se aplicáveis.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>5. Foro de Eleição</h3>
      <p style={{ marginBottom: 18 }}>
        Para dirimir quaisquer controvérsias oriundas deste termo, as partes elegem a Comarca da Capital de São Paulo - SP, com exclusão de qualquer outra por mais privilegiada que seja.
      </p>
    </InfoPageWrapper>
  );
}
