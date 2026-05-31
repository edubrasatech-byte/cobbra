export default function sitemap() {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobbra.ai';
  const now = new Date().toISOString();

  const staticPages = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/cadastro`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contrato-gratis`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
  ];

  const segments = [
    'aluguel-carros-frota',
    'aluguel-carros-uber',
    'locacao-equipamentos',
    'locacao-imoveis-temporada',
    'aluguel-ferramentas',
    'locacao-vestuario',
    'controle-emprestimos-juros',
    'gestao-microcredito',
    'controle-crediario-proprio',
    'cobranca-juros-diarios',
    'lembrete-whatsapp-pix',
    'sistema-cobranca-autonomo',
    'gestao-mensalidades-atrasadas',
    'recibos-automaticos-pix'
  ];

  const cities = [
    'sao-paulo',
    'rio-de-janeiro',
    'belo-horizonte',
    'porto-alegre',
    'curitiba',
    'florianopolis',
    'salvador',
    'fortaleza',
    'recife',
    'brasilia',
    'goiania',
    'campinas'
  ];

  const dynamicPages = [];
  for (const segment of segments) {
    for (const city of cities) {
      dynamicPages.push({
        url: `${BASE_URL}/modelo/${segment}/${city}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8
      });
    }
  }

  return [...staticPages, ...dynamicPages];
}

