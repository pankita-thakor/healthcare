import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const items = [
  "API-first architecture for healthcare integrations",
  "Role-based patient, provider, and admin portals",
  "Realtime messaging and notifications",
  "Built-in video consultation room creation",
  "Analytics and engagement tracking",
  "AI note generation and SOAP summarization"
];

export function FeatureGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item}>
          <CardHeader>
            <CardTitle className="text-base">{item}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Production-grade workflows for modern telehealth products.</CardContent>
        </Card>
      ))}
    </section>
  );
}
