import { getUserFromRequest } from '@/lib/auth';
import { run, query, queryOne, generateId } from '@/lib/db';

// Garante que as tabelas existem em produção
try {
  run(`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'budgeting',
    total_value REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  run(`CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    type TEXT DEFAULT 'budget',
    content_html TEXT,
    version INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
} catch (e) {
  console.error("Erro ao criar tabelas na rota:", e);
}

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (projectId) {
      // Load specific project
      const project = queryOne(`
        SELECT p.*, c.name as client_name, c.document as client_doc, c.address as client_address, d.content_html, d.version
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        LEFT JOIN documents d ON d.project_id = p.id
        WHERE p.user_id = ? AND p.id = ?
        LIMIT 1
      `, [user.id, projectId]);

      if (!project) return Response.json({ error: 'Projeto não encontrado' }, { status: 404 });
      return Response.json({ project });
    }

    // List all projects
    const projects = query(`
      SELECT p.*, c.name as client_name, d.content_html, d.version
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN documents d ON d.project_id = p.id AND d.type = 'budget'
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [user.id]);

    return Response.json({ projects });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) return Response.json({ error: 'Falta o ID do projeto' }, { status: 400 });

    run("DELETE FROM projects WHERE user_id = ? AND id = ?", [user.id, projectId]);
    run("DELETE FROM documents WHERE project_id = ?", [projectId]);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { action, project_id, client_id, project_type, services, notes, prompt, images, client_name, client_doc, client_address } = body;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return Response.json({ error: 'API Key da Groq não configurada' }, { status: 500 });

    const url = 'https://api.groq.com/openai/v1/chat/completions';

    let aiContent = '';

    if (action === 'generate_initial') {
      const systemPrompt = `Você é um Engenheiro Civil e Advogado Especialista em Direito Imobiliário e Contratos de Empreitada da Construção Civil no Brasil.
Crie um instrumento contratual e orçamento técnico extremamente robusto, extenso, formal e detalhado em formato HTML completo e limpo (pronto para impressão em PDF).
O contrato deve ser formal, sério, sem resumos e escrito em linguagem técnica e jurídica impecável (tom corporativo).
ATENÇÃO ABSOLUTA: Não mencione inteligência artificial, "Catarina" ou notas de geração automática. O emissor é a empresa Contratada.

INFORMAÇÕES DA LOCAÇÃO/OBRA:
- Tipo de Obra: ${project_type}
- Serviços a serem executados: ${services.join(', ')}
- Condições Comerciais, Valores e Formas de Pagamento: ${notes}

REGRAS RÍGIDAS DE ESTRUTURA E CONTEÚDO QUE VOCÊ DEVE EXPANDIR E REDIGIR NA ÍNTEGRA:
O documento deve conter no mínimo as seguintes seções estruturadas com classes HTML semânticas elegantes (tabelas para valores, listas ordenadas para obrigações, títulos fortes em h1/h2):

1. CABEÇALHO DA PROPOSTA: Nome do documento "INSTRUMENTO PARTICULAR DE CONTRATO DE PRESTAÇÃO DE SERVIÇOS E EMPREITADA DE CONSTRUÇÃO CIVIL". Qualificação detalhada das partes (CONTRATANTE e CONTRATADA).
2. CLÁUSULA 1 - DO OBJETO E ESCOPO TÉCNICO: Descrição minuciosa de cada um dos serviços selecionados (${services.join(', ')}). Explicar detalhadamente o método executivo de cada etapa da obra com rigor técnico.
3. CLÁUSULA 2 - DA EXECUÇÃO, CRONOGRAMA E FISCALIZAÇÃO: Prazo de execução detalhado, regras para prorrogação por motivos de força maior ou intempéries climáticas, e como será feita a medição/fiscalização do andamento da obra.
4. CLÁUSULA 3 - DO VALOR, CONDIÇÕES DE PAGAMENTO E MULTAS: Exibição dos valores comerciais estruturados em uma tabela HTML moderna. Condições e prazos exatos para os pagamentos descritos em "${notes}". Multa de 10% em caso de atraso de pagamento, acrescida de juros moratórios de 1% ao mês.
5. CLÁUSULA 4 - DO FORNECIMENTO DE MATERIAIS, FERRAMENTAS E MÃO DE OBRA: Definir claramente as obrigações da CONTRATADA de fornecer mão de obra qualificada, uso obrigatório de EPIs (Equipamentos de Proteção Individual), e quem será responsável pelo fornecimento e transporte dos materiais e descarte de entulho.
6. CLÁUSULA 5 - DA GARANTIA E ASSISTÊNCIA TÉCNICA (NBR 15.575): Estabelecer prazo de garantia técnica de 5 (cinco) anos para estabilidade e solidez da estrutura nos termos do Art. 618 do Código Civil Brasileiro e da norma ABNT NBR 15.575, e prazos específicos para acabamentos, vazamentos e infiltrações.
7. CLÁUSULA 6 - DAS OBRIGAÇÕES DA CONTRATADA E DO CONTRATANTE: Listar em tópicos as obrigações da Contratada (limpeza periódica, segurança do trabalho, responsabilidade civil por danos a vizinhos ou ao imóvel) e do Contratante (liberar acesso ao imóvel, fornecer pontos de energia e água, efetuar pagamentos).
8. CLÁUSULA 7 - DA RESCISÃO E CLÁUSULA PENAL: Multa penal compensatória de 20% (vinte por cento) sobre o valor total do contrato devida pela parte que der causa à rescisão prematura do instrumento ou abandono de obra.
9. CLÁUSULA 8 - DO FORO: Eleição de foro de comarca para dirimir controvérsias.
10. ASSINATURAS: Campos formais de assinatura para Contratante, Contratada e duas Testemunhas, com data e local.

REGRAS DE ESTILIZAÇÃO HTML:
- Retorne EXCLUSIVAMENTE o código HTML sem blocos de código markdown (\`\`\`html ... \`\`\`).
- Use tags HTML semânticas: <h1>, <h2>, <p>, <ul>, <li>, <table>, <thead>, <tr>, <th>, <td>.
- Estilize o HTML com CSS inline de forma elegante, moderna e limpa: use fontes serifadas elegantes para o corpo do contrato (ex: Georgia, serif), use espaçamento de linha confortável (line-height: 1.6), tabelas com bordas sutis e cabeçalhos escuros para a proposta comercial.
- Não limite a extensão das cláusulas, redija-as de forma completa, profissional e jurídica.`;

      const contentList = [
        { type: 'text', text: systemPrompt }
      ];
      
      if (images && images.length > 0) {
        images.forEach(img => {
          contentList.push({
            type: 'image_url',
            image_url: {
              url: `data:${img.mime};base64,${img.base64}`
            }
          });
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: images && images.length > 0 ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile',
          messages: [
            { role: 'user', content: contentList }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) throw new Error('Erro na API da Groq');
      const data = await response.json();
      aiContent = data.choices?.[0]?.message?.content || '';
      aiContent = aiContent.replace(/^```html\n?/, '').replace(/```$/, '').trim();

      let actualClientId = client_id;

      if (!actualClientId && client_name) {
        // Try to find existing client by document or name
        let existingClient = null;
        if (client_doc) {
          existingClient = queryOne("SELECT id FROM clients WHERE user_id = ? AND document = ?", [user.id, client_doc]);
        }
        if (!existingClient) {
          existingClient = queryOne("SELECT id FROM clients WHERE user_id = ? AND name = ?", [user.id, client_name]);
        }

        if (existingClient) {
          actualClientId = existingClient.id;
        } else {
          // Create new client in database
          actualClientId = generateId();
          run(
            "INSERT INTO clients (id, user_id, name, document, address, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
            [actualClientId, user.id, client_name, client_doc || '', client_address || '', 'Construção Civil']
          );
        }
      }

      if (!actualClientId) {
        const fallbackClientId = 'avulso-' + user.id;
        const avulsoExists = queryOne("SELECT id FROM clients WHERE id = ?", [fallbackClientId]);
        if (!avulsoExists) {
          run(
            "INSERT INTO clients (id, user_id, name, document, category, created_at, updated_at) VALUES (?, ?, 'Cliente Avulso', '000.000.000-00', 'Geral', datetime('now'), datetime('now'))",
            [fallbackClientId, user.id]
          );
        }
        actualClientId = fallbackClientId;
      }

      const newProjectId = project_id || generateId();
      if (!project_id) {
        run("INSERT INTO projects (id, user_id, client_id, name) VALUES (?, ?, ?, ?)", [newProjectId, user.id, actualClientId, `Obra - ${project_type}`]);
      }
      const docId = generateId();
      run("INSERT INTO documents (id, project_id, type, content_html) VALUES (?, ?, ?, ?)", [docId, newProjectId, 'budget', aiContent]);

      return Response.json({ project_id: newProjectId, document_id: docId, html: aiContent });
    }

    if (action === 'edit_document') {
       const systemPrompt = `Você é a Catarina, uma IA Orçamentista Sênior. 
Abaixo está o conteúdo HTML atual de um orçamento. O usuário solicitou a seguinte alteração: "${prompt}".
Se o usuário anexou imagens, incorpore-as na seção adequada do HTML (como laudo fotográfico) usando tags <img src="..." style="max-width:100%; border-radius:8px; margin-bottom:8px;" /> com o data-uri fornecido na imagem.

Você deve responder rigorosamente com um objeto JSON puro (sem usar blocos markdown \`\`\`json ou \`\`\`), contendo exatamente dois campos:
1. "html": O código HTML completo atualizado com a alteração solicitada. Não use larguras fixas, seja 100% responsivo.
2. "ai_response": Uma resposta extremamente amigável, ágil e curta em português, personificada como Catarina, explicando brevemente o que você alterou no contrato (ex: "Removi a pintura interna conforme solicitado e recalculei as somas!").`;

      let modelToUse = 'llama-3.3-70b-versatile';
      const contentList = [];

      if (images && images.length > 0) {
        modelToUse = 'llama-3.2-11b-vision-preview';
        contentList.push({ type: 'text', text: systemPrompt + '\n\nHTML Atual:\n' + notes });
        images.forEach(img => {
          contentList.push({
            type: 'image_url',
            image_url: {
              url: `data:${img.mime};base64,${img.base64}`
            }
          });
        });
      } else {
        contentList.push({ type: 'text', text: systemPrompt + '\n\nHTML Atual:\n' + notes });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: 'user', content: contentList }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) throw new Error('Erro na API da Groq');
      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content || '';
      let jsonText = aiText;
      const firstBrace = aiText.indexOf('{');
      const lastBrace = aiText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = aiText.substring(firstBrace, lastBrace + 1);
      }

      let html = '';
      let aiResponse = '✅ Documento atualizado! Revise a prévia ao lado.';

      try {
        const parsed = JSON.parse(jsonText);
        html = parsed.html || '';
        aiResponse = parsed.ai_response || '✅ Documento atualizado!';
      } catch (e) {
        console.warn("Falha ao parsear JSON do Copilot, usando fallback de HTML bruto", e);
        html = aiText.replace(/^```html\n?/, '').replace(/```$/, '').replace(/^```json\n?/, '').trim();
      }

      run("UPDATE documents SET content_html = ?, version = version + 1 WHERE project_id = ? AND type = ?", [html, project_id, 'budget']);

      return Response.json({ html, ai_response: aiResponse });
    }

    if (action === 'export_charges') {
      const doc = queryOne("SELECT content_html FROM documents WHERE project_id = ? AND type = 'budget' ORDER BY version DESC LIMIT 1", [project_id]);
      if (!doc) return Response.json({ error: 'Orçamento não encontrado' }, { status: 404 });

      // Ask Gemini to extract installments as JSON array
      const systemPrompt = `Você é um analisador financeiro. Analise o contrato/orçamento HTML abaixo e extraia as parcelas de pagamento acordadas.
Retorne EXCLUSIVAMENTE um array JSON puro (sem blocos markdown), onde cada objeto tem os campos:
"amount" (número decimal), "description" (string, ex: "Entrada (30%) - Obra X"), "days_from_now" (inteiro, dias a partir de hoje para vencimento, 0 se imediato).
Se não houver valores, retorne [].
Contrato HTML:
${doc.content_html}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'user', content: systemPrompt }
          ],
          temperature: 0.1
        })
      });

      if (!response.ok) throw new Error('Erro ao extrair cobranças com Groq');
      const data = await response.json();
      let jsonText = data.choices?.[0]?.message?.content || '[]';
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/```$/, '').trim();

      let installments = [];
      try {
        installments = JSON.parse(jsonText);
      } catch(e) {
        console.error("Falha ao parsear parcelas JSON", e);
        return Response.json({ error: 'Falha ao extrair parcelas do orçamento.' }, { status: 500 });
      }

      const client = queryOne("SELECT client_id FROM projects WHERE id = ?", [project_id]);
      const actualClientId = client?.client_id || 'avulso';

      // Insert charges safely with parsed float values
      let created = 0;
      for (const inst of installments) {
        let amount = parseFloat(inst.amount);
        if (isNaN(amount)) {
          const cleaned = String(inst.amount).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
          amount = parseFloat(cleaned);
        }
        if (isNaN(amount) || amount <= 0) continue;

        const due = new Date();
        due.setDate(due.getDate() + (inst.days_from_now || 0));
        const dueStr = due.toISOString().split('T')[0];

        run(
          "INSERT INTO charges (id, user_id, client_id, amount, description, due_date, status, recurrence, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [generateId(), user.id, actualClientId, amount, inst.description, dueStr, 'pending', 'once', 'pix']
        );
        created++;
      }

      return Response.json({ success: true, count: created, installments });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
