# Especificação Técnica: Ativação dos Menus de Locação (Fase 2)

Este documento descreve detalhadamente o plano de implementação, endpoints de API e interfaces de usuário First-Mobile para ativar os três submenus de locação restantes: **Multas & Infrações**, **Caução & Custódias** e **Repasse de Investidores**.

---

## Módulo 1: 🧾 Multas & Infrações (Catarina Fine Finder)

Este módulo automatiza a imputação de multas, indicação de condutor e cobrança regressiva do motorista correspondente de forma inteligente.

### 1. Rotas de API (`app/api/locacoes/fines/route.js`)
* **`GET /api/locacoes/fines`**:
  - Recupera todas as multas registradas pelo locador.
  - Traz detalhes do veículo (`model`, `plate`) e o nome do motorista associado (`client_name`).
* **`POST /api/locacoes/fines`**:
  - Recebe: `vehicle_id`, `infraction_date` (ISO string ou YYYY-MM-DD HH:mm), `description`, `amount` (valor nominal), `points`.
  - **Algoritmo de Correspondência Inteligente (Catarina Match):**
    - O sistema consulta no SQLite qual contrato de locação estava ativo para aquele veículo na data e hora exatas da infração:
      `SELECT * FROM contracts_rentals WHERE vehicle_id = ? AND start_date <= ? AND (end_date IS NULL OR end_date >= ?) LIMIT 1`
    - Caso encontre, vincula o `contract_id` e o `client_id` do motorista correspondente à multa.
  - **Geração de Cobrança Automática:**
    - Se houver motorista associado, cria automaticamente uma nova cobrança Pix regressiva na tabela `charges` com vencimento para 7 dias:
      `INSERT INTO charges (id, user_id, client_id, amount, description, due_date, status) VALUES (?, ?, ?, ?, 'Reembolso Multa: [Descrição]', ?, 'pending')`
      - O valor final da cobrança será acrescido de 20% de taxa administrativa (ex: multa de R$ 130,00 -> cobrança de R$ 156,00).
  - **Retorno do Template de Mensagem Editável:**
    - A API retorna os dados criados e um **modelo de mensagem de WhatsApp pré-redigido pela Catarina** para que o usuário revise.

### 2. Interface de Usuário First-Mobile
* On mobile, a lista de multas é exibida em cartões confortáveis mostrando:
  - **Nome da Infração & Placa**
  - **Valor com taxa** (ex: R$ 156,00) e **Pontos na CNH**
  - **Motorista Responsável** (com link direto para WhatsApp)
  - **Status de Indicação:** Badge `'Pendente'` (Laranja) ou `'Indicado Detran'` (Verde).
  - **Status de Reembolso:** Badge `'Em aberto'` (Vermelho) ou `'Reembolsado'` (Verde).
* **Ações Rápidas nos Cards:**
  - `📱 Enviar Cobrança WhatsApp`: Abre um modal com a mensagem editável (com o Pix copia e cola) e botão para disparar.
  - `✅ Confirmar Indicação`: Altera o status de indicação para 1 (Sim) e muda o badge para verde.

---

## Módulo 2: 💸 Caução & Custódias (Contas de Segurança)

Este módulo controla o dinheiro retido de caução, amortização das parcelas de caução e descontos por avarias/sinistros de forma transparente.

### 1. Rotas de API (`app/api/locacoes/escrow/route.js`)
* **`GET /api/locacoes/escrow`**:
  - Retorna o saldo em custódia e parcelamentos ativos de caução para todos os contratos ativos.
* **`POST /api/locacoes/escrow/transaction`**:
  - Permite lançar transações na conta de caução:
    - **Aporte / Amortização:** Motorista pagou uma parcela da caução (R$ 100), aumentando o saldo em custódia.
    - **Abatimento / Desconto:** Lançar conserto de avaria ou multa (ex: -R$ 250 por retrovisor quebrado), reduzindo o saldo em custódia.
    - **Restituição:** Devolução do saldo restante de caução ao motorista no fim do contrato.

### 2. Interface de Usuário First-Mobile
* Lista de cauções em andamento com cards mostrando:
  - **Motorista & Carro**
  - **Barra de Progresso de Acumulação:** Ex: R$ 900 pagos de uma meta total de R$ 1.500.
  - **Saldo Disponível Líquido** em custódia.
* **Ações Rápidas nos Cards:**
  - `📋 Extrato Detalhado`: Abre uma gaveta rolável (Drawer) mostrando o histórico detalhado (Timeline) de depósitos e abatimentos daquele motorista.
  - `🛠️ Descontar Avaria / Oficina`: Lança um abatimento (débito) detalhando o motivo (ex: "Conserto de parachoque") e diminui o saldo em custódia na hora.
  - `💸 Restituir Saldo`: Abre o modal para confirmar a devolução do saldo restante via Pix.

---

## Módulo 3: 📈 Repasses para Investidores (Revenue Share)

Este módulo automatiza a divisão de receitas e prestação de contas mensal com proprietários parceiros de veículos.

### 1. Rotas de API (`app/api/locacoes/investors/route.js`)
* **`GET /api/locacoes/investors/payout`**:
  - Calcula dinamicamente o saldo acumulado de repasse para cada veículo que possui investidor (`investor_name IS NOT NULL`):
    - **Faturamento Bruto:** Soma dos aluguéis recebidos (`charges` com status `'paid'`) no mês corrente.
    - **Custos Operacionais:** Soma das manutenções de desgaste natural do locador (`maintenance_records` onde `responsibility = 'owner'`) no período.
    - **Taxa de Administração:** Percentual de comissão retido pelo gestor (ex: 20%).
    - **Saldo Líquido de Repasse:** `(Faturamento Bruto - Custos) * (Split Investidor %)`.

### 2. Interface de Usuário First-Mobile
* Exibe cards de veículos de terceiros ativos com:
  - **Modelo/Placa do Carro** & **Investidor Proprietário**
  - **Faturamento Acumulado no Mês**
  - **Gastos Operacionais Registrados**
  - **Saldo Líquido a Repassar**
* **Ações Rápidas nos Cards:**
  - `🧾 Enviar Extrato de Contas`: A IA Catarina monta uma linda mensagem estruturada de prestação de contas (relação de aluguéis recebidos, oficina, taxa de gestão e lucro líquido) em formato editável no WhatsApp para enviar para o Investidor com apenas um clique!
  - `💵 Confirmar Repasse Realizado`: Registra a quitação do repasse no mês e reseta o saldo corrente para o próximo ciclo de 30 dias.

---

## Plano de Implementação Passo a Passo (First-Mobile)

### Etapa 1: Ativação de Multas e Correspondência Automática (Aba 4)
- Criar a rota de API de multas e a interface de cartões de multas.
- Criar modal de lançamento de multas com auto-match por data/hora.
- Integrar a caixa de texto de template de WhatsApp editável antes de enviar o lembrete de multa.

### Etapa 2: Ativação de Custódia de Caução & Extratos (Aba 3)
- Criar rotas de extrato e transações de caução.
- Implementar a gaveta de extrato (Timeline de depósitos e abatimentos).
- Adicionar o formulário mobile de desconto de avarias na caução.

### Etapa 3: Ativação do Relatório de Repasses (Aba 5)
- Criar rota de cálculo dinâmico de repasse para investidores.
- Implementar cards de prestação de contas e template de WhatsApp editável para repasse.

---
