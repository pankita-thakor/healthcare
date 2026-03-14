import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricsCard({ title, value, change }: { title: string; value: string; change: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <p className="text-2xl font-semibold">{value}</p>
        <Badge variant="secondary">{change}</Badge>
      </CardContent>
    </Card>
  );
}
