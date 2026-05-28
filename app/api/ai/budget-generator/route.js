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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: 'API Key não configurada' }, { status: 500 });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    let aiContent = '';

    if (action === 'generate_initial') {
      const systemPrompt = `Crie um orçamento técnico estruturado em HTML limpo e profissional baseado nas informações abaixo.
Use tom corporativo, adicione cláusulas de garantia adequadas (caso o serviço 'Outros' esteja selecionado, elabore um contrato de prestação de serviços genérico altamente profissional, caso contrário use NBR 15.575), prazos e obrigações, e formate de forma que possa ser impresso e entregue ao cliente.
ATENÇÃO: Não mencione que você é uma IA ou "Catarina" no texto do contrato. O emitente é a empresa de Construção Civil. O contrato deve ser extremamente detalhado e extenso.

Tipo de Obra: ${project_type}
Serviços: ${services.join(', ')}
Observações Comerciais (Pagamento): ${notes}

A saída deve ser EXCLUSIVAMENTE código HTML (sem blocos markdown). O HTML deve conter cabeçalho, escopo, proposta técnica e comercial, e considerações finais. Não use larguras fixas (ex: width: 800px), use porcentagens (ex: width: 100%) para ser responsivo.`;

      let parts = [{ text: systemPrompt }];
      
      if (images && images.length > 0) {
        images.forEach(img => {
           parts.push({
             inlineData: {
               mimeType: img.mime,
               data: img.base64
             }
           });
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: parts }],
          generationConfig: { temperature: 0.3 }
        })
      });

      if (!response.ok) throw new Error('Erro na API Gemini');
      const data = await response.json();
      aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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

      let parts = [{ text: systemPrompt + '\n\nHTML Atual:\n' + notes }];

      if (images && images.length > 0) {
        images.forEach(img => {
           parts.push({
             inlineData: {
               mimeType: img.mime,
               data: img.base64
             }
           });
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: parts }],
          generationConfig: { temperature: 0.3 }
        })
      });

      if (!response.ok) throw new Error('Erro na API Gemini');
      const data = await response.json();
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
        // Fallback se o parse falhar
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
          generationConfig: { temperature: 0.1 }
        })
      });

      const data = await response.json();
      let jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
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
