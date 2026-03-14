const faqs = [
  { q: "Is HealthFlow HIPAA-ready?", a: "The platform provides security-focused architecture and access controls; compliance setup depends on your operational policies." },
  { q: "Can I integrate existing EHR systems?", a: "Yes. HealthFlow is API-first and designed for external integrations." },
  { q: "How are consultations billed?", a: "Stripe handles payment intents and settlement flows." }
];

export function FaqSection() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">FAQ</h2>
      <div className="space-y-3">
        {faqs.map((faq) => (
          <div key={faq.q} className="rounded-lg border p-4">
            <p className="font-medium">{faq.q}</p>
            <p className="mt-1 text-sm text-muted-foreground">{faq.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
