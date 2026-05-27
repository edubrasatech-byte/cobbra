import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function SobrePage() {
  return (
    <InfoPageWrapper title="Sobre a Cobbra" category="Institucional">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        Nossa missão é descomplicar o faturamento e erradicar a inadimplência com inteligência, empatia e tecnologia.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Quem Somos</h3>
      <p style={{ marginBottom: 18 }}>
        O Cobbra nasceu no coração do mercado financeiro e de tecnologia de São Paulo com um propósito claro: empoderar os profissionais independentes, freelancers, estúdios de locação de veículos e microempresas do Brasil. Percebemos que milhões de empreendedores sofriam diariamente com conversas constrangedoras e perda de caixa decorrente da inadimplência informal de seus clientes.
      </p>
      <p style={{ marginBottom: 18 }}>
        Criamos uma plataforma revolucionária baseada em **"Cobranças Gentis"** – lembretes amigáveis, precisos e profissionais disparados no momento correto via WhatsApp e e-mail. Focamos no Pix Direto (0% taxas sobre os valores recebidos), garantindo que cada centavo adimplido vá direto para o caixa de quem trabalhou duro por ele.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Nosso Ecossistema Tecnológico</h3>
      <p style={{ marginBottom: 18 }}>
        Fomos além da cobrança tradicional e criamos Catarina IA – nossa assistente dotada de inteligência artificial generativa, capaz de redigir lembretes de cobrança altamente adaptados ao humor do cliente (gentil, firme ou neutro) e orientar a gestão financeira. Além disso, a plataforma conta com módulos nativos dedicados à gestão de contratos de locações e empréstimos cíveis integrados.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Nossos Valores</h3>
      <ul style={{ paddingLeft: 20, marginBottom: 18, listStyleType: 'disc' }}>
        <li style={{ marginBottom: 8 }}><strong>Gentileza Financeira:</strong> Acreditamos que a cobrança polida e amigável retém clientes e traz taxas de sucesso de pagamento de até 94%.</li>
        <li style={{ marginBottom: 8 }}><strong>Transparência Radical:</strong> Sem letras miúdas ou taxas retidas. Modelo simples de assinatura previsível.</li>
        <li style={{ marginBottom: 8 }}><strong>Inovação Mobile-First:</strong> Plataforma robusta, rápida e fácil de usar no celular ou computador.</li>
      </ul>
    </InfoPageWrapper>
  );
}
