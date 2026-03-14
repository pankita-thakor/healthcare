export async function createPaymentIntent(amountCents: number, customerId?: string) {
  const response = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      amount: String(amountCents),
      currency: "usd",
      ...(customerId ? { customer: customerId } : {})
    })
  });

  if (!response.ok) throw new Error("Stripe payment intent failed");
  return response.json();
}
