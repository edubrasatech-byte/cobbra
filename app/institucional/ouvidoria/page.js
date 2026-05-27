import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export default function OuvidoriaPage() {
  return (
    <InfoPageWrapper title="Ouvidoria Fintech" category="Contato">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 20 }}>
        Canal de mediação de última instância para garantir a total transparência e resolução justa de demandas.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>O que é a Ouvidoria?</h3>
      <p style={{ marginBottom: 18 }}>
        A Ouvidoria do Cobbra atua de forma independente e imparcial, buscando soluções definitivas para contestações ou reclamações que não foram plenamente sanadas pelos nossos canais convencionais de Suporte e Atendimento Primário. Nosso compromisso é o aprimoramento contínuo de nossos processos e a manutenção da confiança no nosso ecossistema SaaS.
      </p>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Quando acionar a Ouvidoria?</h3>
      <p style={{ marginBottom: 18 }}>
        Recomendamos que você acione este canal apenas se:
      </p>
      <ul style={{ paddingLeft: 20, marginBottom: 18, listStyleType: 'disc' }}>
        <li style={{ marginBottom: 8 }}>Já tiver entrado em contato com o suporte técnico e recebido um número de protocolo/ticket.</li>
        <li style={{ marginBottom: 8 }}>A resposta ou solução fornecida não tenha sido satisfatória ou tenha extrapolado o prazo operacional regular de 48h.</li>
        <li style={{ marginBottom: 8 }}>Desejar registrar reclamações de conduta ética ou problemas severos de conformidade.</li>
      </ul>

      <h3 style={{ color: '#10b981', fontSize: 20, marginTop: 30, marginBottom: 12 }}>Como entrar em contato?</h3>
      <p style={{ marginBottom: 18 }}>
        Para registrar uma demanda na Ouvidoria, envie um e-mail detalhado contendo seu ID de usuário, número do ticket de suporte anterior e a descrição do ocorrido para: <strong>ouvidoria@cobbra.ai</strong>. Nosso prazo máximo de resposta conclusiva para o seu caso é de até 5 dias úteis.
      </p>
    </InfoPageWrapper>
  );
}
