"use client";

import { useEffect, useState, useRef } from "react";
import { format, parseISO, addDays, startOfWeek, isSameDay } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  List,
  Video,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";
import Link from "next/link";
import {
  fetchProviderAvailability,
  setProviderAvailability,
  deleteProviderAvailabilitySlot,
  updateProviderAvailabilitySlot,
  fetchProviderWeekAppointments,
  rescheduleAppointment,
  markAppointmentComplete,
  type ProviderAvailabilitySlot,
} from "@/services/provider/dashboard";
import type { ProviderWeekAppointment } from "@/services/provider/dashboard";
import { showNotification } from "@/components/layout/GlobalNotification";
import { createBrowserClient } from "@/lib/supabase";
import { safeGetUser } from "@/lib/supabase-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function formatDateYmd(date: Date) {
  return format(date, "yyyy-MM-dd");
}

const IST_DATE_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});
const IST_TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

function toKolkataDateStr(d: Date): string {
  return IST_DATE_FMT.format(d);
}

function slotMatchesAppointment(
  slot: ProviderAvailabilitySlot,
  appt: ProviderWeekAppointment
): boolean {
  if (!["pending", "confirmed", "completed"].includes(appt.status)) return false;
  const d = parseISO(appt.start_time);
  const aptDate = IST_DATE_FMT.format(d);
  const aptTime = IST_TIME_FMT.format(d);
  const slotDate = String(slot.available_date ?? "").slice(0, 10);
  const slotTime = String(slot.start_time ?? "").slice(0, 5);
  return slotDate === aptDate && slotTime === aptTime;
}

/** Derives display status: running when time has started, completed when marked or time has passed, else pending/confirmed */
function getDisplayStatus(appt: ProviderWeekAppointment): "running" | "completed" | "pending" | "confirmed" {
  if (appt.status === "completed") return "completed";
  const now = new Date();
  const start = parseISO(appt.start_time);
  const end = parseISO(appt.end_time);
  if (now > end && ["pending", "confirmed"].includes(appt.status)) return "completed";
  if (now >= start && now <= end && ["pending", "confirmed"].includes(appt.status)) return "running";
  return appt.status as "pending" | "confirmed";
}

export default function ProviderSchedulePage() {
  const [slots, setSlots] = useState<ProviderAvailabilitySlot[]>([]);
  const [appointments, setAppointments] = useState<ProviderWeekAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 4 })); // Thu start like screenshot

  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("17:00");

  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  const [pendingDeleteSlot, setPendingDeleteSlot] = useState<ProviderAvailabilitySlot | null>(null);
  const [isSlotDeleteModalVisible, setIsSlotDeleteModalVisible] = useState(false);

  const [rescheduleApt, setRescheduleApt] = useState<ProviderWeekAppointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStartTime, setRescheduleStartTime] = useState("09:00");
  const [rescheduleEndTime, setRescheduleEndTime] = useState("09:30");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [isRescheduleModalVisible, setIsRescheduleModalVisible] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [, setStatusTick] = useState(0);

  function openReschedule(appt: ProviderWeekAppointment) {
    const start = parseISO(appt.start_time);
    const end = parseISO(appt.end_time);
    setRescheduleApt(appt);
    setRescheduleDate(IST_DATE_FMT.format(start));
    setRescheduleStartTime(IST_TIME_FMT.format(start));
    setRescheduleEndTime(IST_TIME_FMT.format(end));
    setRescheduleReason("");
  }

  function closeRescheduleModal() {
    setIsRescheduleModalVisible(false);
    window.setTimeout(() => {
      setRescheduleApt(null);
      setRescheduleReason("");
    }, 220);
  }

  async function handleRescheduleSubmit() {
    if (!rescheduleApt || !rescheduleReason.trim()) {
      showNotification("Please provide a reason for the reschedule.", "error");
      return;
    }
    setIsRescheduling(true);
    try {
      const newStart = new Date(`${rescheduleDate}T${rescheduleStartTime}`);
      const newEnd = new Date(`${rescheduleDate}T${rescheduleEndTime}`);
      await rescheduleAppointment({
        appointmentId: rescheduleApt.id,
        newStartTime: newStart.toISOString(),
        newEndTime: newEnd.toISOString(),
        reason: rescheduleReason.trim(),
      });
      showNotification("Appointment rescheduled. Patient has been notified.");
      closeRescheduleModal();
      await loadAll();
    } catch (err) {
      showNotification((err as Error).message, "error");
    } finally {
      setIsRescheduling(false);
    }
  }

  async function handleMarkComplete(apptId: string) {
    setCompletingId(apptId);
    try {
      await markAppointmentComplete(apptId);
      showNotification("Appointment marked as completed.");
      await loadAll();
    } catch (err) {
      showNotification((err as Error).message, "error");
    } finally {
      setCompletingId(null);
    }
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (!pendingDeleteSlot) return;
    const timer = window.setTimeout(() => setIsSlotDeleteModalVisible(true), 10);
    return () => window.clearTimeout(timer);
  }, [pendingDeleteSlot]);

  useEffect(() => {
    const id = setInterval(() => setStatusTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  function closeSlotDeleteModal() {
    setIsSlotDeleteModalVisible(false);
    window.setTimeout(() => setPendingDeleteSlot(null), 220);
  }

  async function loadAll() {
    setIsLoading(true);
    try {
      const [availData, apptData] = await Promise.all([
        fetchProviderAvailability(),
        fetchProviderWeekAppointments(weekStart),
      ]);
      setSlots(availData ?? []);
      setAppointments(apptData ?? []);
    } catch (err) {
      showNotification((err as Error).message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  const loadAllRef = useRef(loadAll);
  loadAllRef.current = loadAll;

  useEffect(() => {
    void loadAll();
  }, [weekStart]);

  useEffect(() => {
    if (!rescheduleApt) return;
    const timer = window.setTimeout(() => setIsRescheduleModalVisible(true), 10);
    return () => window.clearTimeout(timer);
  }, [rescheduleApt]);

  useEffect(() => {
    const supabase = createBrowserClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    void safeGetUser().then(({ user }) => {
      if (!user?.id) return;
      channel = supabase
        .channel("appointments-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "appointments", filter: `provider_id=eq.${user.id}` },
          () => void loadAllRef.current()
        )
        .subscribe();
    });
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function handleSave() {
    setIsLoading(true);
    try {
      await setProviderAvailability({ date: formDate, startTime: formStartTime, endTime: formEndTime });
      showNotification("Your availability has been saved.", "success");
      await loadAll();
    } catch (err) {
      showNotification((err as Error).message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  const todayKolkata = toKolkataDateStr(new Date());
  const todayCount = appointments.filter((a) => toKolkataDateStr(parseISO(a.start_time)) === todayKolkata).length;
  const activeSlotsCount = slots.length;

  const getAppointmentsForDay = (date: Date) =>
    appointments.filter((a) => toKolkataDateStr(parseISO(a.start_time)) === toKolkataDateStr(date));

  const getSlotsForDay = (date: Date) =>
    slots.filter((s) => (s.available_date ?? "").slice(0, 10) === toKolkataDateStr(date));

  function getAppointmentForSlot(slot: ProviderAvailabilitySlot): ProviderWeekAppointment | undefined {
    return appointments.find((a) => slotMatchesAppointment(slot, a));
  }

  function isSlotBooked(slot: ProviderAvailabilitySlot): boolean {
    return !!getAppointmentForSlot(slot);
  }

  /** Calendar items: slots show as Available unless booked; booked slots show as appointment card */
  function getDisplayItemsForDay(date: Date) {
    const daySlots = getSlotsForDay(date);
    const dayAppointments = getAppointmentsForDay(date);
    const items: Array<{ type: "slot"; slot: ProviderAvailabilitySlot } | { type: "appointment"; apt: ProviderWeekAppointment }> = [];
    for (const slot of daySlots) {
      const apt = getAppointmentForSlot(slot);
      if (apt) items.push({ type: "appointment", apt });
      else items.push({ type: "slot", slot });
    }
    const matchedApptIds = new Set(
      daySlots.filter((s) => getAppointmentForSlot(s)).map((s) => getAppointmentForSlot(s)!.id)
    );
    for (const apt of dayAppointments) {
      if (!matchedApptIds.has(apt.id)) items.push({ type: "appointment", apt });
    }
    return items.sort((a, b) => {
      const timeA = a.type === "slot" ? a.slot.start_time.slice(0, 5) : IST_TIME_FMT.format(parseISO(a.apt.start_time));
      const timeB = b.type === "slot" ? b.slot.start_time.slice(0, 5) : IST_TIME_FMT.format(parseISO(b.apt.start_time));
      return timeA.localeCompare(timeB);
    });
  }

  async function confirmDeleteSlot(slotId: string) {
    try {
      await deleteProviderAvailabilitySlot(slotId);
      showNotification("Slot removed.", "success");
      closeSlotDeleteModal();
      await loadAll();
    } catch (err) {
      showNotification((err as Error).message, "error");
    }
  }

  function startEditSlot(slot: ProviderAvailabilitySlot) {
    setEditingSlotId(slot.id);
    setEditDate(slot.available_date);
    setEditStartTime(slot.start_time.slice(0, 5));
    setEditEndTime(slot.end_time.slice(0, 5));
  }

  function cancelEditSlot() {
    setEditingSlotId(null);
    setEditDate("");
    setEditStartTime("");
    setEditEndTime("");
  }

  async function handleUpdateSlot() {
    if (!editingSlotId) return;
    try {
      await updateProviderAvailabilitySlot(editingSlotId, {
        date: editDate,
        startTime: editStartTime,
        endTime: editEndTime
      });
      showNotification("Slot updated.", "success");
      cancelEditSlot();
      await loadAll();
    } catch (err) {
      showNotification((err as Error).message, "error");
    }
  }

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500">
      {/* Delete Slot Modal */}
      {pendingDeleteSlot && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-background/60 px-4 backdrop-blur-sm transition-all duration-200 ${
            isSlotDeleteModalVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`w-full max-w-md rounded-[1.75rem] border border-border/60 bg-background p-6 shadow-2xl transition-all duration-200 ${
              isSlotDeleteModalVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
            }`}
          >
            <p className="text-xs font-black uppercase tracking-[0.24em] text-destructive">Confirm Delete</p>
            <h2 className="mt-3 text-xl font-black tracking-tight">Delete availability slot?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isSlotBooked(pendingDeleteSlot)
                ? "This slot has a booked appointment. Cancel or reschedule the appointment first."
                : `This will permanently remove this slot (${format(parseISO(pendingDeleteSlot.available_date), "EEE, MMM d, yyyy")} ${pendingDeleteSlot.start_time.slice(0, 5)}–${pendingDeleteSlot.end_time.slice(0, 5)}) from your schedule.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={closeSlotDeleteModal}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl"
                onClick={() => void confirmDeleteSlot(pendingDeleteSlot.id)}
                disabled={isSlotBooked(pendingDeleteSlot)}
              >
                Yes, delete
              </Button>
            </div>
      </div>
              </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleApt && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-background/60 px-4 backdrop-blur-sm transition-all duration-200 ${
            isRescheduleModalVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`w-full max-w-md rounded-[1.75rem] border border-border/60 bg-background p-6 shadow-2xl transition-all duration-200 ${
              isRescheduleModalVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
            }`}
          >
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Reschedule Appointment</p>
            <h2 className="mt-3 text-xl font-black tracking-tight">Select new slot and add reason</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Patient: <span className="font-bold">{rescheduleApt.patient_name ?? "Unknown"}</span>
            </p>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New date</label>
                  <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start</label>
                  <Input type="time" value={rescheduleStartTime} onChange={(e) => setRescheduleStartTime(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End time</label>
                  <Input type="time" value={rescheduleEndTime} onChange={(e) => setRescheduleEndTime(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason for patient</label>
                  <Textarea
                    placeholder="e.g. Emergency schedule change..."
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    className="min-h-[80px] rounded-xl"
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={closeRescheduleModal}>
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-xl"
                onClick={() => void handleRescheduleSubmit()}
                disabled={isRescheduling || !rescheduleReason.trim()}
              >
                {isRescheduling ? "Rescheduling..." : "Reschedule"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground uppercase">
          Appointment Scheduler
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your availability and upcoming consultations.
        </p>
      </div>

      {/* Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-foreground">
            Your practice is fully synchronized. Updates reflected in real-time for patients.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-background px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground shadow-sm">
            Today {todayCount} visits
          </span>
          <span className="rounded-full bg-background px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground shadow-sm">
            Active {activeSlotsCount} slots
                      </span>
                    </div>
      </div>

      {/* Top Row: Add Availability + Active Slots */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
        {/* Add Availability Card */}
        <Card className="border-none shadow-lg bg-card rounded-2xl overflow-hidden">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              Add Availability
            </CardTitle>
            <CardDescription className="text-sm">
              Select a date and time range for consultations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Date
                </label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Start Time
                </label>
                <Input
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="h-11 rounded-xl"
                />
                  </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  End Time
                </label>
                <Input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full h-12 rounded-xl font-bold text-sm uppercase tracking-wider"
            >
              {isLoading ? "Saving..." : "Save Availability Slot"}
            </Button>
          </CardContent>
        </Card>

        {/* Active Slots Card */}
        <Card className="border-none shadow-lg bg-card rounded-2xl overflow-hidden">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <List className="h-4 w-4 text-primary" />
              Active Slots
            </CardTitle>
            <CardDescription className="text-sm">
              Your configured hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2 max-h-[320px] overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : slots.length > 0 ? (
              <div className="space-y-3">
                {slots.map((slot) =>
                  editingSlotId === slot.id ? (
                    <div key={slot.id} className="rounded-xl border border-primary/30 bg-muted/20 p-4 space-y-3">
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-9 rounded-lg" />
                        <Input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} className="h-9 rounded-lg" />
                        <Input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} className="h-9 rounded-lg" />
                </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-8 rounded-lg" onClick={handleUpdateSlot} disabled={isLoading}>Save</Button>
                        <Button variant="outline" size="sm" className="h-8 rounded-lg" onClick={cancelEditSlot}>Cancel</Button>
                      </div>
                    </div>
                  ) : (() => {
                    const apt = getAppointmentForSlot(slot);
                    const slotStatus = apt ? getDisplayStatus(apt) : null;
                    const isCompleted = slotStatus === "completed";
                    return (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 ${
                        isSlotBooked(slot) && isCompleted
                          ? "border-muted-foreground/20 bg-muted/40 opacity-30"
                          : "border-border bg-muted/30"
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          isSlotBooked(slot) && isCompleted ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {format(parseISO(slot.available_date), "EEE, MMM d, yyyy")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            isSlotBooked(slot) && isCompleted
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
                        </span>
                        {isSlotBooked(slot) && (() => {
                          const status = slotStatus ?? "booked";
                          return (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                status === "completed"
                                  ? "bg-muted text-muted-foreground"
                                  : status === "running"
                                    ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {status === "completed" ? "Completed" : status === "running" ? "Running" : "Booked"}
                            </span>
                          );
                        })()}
                        {!isSlotBooked(slot) && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditSlot(slot)} title="Update">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setPendingDeleteSlot(slot)} title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })() )}
                        </div>
            ) : (
              <p className="text-sm text-muted-foreground">No slots configured. Add one above.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Appointments Calendar - Weekly View */}
      <Card className="border-none shadow-lg bg-card rounded-2xl overflow-hidden">
        <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold">Appointments Calendar</CardTitle>
            <CardDescription className="text-sm">This week.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={() => setWeekStart((d) => addDays(d, -7))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg font-medium"
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 4 }))}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={() => setWeekStart((d) => addDays(d, 7))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
                          </div>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="grid grid-cols-7 gap-3 min-w-[700px] overflow-x-auto">
            {weekDays.map((day) => {
              const displayItems = getDisplayItemsForDay(day);
              const hasItems = displayItems.length > 0;
              return (
                <div key={day.toISOString()} className="min-w-[140px] flex flex-col gap-2">
                  <div className="text-center pb-2 border-b border-border">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {format(day, "EEE")}
                    </p>
                    <p className="text-sm font-semibold text-foreground">{format(day, "MMM d")}</p>
                    <div className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {displayItems.length}
                          </div>
                        </div>
                  <div className="space-y-2 flex-1">
                    {!hasItems ? (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 py-8 px-2 flex items-center justify-center min-h-[120px]">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Quiet Day
                              </p>
                            </div>
                    ) : (
                      <>
                        {displayItems.map((item) =>
                          item.type === "slot" ? (
                            <div key={item.slot.id} className="rounded-xl border border-primary/20 bg-primary/5 p-2.5">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-primary">
                                  {item.slot.start_time.slice(0, 5)}–{item.slot.end_time.slice(0, 5)}
                            </span>
                                <span className="text-[10px] text-muted-foreground">Available</span>
                          </div>
                            </div>
                          ) : (
                            <div
                              key={item.apt.id}
                              className={`rounded-xl border p-3 space-y-2 shadow-sm ${
                                getDisplayStatus(item.apt) === "completed"
                                  ? "border-muted-foreground/20 bg-muted/30 opacity-30"
                                  : "border-border bg-card"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`text-xs font-bold ${
                                    getDisplayStatus(item.apt) === "completed"
                                      ? "text-muted-foreground"
                                      : "text-foreground"
                                  }`}
                                >
                                  {IST_TIME_FMT.format(parseISO(item.apt.start_time))}
                                </span>
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                    getDisplayStatus(item.apt) === "completed"
                                      ? "bg-muted text-muted-foreground"
                                      : getDisplayStatus(item.apt) === "running"
                                        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                                        : item.apt.status === "confirmed"
                                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  }`}
                                >
                                  {getDisplayStatus(item.apt)}
                                </span>
                              </div>
                              <p
                                className={`text-sm font-bold truncate ${
                                  getDisplayStatus(item.apt) === "completed"
                                    ? "text-muted-foreground"
                                    : "text-foreground"
                                }`}
                              >
                                {item.apt.patient_name}
                              </p>
                              {item.apt.reason && (
                                <p className="text-xs text-muted-foreground italic truncate">
                                  {item.apt.reason}
                                </p>
                              )}
                              <div className="pt-2 flex gap-1 flex-wrap">
                                {getDisplayStatus(item.apt) !== "completed" && (
                                  <>
                                    <Button size="sm" className="flex-1 h-8 text-xs rounded-lg min-w-0" asChild>
                                      <Link href={`/consultation/${item.apt.id}`} className="flex items-center gap-1">
                                        <Video className="h-3 w-3" /> Enter Call
                                      </Link>
                                    </Button>
                                    {getDisplayStatus(item.apt) === "running" && (
                                      <Button
                                        size="sm"
                                        className="h-8 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => void handleMarkComplete(item.apt.id)}
                                        disabled={completingId === item.apt.id}
                                      >
                                        <Check className="h-3 w-3" /> {completingId === item.apt.id ? "..." : "Complete"}
                              </Button>
                                    )}
                                    {getDisplayStatus(item.apt) !== "running" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-8 text-xs rounded-lg min-w-0"
                                        onClick={() => openReschedule(item.apt)}
                                      >
                                        Reschedule
                              </Button>
                                    )}
                                  </>
                                )}
                                {getDisplayStatus(item.apt) === "completed" && (
                                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
              </div>
          </CardContent>
        </Card>
    </div>
  );
}
