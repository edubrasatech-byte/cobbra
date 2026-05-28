# Plano de Expansão: Módulo Construção Civil Inteligente (Cobbra.ai)

## 1. Visão Geral do Produto
O objetivo deste módulo é transformar a plataforma Cobbra em uma ferramenta essencial também para **Engenheiros, Empreiteiros e Empresas de Reformas**. 
Ao invés de apenas cobrar, o usuário terá um **Painel Especializado** para gerar orçamentos detalhados (semelhantes ao modelo "Residencial Jardins de Sintra"), propostas comerciais, laudos fotográficos, diários de obra e contratos, tudo automatizado pela Catarina IA (Gemini).

## 2. Arquitetura de Banco de Dados (Novas Tabelas)
Para suportar o novo fluxo, adicionaremos as seguintes tabelas ao esquema atual:

1. **`projects` (Obras/Projetos):**
   - Vincula-se a um `client_id` e a um `user_id`.
   - Campos: `name`, `address`, `status` (budgeting, in_progress, completed), `start_date`, `end_date`, `total_value`.
2. **`documents` (Orçamentos, Contratos e Laudos):**
   - Vincula-se a um `project_id`.
   - Campos: `type` (budget, contract, daily_report, photo_report), `content_html` (ou JSON), `version`, `ai_generated` (boolean), `created_at`.
3. **`services_catalog` (Catálogo Base de Serviços):**
   - Para armazenar os preços base do empreiteiro. Ex: "Lavação de Fachada com antifungos", "Preço por m²: R$ 7,00".
4. **`project_photos` (Registro Fotográfico):**
   - Imagens vinculadas a um projeto ou orçamento para composição do PDF.

## 3. UX / UI: O Novo Painel Pós-Cadastro
Quando um usuário com o `business_niche = 'construcao_civil'` fizer login, o Dashboard terá um layout diferenciado:

- **Menu Principal:**
  - 🏠 Visão Geral da Obra
  - 📝 Gerador de Orçamentos (IA)
  - 📸 Laudos e Diários de Obra
  - 🤝 Contratos Automáticos
  - 💰 Gestão Financeira e Cobranças (Herdado do Cobbra atual)

## 4. O Coração do Sistema: Editor IA Mutável (Catarina IA Copilot Avançado)
A magia acontecerá na integração conversacional com a IA:
- **Geração Inicial (Wizard):** O usuário preenche um formulário básico (tipo de obra, serviços desejados, prazo) e envia fotos. A IA gera um "Rascunho V1" ultra-detalhado (no padrão "Jardins de Sintra").
- **Editor Copilot Live (100% Mutável):** 
  O documento não é engessado. Na mesma tela de visualização do documento gerado, haverá um chat lateral com a Catarina.
  - **Exemplos de Comandos no Chat:** 
    - *"Catarina, remova o item de pintura interna."* -> O documento atualiza ao vivo, recalculando totais.
    - *"Catarina, adicione estas 3 novas fotos e coloque como 'Anomalias na fachada sul'."* -> O usuário faz o upload no chat, e a IA diagrama as imagens no PDF em tempo real.
    - *"Aumente o preço do metro quadrado da lavação em 15%."* -> Atualização matemática instantânea no corpo da proposta e na tabela comercial.
- A IA sempre manterá a estrutura técnica impecável (Normas NBR, cláusulas de garantia), apenas alterando o escopo solicitado.

## 5. Documentos Pertinentes Suportados
- **Proposta Técnica e Comercial:** Baseada na referência.
- **Contrato de Prestação de Serviços Empreitada:** A IA cruza o orçamento aprovado e gera o contrato jurídico (com multas, foro e obrigações).
- **Diário de Obra (RDO):** O usuário abre o celular no fim do dia, tira 2 fotos, dita um áudio: *"Hoje lavamos a fachada sul, choveu a tarde."* -> A IA transcreve, formata no padrão técnico e gera o PDF do Diário.

## 6. Sincronização Perfeita com o Financeiro Cobbra
- Assim que o cliente do empreiteiro aceitar o orçamento final (que foi lapidado junto com a Catarina IA), o sistema extrai as condições comerciais aprovadas.
- Se ficou acordado "Entrada de 30% + 4 parcelas mensais de R$ 10.000", o sistema já gera as "Cobranças" automaticamente no módulo financeiro da Cobbra.
- A partir daí, a régua de cobrança automática da Cobbra (WhatsApp/Email) entra em ação para garantir que o empreiteiro receba no Pix todo mês, erradicando a inadimplência na construção civil.
