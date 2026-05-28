# Plano Estratégico: Monetização, E-mail e Modo Equipe

## 1. Gateway de Assinaturas (Monetização via Pix/Cartão)
Como o público brasileiro exige **Pix**, precisamos de um Gateway robusto que suporte recorrência/assinaturas via Pix.
- **Stripe:** Suporta Pix nativamente (inclusive para faturas/invoices). O usuário escaneia o QR Code no checkout do Stripe, e o webhook `invoice.payment_succeeded` atualiza o sistema. 
- **Alternativa (Mercado Pago ou Asaas):** São excelentes opções nativas do Brasil para gestão de assinaturas recorrentes focadas 100% em Pix (pois enviam o Pix direto no WhatsApp do assinante todo mês).

*Vamos seguir com o Stripe (já que possui a API mais sólida) configurando a forma de pagamento Pix no painel do Stripe.*

### Fluxo de Implementação:
- Adicionar SDK do Stripe.
- Criar a rota de Checkout (`/api/checkout`).
- Configurar Webhooks (`/api/webhooks/stripe`).
- O webhook atualizará `plan` e `plan_expires_at` do usuário logado.

## 2. E-mail Transacional Corporativo (`suporte@cobbra.com.br`)
**Ação Atualizada:** Como o SMTP do **Resend** já está configurado no site de cobranças, aproveitaremos a mesma infraestrutura! 
- Faremos apenas a adição dos **novos templates** focados na gestão da assinatura:
  1. Recibo de Assinatura Confirmada.
  2. Alerta de Falha de Pagamento / Vencimento do plano.
  3. Lógica para encaminhar e-mails recebidos em `suporte@` para uma caixa de entrada centralizada ou apenas assinar as mensagens com este e-mail remetente.

## 3. Modo Equipe (Multi-usuário)
- Tabela `team_members` (id, owner_id, member_id, role).
- Fluxo de alteração no banco de dados para isolar dados por `owner_id`.
- Interface gráfica "Equipe" para gerenciar convites.
