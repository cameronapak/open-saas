import * as z from 'zod';
import { UnhandledWebhookEventError } from '../errors';
import { HttpError } from 'wasp/server';

export async function parseWebhookPayload(rawPayload: string) {
  try {
    const rawEvent: unknown = JSON.parse(rawPayload);
    const event = await genericEventSchema.parseAsync(rawEvent);
    switch (event.meta.event_name) {
      case 'order_created':
        const orderData = await orderDataSchema.parseAsync(event.data);
        return { eventName: event.meta.event_name, meta: event.meta, data: orderData };
      case 'subscription_created':
      case 'subscription_updated':
      case 'subscription_cancelled':
      case 'subscription_expired':
        const subscriptionData = await subscriptionDataSchema.parseAsync(event.data);
        return { eventName: event.meta.event_name, meta: event.meta, data: subscriptionData };
      default:
        // If you'd like to handle more events, you can add more cases above.
        throw new UnhandledWebhookEventError(event.meta.event_name);
    }
  } catch (e: unknown) {
    if (e instanceof UnhandledWebhookEventError) {
      throw e;
    } else {
      console.error(e);
      throw new HttpError(400, 'Error parsing Lemon Squeezy webhook payload');
    }
  }
}

export type SubscriptionData = z.infer<typeof subscriptionDataSchema>;

export type OrderData = z.infer<typeof orderDataSchema>;

const genericEventSchema = z.object({
  meta: z.object({
    event_name: z.string(),
    custom_data: z.object({
      user_id: z.string(),
    }),
  }),
  data: z.unknown(),
});

// This is a subtype of Order type from "@lemonsqueezy/lemonsqueezy.js"
// specifically Order['data']
const orderDataSchema = z.object({
  attributes: z.object({
    customer_id: z.number(),
    status: z.string(),
    first_order_item: z.object({
      variant_id: z.number(),
    }),
    order_number: z.number(),
  }),
});

// This is a subtype of Subscription type from "@lemonsqueezy/lemonsqueezy.js"
// specifically Subscription['data']
const subscriptionDataSchema = z.object({
  attributes: z.object({
    customer_id: z.number(),
    status: z.string(),
    variant_id: z.number(),
  }),
});
