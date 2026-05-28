# Configuração do Stripe (Plano Ilimitado c/ 3 Dias Grátis)

Siga estes passos para configurar o faturamento do seu Plano Único:

## 1. Crie uma conta no Stripe
1. Acesse [https://stripe.com/br](https://stripe.com/br) e crie uma conta.

## 2. Ative o método de pagamento Pix
1. Vá em **Configurações > Métodos de Pagamento**.
2. Na aba de "Pagamentos Aceitos", ative o **Pix**.

## 3. Crie o Produto (Plano Completo Ilimitado)
1. Vá em **Catálogo de Produtos** no Stripe.
2. Crie um produto chamado **Cobbra Pro (Ilimitado)**.
3. Adicione o preço Mensal (R$ 49,90) -> Isso vai gerar um ID (Ex: `price_1Nxxxxx...`).
4. Adicione o preço Anual (R$ 478,80) -> Gerará outro ID.
*Nota: Não se preocupe em configurar os 3 dias grátis aqui. Nosso código em `app/api/checkout/route.js` já injeta o `trial_period_days: 3` dinamicamente no checkout!*

## 4. Atualize suas Variáveis de Ambiente
Coloque as seguintes chaves no seu `.env` ou na Vercel:

```env
# Chave da API do Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxx

# IDs dos Preços
STRIPE_PRICE_COBRA_PRO_MONTHLY=price_xxxx_mensal
STRIPE_PRICE_COBRA_PRO_YEARLY=price_yyyy_anual

# URL Base
NEXT_PUBLIC_BASE_URL=https://cobbra.com.br
```

## 5. Configure o Webhook
O Webhook avisa o site quando o período de trial acaba e o Pix/Cartão é de fato cobrado.
1. Em **Desenvolvedores > Webhooks**, clique em **Adicionar Endpoint**.
2. URL: `https://cobbra.com.br/api/webhooks/stripe`
3. Eventos:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
4. Copie o **Segredo de Assinatura** e adicione no `.env`:
   `STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxx`
