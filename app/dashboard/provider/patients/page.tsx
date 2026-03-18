"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, User, MessageSquare, Calendar, MoreVertical, AlertCircle, Clock, ChevronRight } from "lucide-react";
import { useProviderPatients } from "@/hooks/use-provider-patients";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ProviderPatientsPage() {
  const { patients, loading, error } = useProviderPatients();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPatients = patients.filter((patient) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      patient.name.toLowerCase().includes(searchLower) ||
      (patient.condition?.toLowerCase() || "").includes(searchLower)
    );
  });

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20";
      case "medium":
        return "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20";
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString([], { 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true 
    });
  };

  return (
    <div className="space-y-6 w-full   animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Patient Directory</h1>
          <p className="text-muted-foreground mt-1 text-base">Manage and monitor your assigned patient list.</p>
        </div>
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by name or condition..."
            className="pl-10 h-11 bg-background/50 backdrop-blur-sm border-muted-foreground/20 hover:border-muted-foreground/40 transition-all rounded-xl shadow-sm focus:shadow-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden ring-1 ring-border/50 w-full">
        <CardHeader className="pb-2 border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Assigned Patients
            </CardTitle>
            <Badge variant="secondary" className="font-medium px-3 py-1 rounded-lg">
              {filteredPatients.length} Patients
            </Badge>
          </div>
          <CardDescription className="text-sm">Real-time status of patients under your care.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground font-medium animate-pulse">Synchronizing patient records...</p>
            </div>
          )}
          
          {error && (
            <div className="m-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          
          {!loading && !filteredPatients.length && !error && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
              <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-2">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground/80">No patients found</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {searchQuery 
                  ? `We couldn't find any results matching "${searchQuery}". Try a different term.` 
                  : "You don't have any patients assigned to you at the moment."}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery("")} className="mt-2 rounded-xl">
                  Clear Search
                </Button>
              )}
            </div>
          )}

          {!!filteredPatients.length && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground border-b border-border/50">
                    <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider">Patient Name</th>
                    <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider">Demographics</th>
                    <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider">Priority & Condition</th>
                    <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider">Last Interaction</th>
                    <th className="px-6 py-4 text-left font-semibold text-xs uppercase tracking-wider">Next Appointment</th>
                    <th className="px-6 py-4 text-right font-semibold text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredPatients.map((patient) => (
                    <tr 
                      key={patient.id} 
                      className="group hover:bg-muted/40 transition-colors duration-200 cursor-default"
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
                            {patient.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link 
                              className="text-sm font-bold text-foreground hover:text-primary transition-colors block" 
                              href={`/dashboard/provider/patient/${patient.id}`}
                            >
                              {patient.name}
                            </Link>
                            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tighter">ID: {patient.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-foreground/80">{patient.age ?? "?"} Years</span>
                          <span className="text-xs text-muted-foreground">General Info</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2">
                          <Badge 
                            variant="outline" 
                            className={cn("w-fit font-bold px-2.5 py-0.5 rounded-lg border", getPriorityColor(patient.priority))}
                          >
                            {patient.priority.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-foreground/80 line-clamp-1 font-medium">{patient.condition ?? "General Checkup"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(patient.last_visit)}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        {patient.next_appointment ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm font-bold text-primary">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(patient.next_appointment)}
                            </div>
                            <span className="text-[10px] text-primary/70 font-bold uppercase ml-5 tracking-wide">Confirmed</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground italic font-medium">None scheduled</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <div className="relative flex items-center justify-end h-8 w-full">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 pointer-events-none group-hover:pointer-events-auto absolute right-0">
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm hover:border-primary/50 hover:text-primary bg-background" asChild title="View Profile">
                              <Link href={`/dashboard/provider/patient/${patient.id}`}>
                                <User className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm hover:border-primary/50 hover:text-primary bg-background" asChild title="Send Message">
                              <Link href={`/dashboard/provider/patient/${patient.id}`}>
                                <MessageSquare className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm hover:border-primary/50 hover:text-primary bg-background" asChild title="View Options">
                              <Link href={`/dashboard/provider/patient/${patient.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                          <div className="opacity-100 group-hover:opacity-0 transition-opacity duration-300 text-muted-foreground flex items-center">
                             <ChevronRight className="h-5 w-5" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
