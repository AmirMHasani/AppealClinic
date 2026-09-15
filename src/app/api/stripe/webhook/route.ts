import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeLiveEnabled, getStripeSecretKey, isLiveStripeKey } from "@/lib/env";
import { getStripe } from "@/lib/stripe/client";
import { setSubscriptionEntitlement } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Stripe webhook — TEST mode only unless STRIPE_LIVE_ENABLED=true.
 * Verifies signature with STRIPE_WEBHOOK_SECRET; stores minimal entitlement on AppMeta.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 503 }
    );
  }

  const secretKey = getStripeSecretKey();
  if (isLiveStripeKey(secretKey) && !stripeLiveEnabled()) {
    return NextResponse.json(
      {
        error:
          "Live Stripe keys require STRIPE_LIVE_ENABLED=true (keep false for Phase 1)",
      },
      { status: 403 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe/webhook] signature", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (event.livemode && !stripeLiveEnabled()) {
    console.warn(
      "[stripe/webhook] rejecting livemode event — STRIPE_LIVE_ENABLED is off"
    );
    return NextResponse.json(
      { error: "Live mode events rejected while STRIPE_LIVE_ENABLED is false" },
      { status: 403 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;
        console.log("[stripe/webhook] checkout.session.completed", {
          id: session.id,
          customerId,
          subscriptionId,
          mode: event.livemode ? "live" : "test",
        });
        await setSubscriptionEntitlement({
          planEntitled: true,
          subscriptionStatus: "active",
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
        });
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status = sub.status;
        const entitled = status === "active" || status === "trialing";
        console.log("[stripe/webhook] customer.subscription.updated", {
          id: sub.id,
          status,
          entitled,
        });
        await setSubscriptionEntitlement({
          planEntitled: entitled,
          subscriptionStatus: status,
          stripeCustomerId:
            typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
          stripeSubscriptionId: sub.id,
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        console.log("[stripe/webhook] customer.subscription.deleted", { id: sub.id });
        await setSubscriptionEntitlement({
          planEntitled: false,
          subscriptionStatus: "canceled",
          stripeCustomerId:
            typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
          stripeSubscriptionId: sub.id,
        });
        break;
      }
      default:
        console.log("[stripe/webhook] ignored event", event.type);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handler failed";
    console.error("[stripe/webhook] handler", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
