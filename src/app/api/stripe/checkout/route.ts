import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  getStripePriceId,
  stripeCheckoutAllowed,
} from "@/lib/env";
import { getStripe } from "@/lib/stripe/client";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gate = stripeCheckoutAllowed();
  if (!gate.allowed) {
    return NextResponse.json(
      { error: gate.reason || "Checkout not available" },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  const priceId = getStripePriceId();
  if (!stripe || !priceId) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/upgrade/cancel`,
      customer_email: user.email || undefined,
      metadata: {
        clinic_user_id: user.id,
        appealclinic_mode: gate.mode || "test",
      },
      subscription_data: {
        metadata: {
          clinic_user_id: user.id,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a Checkout URL" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      url: session.url,
      mode: gate.mode,
      id: session.id,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create Checkout Session";
    console.error("[stripe/checkout]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
