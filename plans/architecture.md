# Arquitetura do Sistema Cobroo / Cobbra.ai

## 1. Visão Geral
O **Cobbra** é um Micro-SaaS de "Cobrança Gentil", projetado para profissionais independentes (freelancers, personal trainers, locadoras, clínicas, etc). Seu objetivo é automatizar lembretes de pagamento via WhatsApp e E-mail e gerenciar inadimplência.
Ele permite recebimentos direto via Pix (taxa zero).

## 2. Stack Tecnológica
- **Framework Front-end / Back-end:** Next.js (16.2.6) usando App Router (`app/`).
- **UI / Estilização:** React 19 e Tailwind CSS v4.
- **Banco de Dados:** SQLite (gerenciado via `better-sqlite3`).
- **Autenticação:** JWT (`jsonwebtoken`) e senhas criptografadas (`bcryptjs`). E-mails com `nodemailer`.
- **Inteligência Artificial:** Integração com a API do Google Gemini (modelo `gemini-2.5-flash`) para o "Catarina AI Copilot".

## 3. Modelo de Dados (Schema Principal)
O banco de dados SQLite (`database/schema.sql`) é estruturado com as seguintes tabelas chave:
- **users:** Usuários do SaaS (donos de negócios). Armazena plano, nicho, chave Pix, configurações de juros.
- **clients:** Clientes dos usuários (os pagadores/devedores).
- **charges (Cobranças):** Registros individuais de faturamento. Contém valor, vencimento, recorrência, juros diários, canal de notificação, status.
- **daily_billing:** Faturamentos diários.
- **reminders & reminder_templates:** Log de mensagens enviadas (WhatsApp/Email) e modelos de mensagens com diferentes "tons" (gentil, neutro, firme).
- **transactions:** Pagamentos realizados.
- **notifications & activity_log:** Sistema interno de avisos e log de auditoria.

## 4. Estrutura do Front-end
- **Landing Page (`app/page.js`):** Focada em conversão, com calculadora de ROI, depoimentos por persona, simulador de WhatsApp, FAQ interativo e exibição das features da Catarina AI.
- **Dashboard (`app/dashboard/layout.js`):** SPA protegida, com sidebar expansível (desktop) e menu inferior (mobile). Contém atalhos para o Copilot (Ctrl+K), notificações em tempo real, painel de perfil do cliente em formato Drawer (gaveta lateral).

## 5. Módulos Especiais / Diferenciais
- **Catarina AI Copilot (`/api/ai/copilot/route.js`):** Um assistente integrado ao dashboard. O usuário pode digitar coisas como *"Cobre R$ 150 do Gustavo amanhã"*, e o back-end via Gemini traduz a frase em parâmetros JSON para acionar a criação automática de `charges`.
- **Motor de Juros e Locações:** A estrutura suporta funcionalidades complexas, como geração automática de contratos de locação veicular (`contract_text`) embutidos no banco de dados, e cálculo dinâmico de juros pós-vencimento na UI.
- **Abatimentos e Pagamentos Parciais:** Permite realizar abatimentos parciais (`/api/cobrancas/[id]`).

## 6. Rotas de API Relevantes
- `/api/auth/*`: Login, registro, me (validação de token JWT).
- `/api/cobrancas`: CRUD principal das faturas. Verifica limites do plano do usuário (`starter`, `crescimento`, `cobra_pro`) antes de criar.
- `/api/clientes`: Gestão de devedores e cálculo de scores.
- `/api/ai/copilot`: Rota serverless que envia a string livre para o Gemini e devolve `intent` e parâmetros estruturados.
