import { query } from '@/lib/db';
import { SEGMENTS, CITIES } from '@/app/modelo/[segmento]/[cidade]/page';
import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export const metadata = {
  title: 'Blog do Cobbra | Dicas de Finanças e Cobrança Automatizada',
  description: 'Artigos práticos de gestão financeira, redução de inadimplência e guias regionais para MEIs e autônomos no Brasil.'
};

export default async function BlogPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams?.q || '';
  const selectedCategory = resolvedSearchParams?.category || '';
  const selectedCity = resolvedSearchParams?.city || '';

  // 1. Fetch custom dynamic blog posts from SQLite database
  let dbPosts = [];
  try {
    let sql = "SELECT * FROM blog_posts WHERE status = 'published'";
    let params = [];
    if (q) {
      sql += " AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ? OR keywords LIKE ?)";
      const likeParam = `%${q}%`;
      params.push(likeParam, likeParam, likeParam, likeParam);
    }
    if (selectedCategory) {
      sql += " AND category = ?";
      params.push(selectedCategory);
    }
    sql += " ORDER BY created_at DESC";
    dbPosts = query(sql, params);
  } catch (err) {
    console.error("Error fetching blog posts from DB:", err);
  }

  // 2. Generate and filter programmatic SEO news items
  const regionalNews = [];
  for (const [segKey, segVal] of Object.entries(SEGMENTS)) {
    for (const [citKey, citVal] of Object.entries(CITIES)) {
      const title = `${segVal.title} ${citVal.article} ${citVal.name}`;
      const description = `Guia de faturamento de ${segVal.niche.toLowerCase()} em ${citVal.name} - ${citVal.state}. Como cobrar pelo WhatsApp e reduzir inadimplência.`;
      
      const matchesQuery = !q || title.toLowerCase().includes(q.toLowerCase()) || description.toLowerCase().includes(q.toLowerCase());
      const matchesCategory = !selectedCategory || segKey === selectedCategory;
      const matchesCity = !selectedCity || citKey === selectedCity;

      if (matchesQuery && matchesCategory && matchesCity) {
        regionalNews.push({
          title,
          slug: `${segKey}/${citKey}`,
          description,
          category: segVal.niche,
          city: citVal.name,
          state: citVal.state,
          link: `/modelo/${segKey}/${citKey}`
        });
      }
    }
  }

  const showAllRegional = q || selectedCategory || selectedCity;
  const displayedRegional = showAllRegional ? regionalNews : regionalNews.slice(0, 9);

  return (
    <InfoPageWrapper title="Blog & Central de Guias" category="Educação">
      <p style={{ fontSize: 16, color: '#f8fafc', marginBottom: 32, textAlign: 'center' }}>
        Dicas práticas de cobrança, modelos de gestão de negócios e guias regionais para combater a inadimplência no Brasil.
      </p>

      {/* Modern Search/Filter Grid Form */}
      <form method="GET" action="/educacao/blog" style={{
        background: 'rgba(30, 41, 59, 0.4)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        borderRadius: '24px',
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        alignItems: 'end',
        marginBottom: '48px',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Buscar</label>
          <input 
            type="text" 
            name="q" 
            defaultValue={q} 
            placeholder="Ex: pix, aluguel, cobrança..." 
            style={{
              background: '#070913', border: '1px solid #334155', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '13px', outline: 'none'
            }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Segmento</label>
          <select 
            name="category" 
            defaultValue={selectedCategory} 
            style={{
              background: '#070913', border: '1px solid #334155', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '13px', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="">Todos os Segmentos</option>
            {Object.entries(SEGMENTS).map(([key, val]) => (
              <option key={key} value={key}>{val.niche}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cidade</label>
          <select 
            name="city" 
            defaultValue={selectedCity} 
            style={{
              background: '#070913', border: '1px solid #334155', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '13px', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="">Todas as Cidades</option>
            {Object.entries(CITIES).map(([key, val]) => (
              <option key={key} value={key}>{val.name} - {val.state}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="submit" 
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)', color: '#070913', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', flex: 1, boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
            }}
          >
            Filtrar
          </button>
          {(q || selectedCategory || selectedCity) && (
            <a 
              href="/educacao/blog" 
              style={{
                background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '12px', padding: '12px 18px', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              Limpar
            </a>
          )}
        </div>
      </form>

      {/* Community / Main Articles */}
      <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '24px', textAlign: 'left' }}>
        {q || selectedCategory || selectedCity ? 'Artigos Encontrados' : 'Artigos e Dicas em Destaque'}
      </h3>
      {dbPosts.length === 0 ? (
        <p style={{ fontSize: 13.5, color: '#64748b', fontStyle: 'italic', marginBottom: '40px', textAlign: 'left' }}>
          Nenhum artigo editorial encontrado para os filtros selecionados.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '56px', textAlign: 'left' }}>
          {dbPosts.map(post => (
            <div key={post.id} style={{
              background: '#1e293b', border: '1px solid #334155', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s'
            }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.18)' }}>
                  {post.category}
                </span>
                <h4 style={{ fontSize: '17px', color: '#fff', fontWeight: 'bold', marginTop: '12px', marginBottom: '8px', lineHeight: 1.3 }}>
                  {post.title}
                </h4>
                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '20px' }}>
                  {post.excerpt}
                </p>
              </div>
              <a href={`/educacao/blog/${post.slug}`} style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Ler artigo completo ➜
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Programmatic SEO Regional Guides Section */}
      <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '8px', textAlign: 'left' }}>
        {showAllRegional ? `Guias Locais e Notícias Regionais (${regionalNews.length})` : "Guias Locais em Destaque"}
      </h3>
      <p style={{ fontSize: '13.5px', color: '#94a3b8', marginBottom: '24px', textAlign: 'left' }}>
        Análises e fluxos de faturamento especializados de acordo com as leis e exigências de cada cidade.
      </p>
      
      {displayedRegional.length === 0 ? (
        <p style={{ fontSize: 13.5, color: '#64748b', fontStyle: 'italic', marginBottom: '40px', textAlign: 'left' }}>
          Nenhum guia local de SEO encontrado para os filtros selecionados.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '56px', textAlign: 'left' }}>
          {displayedRegional.map((news, idx) => (
            <div key={idx} style={{
              background: 'rgba(15, 23, 42, 0.4)', border: '1px solid #1e293b', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s'
            }}>
              <div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#60a5fa', background: 'rgba(96,165,250,0.08)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(96,165,250,0.18)' }}>
                    {news.category}
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#34d399', background: 'rgba(52,211,153,0.08)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(52,211,153,0.18)' }}>
                    📍 {news.city} - {news.state}
                  </span>
                </div>
                <h4 style={{ fontSize: '15px', color: '#fff', fontWeight: 'bold', marginTop: '12px', marginBottom: '8px', lineHeight: 1.3 }}>
                  {news.title}
                </h4>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '20px' }}>
                  {news.description}
                </p>
              </div>
              <a href={news.link} style={{ fontSize: '13px', color: '#34d399', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Ver guia completo ➜
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Crawlable Regional Directory (Very important for SEO indexing!) */}
      {!showAllRegional && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '40px', marginTop: '40px', textAlign: 'left' }}>
          <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', marginBottom: '16px' }}>
            Diretório de Notícias e Guias Regionais (168 Cidades e Segmentos Mapeados)
          </h4>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px', 
            maxHeight: '250px', 
            overflowY: 'auto', 
            padding: '16px', 
            background: 'rgba(30, 41, 59, 0.2)', 
            borderRadius: '16px', 
            border: '1px solid rgba(255,255,255,0.04)' 
          }}>
            {regionalNews.map((news, idx) => (
              <a 
                key={idx} 
                href={news.link} 
                style={{
                  fontSize: '11px', color: '#94a3b8', background: '#070913', border: '1px solid #1e293b', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', transition: 'all 0.2s'
                }}
              >
                {news.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </InfoPageWrapper>
  );
}
