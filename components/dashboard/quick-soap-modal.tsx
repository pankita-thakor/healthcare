"use client";

import { useState, useEffect } from "react";
import { X, Search, User, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useProviderPatients } from "@/hooks/use-provider-patients";
import { saveSoapNote } from "@/services/provider/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface QuickSoapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSoapModal({ isOpen, onClose }: QuickSoapModalProps) {
  const { patients, loading: loadingPatients } = useProviderPatients();
  const [step, setStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [soap, setSoap] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  async function handleSave() {
    if (!selectedPatientId) return;
    setIsSaving(true);
    try {
      await saveSoapNote({
        appointmentId: `quick-note-${Date.now()}`,
        patientId: selectedPatientId,
        ...soap
      });
      toast.success("SOAP note created successfully");
      resetAndClose();
    } catch (error) {
      toast.error("Failed to save SOAP note");
    } finally {
      setIsSaving(false);
    }
  }

  function resetAndClose() {
    setStep(1);
    setSelectedPatientId(null);
    setSearchQuery("");
    setSoap({ subjective: "", objective: "", assessment: "", plan: "" });
    onClose();
  }

  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300",
      isOpen ? "bg-background/80 backdrop-blur-sm opacity-100" : "bg-transparent opacity-0 pointer-events-none"
    )}>
      <div className={cn(
        "bg-card w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden transition-all duration-500 transform",
        isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-10"
      )}>
        {/* Header */}
        <div className="p-8 border-b border-border/50 bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight uppercase">Quick SOAP Note</h2>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                {step === 1 ? "Select a patient to proceed" : `Drafting note for ${selectedPatient?.name}`}
              </p>
            </div>
          </div>
          <button 
            onClick={resetAndClose}
            className="h-10 w-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search patients by name..." 
                  className="pl-12 h-14 rounded-2xl bg-muted/50 border-none ring-1 ring-border/50 focus:ring-primary/50 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {loadingPatients ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Records...</p>
                  </div>
                ) : filteredPatients.length > 0 ? (
                  filteredPatients.map(patient => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatientId(patient.id);
                        setStep(2);
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-lg font-black group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                          {patient.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-foreground/90">{patient.name}</p>
                          <p className="text-xs text-muted-foreground">{patient.condition || "General Checkup"}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="rounded-lg font-bold text-[10px] uppercase">
                        Select
                      </Badge>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground">No patients found matching your search.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subjective</label>
                  <Textarea 
                    placeholder="Patient reports..." 
                    className="min-h-[120px] rounded-2xl bg-muted/30 border-none ring-1 ring-border/50 focus:ring-primary/50 resize-none"
                    value={soap.subjective}
                    onChange={(e) => setSoap(s => ({ ...s, subjective: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Objective</label>
                  <Textarea 
                    placeholder="Physical findings..." 
                    className="min-h-[120px] rounded-2xl bg-muted/30 border-none ring-1 ring-border/50 focus:ring-primary/50 resize-none"
                    value={soap.objective}
                    onChange={(e) => setSoap(s => ({ ...s, objective: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Assessment</label>
                  <Textarea 
                    placeholder="Diagnosis/Status..." 
                    className="min-h-[120px] rounded-2xl bg-muted/30 border-none ring-1 ring-border/50 focus:ring-primary/50 resize-none"
                    value={soap.assessment}
                    onChange={(e) => setSoap(s => ({ ...s, assessment: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Plan</label>
                  <Textarea 
                    placeholder="Next steps..." 
                    className="min-h-[120px] rounded-2xl bg-muted/30 border-none ring-1 ring-border/50 focus:ring-primary/50 resize-none"
                    value={soap.plan}
                    onChange={(e) => setSoap(s => ({ ...s, plan: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs"
                  onClick={() => setStep(1)}
                  disabled={isSaving}
                >
                  Back
                </Button>
                <Button 
                  className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                  onClick={handleSave}
                  disabled={isSaving || !soap.subjective || !soap.objective || !soap.assessment || !soap.plan}
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                  )}
                  {isSaving ? "Saving Note..." : "Finalize & Save SOAP"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
