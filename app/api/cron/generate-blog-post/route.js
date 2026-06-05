import { run, generateId, queryOne } from '@/lib/db';
import { SEGMENTS, CITIES } from '@/app/modelo/[segmento]/[cidade]/page';

// POST /api/cron/generate-blog-post?secret=SEU_SECRET
// GET /api/cron/generate-blog-post?secret=SEU_SECRET (for easy testing/webhook calls)
export async function POST(request) {
  return handleBlogPostGeneration(request);
}

export async function GET(request) {
  return handleBlogPostGeneration(request);
}

async function handleBlogPostGeneration(request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret') || searchParams.get('token');
    const authHeader = request.headers.get('authorization');

    // Security check
    const cronSecret = process.env.CRON_SECRET || 'cobbra-cron-secret-key-2026';
    const isAuthorized = (secret === cronSecret) || (authHeader === `Bearer ${cronSecret}`);
    if (!isAuthorized) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 1. Select random Segment and City combination for Local SEO
    const segmentKeys = Object.keys(SEGMENTS);
    const cityKeys = Object.keys(CITIES);

    const segmentKey = segmentKeys[Math.floor(Math.random() * segmentKeys.length)];
    const cityKey = cityKeys[Math.floor(Math.random() * cityKeys.length)];

    const segment = SEGMENTS[segmentKey];
    const city = CITIES[cityKey];

    // 2. Prepare content parameters
    const id = generateId();
    const todayStr = new Date().toISOString();

    const apiKey = process.env.GEMINI_API_KEY;
    let generatedPost = null;

    // 3. Try Gemini content generation
    if (apiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const systemPrompt = `Você é a Catarina, redatora-chefe de IA da plataforma Cobbra.ai.
Sua especialidade é produzir artigos de blog focados em SEO de nicho local para o Brasil, explicando a autônomos, MEIs e frotistas como gerenciar cobranças e reduzir a inadimplência.
Você deve retornar estritamente um objeto JSON com os seguintes campos (sem blocos de código markdown ou formatações extras, apenas o JSON bruto):
{
  "title": "Um título chamativo de até 10 palavras voltado para o nicho (ex: Como gerenciar diárias de aluguel de carros para Uber em Belo Horizonte)",
  "excerpt": "Um resumo amigável de 1 a 2 sentenças para servir de meta-description.",
  "keywords": "Palavras-chave separadas por vírgula",
  "category": "Uma das categorias: Educação, Finanças, Administração, Mercado",
  "content": "O texto completo do artigo (400 a 600 palavras) estruturado em parágrafos com tags HTML básicas (<p>, <h4>, <ul>, <li>, <strong>, <i>). Não use markdown (# ou *) de forma alguma dentro do HTML."
}`;

        const userPrompt = `Gere um artigo otimizado para o segmento de ${segment.niche} na cidade de ${city.name} - ${city.state}. 
Discorra sobre como a automação de cobranças no Pix enviadas por WhatsApp diminui a taxa de inadimplência de quem atua com ${segment.niche.toLowerCase()} em ${city.name}. 
Conclua mencionando como a plataforma Cobbra.ai resolve essa dor com taxa zero no Pix.`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: userPrompt }]
              }
            ],
            generationConfig: {
              maxOutputTokens: 1000,
              temperature: 0.7,
              responseMimeType: 'application/json'
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          generatedPost = JSON.parse(jsonText.trim());
        } else {
          console.error('[CRON BLOG GEMINI ERROR]', await response.text());
        }
      } catch (err) {
        console.error('[CRON BLOG API CALL ERROR]', err);
      }
    }

    // 4. Fallback Programmatic Template Generator (in case Gemini is disabled or fails)
    if (!generatedPost || !generatedPost.title || !generatedPost.content) {
      console.log('🤖 Gemini API failed or unavailable. Generating fallback article template...');
      const fallbackTitle = `Como Otimizar as Cobranças de ${segment.niche} em ${city.name} - ${city.state}`;
      const fallbackExcerpt = `Descubra dicas de gestão e automação para melhorar o fluxo de caixa de ${segment.niche.toLowerCase()} em ${city.name}, zerando a inadimplência com lembretes Pix no WhatsApp.`;
      const fallbackContent = `<h4>Desafios Administrativos em ${city.name}</h4>
<p>Atuar no ramo de ${segment.niche.toLowerCase()} na região metropolitana de ${city.name} (${city.state}) exige dos profissionais e frotistas organização financeira rigorosa. O esquecimento e atraso de diárias, mensalidades ou mensalidades contratuais são os principais fatores que impedem o crescimento saudável do caixa empresarial.</p>
<h4>A Vantagem dos Lembretes Automatizados via WhatsApp</h4>
<p>Cobrar clientes manualmente no WhatsApp consome tempo valioso e causa desgaste nos relacionamentos comerciais. Ao estruturar réguas de lembretes que notificam o cliente de forma automática antes e depois do vencimento com o código Pix "Copia e Cola" pronto para colar, a taxa de pagamento em dia aumenta em mais de 45% logo no primeiro mês.</p>
<h4>Taxa Zero no Pix com o Cobbra Pay</h4>
<p>Ao contrário de contas bancárias tradicionais que mordem comissões sobre cada transação Pix, o Cobbra assegura que 100% dos seus faturamentos caiam diretamente no seu saldo sem intermediários ou deduções. Comece a automatizar suas cobranças hoje mesmo.</p>`;
      
      generatedPost = {
        title: fallbackTitle,
        excerpt: fallbackExcerpt,
        keywords: `${segment.niche.toLowerCase()}, cobrança ${city.name.toLowerCase()}, pix ${city.name.toLowerCase()}, software gestão`,
        category: 'Finanças',
        content: fallbackContent
      };
    }

    // 5. Generate unique slug based on title
    let baseSlug = generatedPost.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with dashes
      .replace(/-+/g, "-"); // Collapse consecutive dashes

    // Prevent duplicate slug collision by checking DB
    let finalSlug = baseSlug;
    let collisionCheck = queryOne('SELECT id FROM blog_posts WHERE slug = ?', [finalSlug]);
    let suffix = 1;
    while (collisionCheck) {
      finalSlug = `${baseSlug}-${suffix}`;
      collisionCheck = queryOne('SELECT id FROM blog_posts WHERE slug = ?', [finalSlug]);
      suffix++;
    }

    // 6. Save new post to local database
    run(
      `INSERT INTO blog_posts (id, title, slug, excerpt, content, category, keywords, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published', datetime('now'), datetime('now'))`,
      [
        id,
        generatedPost.title,
        finalSlug,
        generatedPost.excerpt,
        generatedPost.content,
        generatedPost.category || 'Educação',
        generatedPost.keywords
      ]
    );

    console.log(`✅ Novo artigo de blog publicado via Bot! Slug: ${finalSlug}`);

    return Response.json({
      success: true,
      id,
      title: generatedPost.title,
      slug: finalSlug,
      category: generatedPost.category,
      mode: apiKey ? 'AI (Gemini)' : 'Template Fallback'
    });

  } catch (error) {
    console.error('❌ Erro geral ao gerar post de blog:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
