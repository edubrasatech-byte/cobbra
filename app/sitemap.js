export default function sitemap() {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobbra.com.br';
  const now = new Date().toISOString();

  const staticPages = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/cadastro`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contrato-gratis`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/educacao/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.85 }
  ];

  // Load custom blog articles from SQLite
  const blogPages = [];
  try {
    const { query } = require('@/lib/db');
    const posts = query("SELECT slug, updated_at FROM blog_posts WHERE status = 'published'");
    for (const post of posts) {
      blogPages.push({
        url: `${BASE_URL}/educacao/blog/${post.slug}`,
        lastModified: post.updated_at ? new Date(post.updated_at).toISOString() : now,
        changeFrequency: 'weekly',
        priority: 0.7
      });
    }
  } catch (e) {
    console.error('Failed to append blog pages to sitemap:', e);
  }

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

  return [...staticPages, ...blogPages, ...dynamicPages];
}

