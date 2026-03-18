import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export function MetricsCard({ 
  title, 
  value, 
  change,
  variant = "default",
  icon: Icon
}: { 
  title: string; 
  value: string; 
  change: string;
  variant?: "default" | "primary" | "emerald";
  icon?: LucideIcon;
}) {
  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2rem] group bg-card/50 backdrop-blur-md border-none ring-1 ring-border/50">
      <CardContent className="p-6 flex flex-col justify-between h-full min-h-[140px]">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 group-hover:text-primary transition-colors">
              {title}
            </p>
            <h3 className="text-4xl font-black tracking-tighter text-foreground">
              {value}
            </h3>
          </div>
          {Icon && (
            <div className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
              variant === "primary" ? "bg-primary/10 text-primary shadow-primary/10" : 
              variant === "emerald" ? "bg-emerald-500/10 text-emerald-600 shadow-emerald-500/10" : 
              "bg-muted text-muted-foreground shadow-muted/50"
            )}>
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-4">
          <Badge 
            variant="secondary" 
            className={cn(
              "rounded-xl px-3 py-1 text-[10px] font-bold uppercase tracking-wider border-none",
              variant === "primary" ? "bg-primary/10 text-primary" : 
              variant === "emerald" ? "bg-emerald-500/10 text-emerald-600" : 
              "bg-muted text-muted-foreground"
            )}
          >
            {change}
          </Badge>
          <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
