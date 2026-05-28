import { stripe } from '@/lib/stripe';
import { getUserFromRequest } from '@/lib/auth';
import { queryOne, run } from '@/lib/db';

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { cycle } = body; // 'mensal' ou 'anual'

    if (!cycle) {
      return Response.json({ error: 'O ciclo de faturamento é obrigatório' }, { status: 400 });
    }

    const priceMap = {
      'mensal': process.env.STRIPE_PRICE_COBRA_PRO_MONTHLY || 'price_1_cobra_pro_mensal',
      'anual': process.env.STRIPE_PRICE_COBRA_PRO_YEARLY || 'price_1_cobra_pro_anual',
    };

    const priceId = priceMap[cycle];

    if (!priceId) {
       return Response.json({ error: 'Ciclo de faturamento inválido' }, { status: 400 });
    }

    const dbUser = queryOne('SELECT * FROM users WHERE id = ?', [user.id]);
    let customerId = dbUser.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        name: dbUser.name,
        metadata: {
          user_id: dbUser.id,
        },
      });
      customerId = customer.id;
      try {
        run('UPDATE users SET stripe_customer_id = ? WHERE id = ?', [customerId, dbUser.id]);
      } catch (e) {
        console.warn('Could not save stripe_customer_id', e);
      }
    }

    // Create Checkout Session with 3 days free trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card', 'pix'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 3, // 3 Dias grátis conforme o site!
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/configuracoes?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/configuracoes?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_selected: 'cobra_pro',
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
