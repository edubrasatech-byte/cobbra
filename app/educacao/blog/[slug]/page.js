import Link from 'next/link';
import { queryOne } from '@/lib/db';
import InfoPageWrapper from '@/app/components/InfoPageWrapper';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  try {
    const post = queryOne("SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'", [slug]);
    if (!post) {
      return {
        title: 'Artigo Não Encontrado | Blog do Cobbra',
        description: 'O artigo solicitado não pôde ser encontrado.'
      };
    }
    return {
      title: `${post.title} | Blog do Cobbra`,
      description: post.excerpt || 'Artigos e notícias sobre finanças e cobranças automáticas.',
      keywords: post.keywords || ''
    };
  } catch (e) {
    return {
      title: 'Artigo | Blog do Cobbra'
    };
  }
}

export default async function BlogPostPage({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  let post = null;
  try {
    post = queryOne("SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'", [slug]);
  } catch (err) {
    console.error("Error reading blog post:", err);
  }

  // Not Found State
  if (!post) {
    return (
      <InfoPageWrapper title="Artigo Não Encontrado" category="Erro">
        <div style={{ textAlign: 'center', py: '60px' }}>
          <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '32px' }}>
            Desculpe, o artigo que você está procurando não existe ou foi removido.
          </p>
          <Link 
            href="/educacao/blog" 
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#070913',
              padding: '12px 28px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '14px'
            }}
          >
            Voltar para o Blog
          </Link>
        </div>
      </InfoPageWrapper>
    );
  }

  return (
    <InfoPageWrapper title={post.title} category={post.category || 'Educação'}>
      {/* Article Metadata Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '12px',
        color: '#64748b',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: '20px',
        marginBottom: '32px',
        flexWrap: 'wrap'
      }}>
        <span>🕒 Publicado em: {new Date(post.created_at || Date.now()).toLocaleDateString('pt-BR')}</span>
        <span>•</span>
        <span>🏷️ Categoria: <strong>{post.category}</strong></span>
        {post.keywords && (
          <>
            <span>•</span>
            <span style={{ color: '#10b981' }}>🔑 Palavras-chave: {post.keywords}</span>
          </>
        )}
      </div>

      {/* Styled Rich HTML Article Body */}
      <article 
        className="prose prose-invert"
        style={{
          fontSize: '15.5px',
          lineHeight: '1.8',
          color: '#cbd5e1',
          textAlign: 'left'
        }}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Footer Back Button */}
      <div style={{ 
        marginTop: '60px', 
        paddingTop: '30px', 
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link 
          href="/educacao/blog" 
          style={{
            color: '#10b981',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ← Voltar para todos os artigos
        </Link>

        <a
          href="/cadastro"
          style={{
            background: 'rgba(16,185,129,0.08)',
            color: '#10b981',
            border: '1px solid rgba(16,185,129,0.2)',
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '12.5px',
            fontWeight: 'bold'
          }}
        >
          Criar minha conta Cobbra grátis
        </a>
      </div>
    </InfoPageWrapper>
  );
}
