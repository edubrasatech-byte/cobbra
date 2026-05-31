const fs = require('fs');
const path = require('path');

const SEGMENTS = [
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

const CITIES = [
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

const BASE_URL = 'https://cobbra.ai';
const now = new Date().toISOString().split('T')[0];

function generateSitemap() {
  console.log('🏁 Iniciando geração do sitemap.xml...');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Rotas Principais -->
  <url>
    <loc>${BASE_URL}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/cadastro</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/login</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/contrato-gratis</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;

  // Gerar rotas de SEO Programático
  let count = 0;
  for (const seg of SEGMENTS) {
    for (const cit of CITIES) {
      xml += `  <url>
    <loc>${BASE_URL}/modelo/${seg}/${cit}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>\n`;
      count++;
    }
  }

  xml += `</urlset>`;

  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  
  // Garante que o diretório public existe
  const publicDir = path.join(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`✅ Sitemap.xml gerado com sucesso em ${outputPath}!`);
  console.log(`📊 Total de URLs incluídas: ${count + 4}`);
}

generateSitemap();
