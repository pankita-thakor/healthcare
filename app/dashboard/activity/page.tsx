"use client";

import { useEffect, useState } from "react";
import { fetchActivities, type ActivityRecord } from "@/services/activity/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);

  useEffect(() => {
    setActivities(fetchActivities());
  }, []);

  const typeStyles = {
    appointment: "bg-blue-500/10 text-blue-600 border-blue-200",
    message: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    profile: "bg-amber-500/10 text-amber-600 border-amber-200",
    clinical: "bg-purple-500/10 text-purple-600 border-purple-200",
    availability: "bg-sky-500/10 text-sky-600 border-sky-200"
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-sm text-muted-foreground font-medium">Record of your recent actions and updates.</p>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          {!activities.length ? (
            <div className="flex flex-col items-center justify-center py-20 bg-background rounded-3xl border border-dashed">
               <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center mb-4 text-muted-foreground/40">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
               </div>
               <p className="text-sm font-bold text-muted-foreground">No activities recorded yet.</p>
            </div>
          ) : (
            <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/60 before:to-transparent">
              {activities.map((activity) => (
                <div key={activity.id} className="relative flex items-center gap-6 group">
                  <div className="absolute left-0 mt-1 h-10 w-10 flex items-center justify-center rounded-full bg-background border shadow-sm z-10">
                     <div className={cn("h-2.5 w-2.5 rounded-full", 
                        activity.type === "appointment" ? "bg-blue-500" :
                        activity.type === "message" ? "bg-emerald-500" :
                        activity.type === "clinical" ? "bg-purple-500" :
                        activity.type === "availability" ? "bg-sky-500" : "bg-amber-500"
                     )}></div>
                  </div>
                  
                  <Card className="ml-14 flex-1 border-border/40 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className={cn("text-xs font-black uppercase tracking-widest", typeStyles[activity.type])}>
                              {activity.type}
                           </Badge>
                           <h3 className="text-sm font-black tracking-tight">{activity.action}</h3>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                          {activity.details}
                        </p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end">
                        <p className="text-xs font-black text-foreground/40 uppercase tracking-tighter">
                          {new Date(activity.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </p>
                        <p className="text-xs font-bold text-muted-foreground/60">
                          {new Date(activity.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
