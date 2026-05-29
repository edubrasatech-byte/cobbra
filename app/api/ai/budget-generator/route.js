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

    const dbUser = queryOne("SELECT * FROM users WHERE id = ?", [user.id]) || user;

    const body = await request.json();
    const { action, project_id, client_id, project_type, services, notes, prompt, images, client_name, client_doc, client_address } = body;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return Response.json({ error: 'API Key da Groq não configurada' }, { status: 500 });

    const url = 'https://api.groq.com/openai/v1/chat/completions';

    let aiContent = '';

    if (action === 'generate_initial') {
      const contractorNameVal = dbUser.business_name || dbUser.name || 'Sua Empresa';
      const contractorCnpjVal = dbUser.pix_key || '';
      const contractorPhoneVal = dbUser.phone || '';
      const contractorEmailVal = dbUser.email || '';

      const systemPrompt = `Você é um Engenheiro Civil e Advogado Especialista em Direito Imobiliário e Contratos de Empreitada da Construção Civil no Brasil.
Crie uma proposta técnica, comercial e orçamento técnico de alto padrão, robusto, extenso, formal e detalhado em formato HTML completo e limpo (pronto para impressão em PDF).
Use como inspiração de tom, estrutura e rigor técnico o renomado modelo de orçamento da "JS Pintura & Engenharia" para o "Residencial Jardim de Sintra".
O contrato deve ser formal, sério, sem resumos e escrito em linguagem técnica e jurídica impecável (tom corporativo).
ATENÇÃO ABSOLUTA: Não mencione inteligência artificial, "Catarina" ou notas de geração automática no texto do contrato. O emissor é a empresa Contratada.

DADOS DE ONBOARDING DA CONTRATADA (UTILIZAR OBRIGATORIAMENTE PARA A QUALIFICAÇÃO DA PARTE):
- Razão Social / Nome da Empresa: ${contractorNameVal}
- CNPJ / CPF / Chave Pix de Recebimento: ${contractorCnpjVal}
- Telefone de Contato: ${contractorPhoneVal}
- E-mail de Contato: ${contractorEmailVal}
- Setor de Atuação: ${dbUser.business_niche || 'Construção Civil'}

INFORMAÇÕES DA LOCAÇÃO/OBRA:
- Tipo de Obra: ${project_type}
- Serviços a serem executados: ${services.join(', ')}
- Condições Comerciais, Valores e Formas de Pagamento: ${notes}

REGRAS RÍGIDAS DE ESTRUTURA INSPIRADAS NO MODELO JARDIM DE SINTRA (REDIGIR NA ÍNTEGRA):
O documento deve conter as seguintes seções estruturadas com classes HTML semânticas elegantes (tabelas para valores, listas ordenadas para obrigações, títulos fortes em h1/h2):

1. CABEÇALHO DA PROPOSTA: Nome do documento "INSTRUMENTO PARTICULAR DE PROPOSTA TÉCNICA, COMERCIAL E CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ENGENHARIA E PINTURA EM GERAL". Qualificação das partes (CONTRATANTE e CONTRATADA).

--- I. PROPOSTA TÉCNICA ---
2. INTRODUÇÃO: Texto formal de abertura descrevendo o fornecimento de serviços de pintura, lavação e reforma em geral para o cliente, citando vistoria técnica prévia.
3. ESCOPO DO ORÇAMENTO: Uma tabela HTML moderna e limpa contendo as colunas [ITEM, QTDE, UNID, DESCRIÇÃO] detalhando cada serviço selecionado (${services.join(', ')}). Use quantidades e unidades técnicas realistas (ex: m² para pintura, ml para junta de dilatação/pingadeiras, Vb para implantação).
4. DETALHAMENTO DO FORNECIMENTO:
   - 4.1. Implantação da Obra e Documentação Técnica: Exigência de Anotação de Responsabilidade Técnica (ART) junto ao CREA paga pela Contratada transferindo responsabilidade civil/técnica e eximindo o síndico/condomínio; fixação de placa de obra conforme Lei Federal 5.194/66 art.16; cópias de seguro de vida dos funcionários, seguro de responsabilidade civil, PPRA/PCMSO, exames médicos ASO de aptidão para trabalho em altura e certificado de treinamento em NR35.
   - 4.2. Equipamento de Proteção Coletiva e Individual: Isolamento de perímetro com fitas zebradas, telas fachadeiras para proteção contra quedas e poeira, e uso obrigatório de EPIs completos conforme a NR18.
   - 4.3. Mobilização e Proteção: Fixação de avisos de início de obras para moradores, Diário de Obra disponível na portaria, lonas plásticas densas para proteção de jardins e pisos ajardinados, e madeiramento para proteção física de telhados.
5. MÉTODO EXECUTIVO DE CADA SERVIÇO: Descrever minuciosamente a execução técnica na íntegra de cada serviço contratado:
   - Preparação de superfícies: lavação com hidrojateamento a pressão de 10Mpa (100bar/1450 lbs) removendo sujeira e mofo, aplicação prévia de solução especial antibactericida 100% biodegradável.
   - Tratamento de trincas/fissuras: abertura em forma de "V", preenchimento com selante elástico sela-trinca, aplicação de fundo preparador e 3 demãos de tinta acrílica Suvinil Proteção Total ou Coral de catálogo escolhido em conjunto.
   - Vedação: calafetação e vedação de janelas e pingadeiras de granito com selante elástico poliuretano (PU Souldaflex 40FC ou similar), e restauração de junta de dilatação com tarucel e mastique.

--- II. PROPOSTA COMERCIAL ---
6. PREÇOS DE MÃO DE OBRA: Tabela HTML elegante com os valores de mão de obra para cada item e a soma do TOTAL GERAL da proposta.
7. CONDIÇÕES DE PAGAMENTO: Descrição exata dos pagamentos acordados em "${notes}". Multa de 10% em caso de atraso nas parcelas e juros moratórios.
8. PRAZO DE ENTREGA: Prazo de início em até 10 dias após assinatura. Prazo de execução (ex: 180 dias úteis) dependendo das condições climáticas, computando dias de chuva mediante relatórios de meteorologia.
9. HORÁRIO DE TRABALHO: Segunda a Quinta das 8:00h às 18:00h e Sexta das 8:00h às 17:00h.
10. OBRIGAÇÕES DO CLIENTE: Fornecer acesso livre ao imóvel, ponto de energia, água e sanitários, e local seguro para guarda de materiais da Contratada.
11. GARANTIA TÉCNICA: Garantia mínima de 5 (cinco) anos para estabilidade e solidez estrutural e infiltrações graves nos termos da norma ABNT NBR 15.575 e do Art. 618 do Código Civil Brasileiro.
12. FORO: Eleição de Foro de comarca de Florianópolis - SC.
13. ASSINATURAS: Blocos para Contratante, Contratada, Testemunhas e data.

REGRAS DE ESTILIZAÇÃO E DESIGN SYSTEM HTML (O DOCUMENTO DEVE SER DESLUMBRANTE, EXECUTIVO E PREMIUM):
- O código retornado deve ser envolvido em uma tag <div> contendo um bloco <style> completo e extremamente profissional no início para dar o visual de um documento corporativo de altíssimo padrão.
- Tipografia: Use fontes modernas e legíveis (ex: font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif para títulos e textos técnicos).
- Cores: Use tons de alto requinte comercial. Detalhes, bordas-chave e botões no Verde Esmeralda oficial do Cobbra (#059669). Títulos em Slate Escuro (#1e293b). Fundos neutros em cinza claríssimo (#f8fafc).
- Cabeçalho Premium: Crie uma seção inicial marcante em duas colunas. À esquerda, um badge verde de "PROPOSTA TÉCNICA E COMERCIAL" e o título do projeto em h1 grande e elegante. À direita, data e identificação. Abaixo, a "Qualificação das Partes" deve ser renderizada em dois cards com bordas arredondadas (border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; padding: 16px; margin-bottom: 20px) posicionados lado a lado (dois blocos inline-block ou flexbox de 48% de largura) detalhando a CONTRATADA (sua empresa) e o CONTRATANTE (cliente).
- Tabelas de Escopo e Preços: Modernas e limpas. Use headers (th) com background #1e293b, cor #ffffff e padding de 12px. As células (td) devem ter padding de 12px e borda inferior fina (#e2e8f0). Use linhas zebradas (#f8fafc). Alinhe valores/quantidades à direita. Destaque o Total Geral com fundo verde clarinho (#ecfdf5), texto em negrito e borda dupla em cima e embaixo.
- Cards de Destaque (Callouts): Use caixas elegantes (ex: background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; border-radius: 4px 8px 8px 4px; margin: 20px 0) para ressaltar a Garantia Técnica de 5 Anos, as condições críticas de segurança/CREA e os marcos de pagamento.
- Seção de Assinaturas: Perfeitamente alinhada em duas colunas paralelas (inline-block ou flexbox de 48% de largura) com linhas tracejadas finas, o nome de cada signatário por extenso, documento (CPF/CNPJ) e um campo para a data.
- Retorne EXCLUSIVAMENTE o código HTML sem blocos de código markdown (\`\`\`html ... \`\`\`). As cláusulas devem ser completas, robustas, sérias e formais (sem placeholders ou abreviações).`;

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
       const systemPrompt = `Você é a Catarina, a IA Copilot sênior de orçamentos e contratos do Cobbra.
Você é 100% flexível, prestativa e extremamente colaborativa.
FUNÇÕES PRINCIPAIS:
1. ALTERAR, ADICIONAR ou REMOVER absolutamente qualquer item, valor, cláusula, marca de material, prazos ou termos comerciais no contrato HTML atual, agindo estritamente de acordo com o que o usuário solicitou.
2. Manter a estrutura geral de tom, o rigor técnico do modelo "Jardim de Sintra" e o design premium impecável (com bloco <style> no topo, cabeçalhos qualificados em duas colunas, tabelas modernas zebradas, cards de destaque callout verdes/slate e assinaturas elegantes).
3. Se o usuário anexou imagens, incorpore-as no HTML usando tags <img src="..." style="max-width:100%; border-radius:8px; margin-bottom:8px;" /> com o data-uri correspondente.

Instrução do Usuário para alteração no documento: "${prompt}".

PERSONALIDADE DE CATARINA (PARA O CHAT DE RESPOSTA):
- O tom de Catarina no chat deve ser super caloroso, empático, natural, dinâmico e amigável, como uma parceira de trabalho inteligente e prestativa, e NUNCA como uma funcionária fria, mecânica ou seca.
- Use emojis simpáticos (como 🐍, ✨, 🚀, 💡, 🛠️) de forma natural.
- Trate o usuário de forma calorosa (ex: "Claro! Já fiz isso para você...", "Feito! Mudei o título para...", "Tudo pronto! Ajustei...").
- Escreva respostas curtas, ágeis e cheias de energia positiva, evitando saudações robotizadas e apresentações corporativas longas. Vá direto ao ponto de forma humana e leve.

COMO ESTRUTURAR SUA RESPOSTA (ATENÇÃO RIGOROSA):
Você deve estruturar sua resposta exatamente em duas partes consecutivas:
1. Sua mensagem curta de chat (como Catarina, simpática e explicativa, fora de qualquer bloco de código).
2. O código HTML atualizado na íntegra, envolvido estritamente em um bloco de código markdown HTML:
\`\`\`html
[CÓDIGO HTML COMPLETO E ATUALIZADO AQUI]
\`\`\`
Não use o formato JSON. Escreva a mensagem de chat no início e depois o bloco de código HTML com as alterações feitas.`;

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

      let html = '';
      let aiResponse = '✅ Documento atualizado! Revise a prévia ao lado.';

      // Extract the HTML code block
      const htmlBlockMatch = aiText.match(/```html\s*([\s\S]*?)\s*```/i);
      if (htmlBlockMatch) {
        html = htmlBlockMatch[1].trim();
        // Remove the html block to get the conversational response
        aiResponse = aiText.replace(/```html\s*([\s\S]*?)\s*```/i, '').trim();
      } else {
        // Fallback: search for any generic markdown block
        const genericBlockMatch = aiText.match(/```(?:xml|xhtml)?\s*([\s\S]*?)\s*```/i);
        if (genericBlockMatch) {
          html = genericBlockMatch[1].trim();
          aiResponse = aiText.replace(/```(?:xml|xhtml)?\s*([\s\S]*?)\s*```/i, '').trim();
        } else {
          // Fallback if no block is returned: assume the entire text might be HTML if it starts with <
          if (aiText.trim().startsWith('<') || aiText.includes('<div') || aiText.includes('<table')) {
            html = aiText.trim();
            aiResponse = '✅ Documento atualizado com sucesso!';
          } else {
            // Keep the previous version if we couldn't find any HTML
            const prevDoc = queryOne("SELECT content_html FROM documents WHERE project_id = ? AND type = 'budget' ORDER BY version DESC LIMIT 1", [project_id]);
            html = prevDoc?.content_html || notes;
            aiResponse = aiText.trim();
          }
        }
      }

      // Clean up the chat response (remove any residual backticks or markdown JSON markers)
      aiResponse = aiResponse.replace(/```json\s*([\s\S]*?)\s*```/i, '')
                             .replace(/```[\s\S]*?```/g, '')
                             .replace(/[\{\}\[\]\n]+/g, ' ') // remove stray braces from failed JSON attempts
                             .trim();

      if (!aiResponse) {
        aiResponse = '✅ Ajustei o documento de acordo com a sua solicitação! Dê uma olhadinha ao lado. 🐍✨';
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
