import { getUserFromRequest } from '@/lib/auth';
import { run, queryOne, generateId } from '@/lib/db';

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { action, project_id, client_id, project_type, services, notes, prompt } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Response.json({ error: 'API Key não configurada' }, { status: 500 });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    let aiContent = '';

    if (action === 'generate_initial') {
      const systemPrompt = `Você é a Catarina, uma IA Orçamentista Sênior em Construção Civil.
Crie um orçamento técnico estruturado em HTML limpo e profissional baseado nas informações abaixo.
Use tom profissional, adicione cláusulas de garantia (NBR 15.575) e formatado de forma que possa ser impresso e enviado ao cliente.

Tipo de Obra: ${project_type}
Serviços: ${services.join(', ')}
Observações Comerciais (Pagamento): ${notes}

A saída deve ser EXCLUSIVAMENTE código HTML (sem blocos markdown). O HTML deve conter cabeçalho, escopo, proposta técnica e comercial, e considerações finais.`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
          generationConfig: { temperature: 0.2 }
        })
      });

      if (!response.ok) throw new Error('Erro na API Gemini');
      const data = await response.json();
      aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      aiContent = aiContent.replace(/^```html\n?/, '').replace(/```$/, '').trim();

      const newProjectId = project_id || generateId();
      if (!project_id) {
        run("INSERT INTO projects (id, user_id, client_id, name) VALUES (?, ?, ?, ?)", [newProjectId, user.id, client_id || 'avulso', `Obra - ${project_type}`]);
      }
      const docId = generateId();
      run("INSERT INTO documents (id, project_id, type, content_html) VALUES (?, ?, ?, ?)", [docId, newProjectId, 'budget', aiContent]);

      return Response.json({ project_id: newProjectId, document_id: docId, html: aiContent });
    }

    if (action === 'edit_document') {
       const systemPrompt = `Você é a Catarina, uma IA Orçamentista Sênior. 
Abaixo está o conteúdo HTML atual de um orçamento. O usuário solicitou a seguinte alteração: "${prompt}".
Retorne APENAS o novo código HTML atualizado. Não use blocos de marcação.`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + '\n\nHTML Atual:\n' + notes }] }
          ],
          generationConfig: { temperature: 0.2 }
        })
      });

      if (!response.ok) throw new Error('Erro na API Gemini');
      const data = await response.json();
      aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      aiContent = aiContent.replace(/^```html\n?/, '').replace(/```$/, '').trim();

      run("UPDATE documents SET content_html = ?, version = version + 1 WHERE project_id = ? AND type = ?", [aiContent, project_id, 'budget']);

      return Response.json({ html: aiContent });
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

      // Insert charges
      let created = 0;
      for (const inst of installments) {
        const due = new Date();
        due.setDate(due.getDate() + (inst.days_from_now || 0));
        const dueStr = due.toISOString().split('T')[0];

        run(
          "INSERT INTO charges (id, user_id, client_id, amount, description, due_date, status, recurrence, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [generateId(), user.id, actualClientId, inst.amount, inst.description, dueStr, 'pending', 'once', 'pix']
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
