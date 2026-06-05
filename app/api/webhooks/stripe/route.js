import { stripe } from '@/lib/stripe';
import { run } from '@/lib/db';
import { headers } from 'next/headers';

export async function POST(request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  let event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ STRIPE_WEBHOOK_SECRET is not set in production! Blocking request for security reasons.');
        return new Response('Stripe webhook configuration error', { status: 500 });
      }
      console.warn('STRIPE_WEBHOOK_SECRET is not set. Bypassing signature verification for testing purposes ONLY.');
      event = JSON.parse(body);
    } else {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    }
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // If it's a subscription, the customer will be charged later, but we know it completed.
        // Wait for invoice.payment_succeeded to actually grant access.
        // But if it's a one-time payment or trial, we can activate it here.
        if (session.metadata?.user_id && session.metadata?.plan_selected) {
          const userId = session.metadata.user_id;
          const plan = session.metadata.plan_selected;
          
          run('UPDATE users SET plan = ?, status = ? WHERE id = ?', [plan, 'active', userId]);
          console.log(`User ${userId} upgraded to ${plan}`);
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;
        
        if (customerId) {
          // Grant or renew access
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          
          try {
            run(
              "UPDATE users SET status = 'active', stripe_subscription_id = ?, plan_expires_at = ? WHERE stripe_customer_id = ?", 
              [subscriptionId, nextMonth.toISOString(), customerId]
            );
            console.log(`Subscription renewed for customer ${customerId}`);
          } catch (e) {
            console.error('Failed to update user on payment success', e);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        
        if (customerId) {
          try {
             // Downgrade to starter when subscription is cancelled/fails
             run("UPDATE users SET plan = 'starter' WHERE stripe_customer_id = ?", [customerId]);
             console.log(`Customer ${customerId} downgraded to starter`);
          } catch (e) {
            console.error('Failed to downgrade user', e);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Webhook handler failed:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
