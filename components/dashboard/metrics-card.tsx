import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricsCard({ 
  title, 
  value, 
  change,
  variant = "default" 
}: { 
  title: string; 
  value: string; 
  change: string;
  variant?: "default" | "primary" | "emerald";
}) {
  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl group">
      <CardContent className="p-5 flex flex-col justify-between h-full min-h-[120px]">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 group-hover:text-primary transition-colors">
            {title}
          </p>
          <h3 className="text-3xl font-black tracking-tighter text-foreground">
            {value}
          </h3>
        </div>
        <div className="flex items-center justify-between mt-4">
          <Badge 
            variant="secondary" 
            className={cn(
              "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border-none",
              variant === "primary" ? "bg-primary/10 text-primary" : 
              variant === "emerald" ? "bg-emerald-500/10 text-emerald-600" : 
              "bg-muted text-muted-foreground"
            )}
          >
            {change}
          </Badge>
          <div className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/60"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
