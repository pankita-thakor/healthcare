"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import {
  deleteAvailability,
  fetchAvailability,
  fetchProviderAppointments,
  rescheduleAppointment,
  saveAvailability,
  updateAvailability,
  type ProviderAppointment,
  type ProviderAvailabilitySlot
} from "@/services/provider/dashboard";
import { showNotification } from "@/components/layout/GlobalNotification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const weekdayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function slotMatch(a: ProviderAvailabilitySlot, b: ProviderAvailabilitySlot) {
  const sameTime = a.start_time === b.start_time && a.end_time === b.end_time;
  const sameDate = a.specific_date
    ? a.specific_date === b.specific_date
    : !b.specific_date && a.day_of_week === b.day_of_week;
  return sameTime && sameDate;
}

function mergeAvailabilitySlots(
  current: ProviderAvailabilitySlot[],
  next: ProviderAvailabilitySlot
) {
  const deduped = current.filter((slot) => !slotMatch(slot, next));
  deduped.push(next);
  return deduped.sort((a, b) => {
    const aKey = a.specific_date ?? String(a.day_of_week);
    const bKey = b.specific_date ?? String(b.day_of_week);
    if (aKey !== bKey) return aKey.localeCompare(bKey);
    return a.start_time.localeCompare(b.start_time);
  });
}

function removeAvailabilitySlot(current: ProviderAvailabilitySlot[], target: ProviderAvailabilitySlot) {
  return current.filter((slot) => !slotMatch(slot, target));
}

function buildUpcomingDates(slot: ProviderAvailabilitySlot) {
  const now = new Date();
  if (slot.specific_date) {
    const d = new Date(slot.specific_date);
    const [hours, minutes] = slot.start_time.slice(0, 5).split(":").map(Number);
    d.setHours(hours, minutes, 0, 0);
    if (d >= now) return [d.toLocaleString([], { dateStyle: "short", timeStyle: "short", hour12: false })];
    return [];
  }
  const results: string[] = [];
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);
  for (let offset = 0; offset < 21 && results.length < 3; offset += 1) {
    const current = new Date(base);
    current.setDate(base.getDate() + offset);
    if (current.getDay() !== slot.day_of_week) continue;
    const [hours, minutes] = slot.start_time.slice(0, 5).split(":").map(Number);
    current.setHours(hours, minutes, 0, 0);
    if (current < now) continue;
    results.push(current.toLocaleString([], { dateStyle: "short", timeStyle: "short", hour12: false }));
  }
  return results;
}

function slotDisplayLabel(slot: ProviderAvailabilitySlot) {
  if (slot.specific_date) {
    return new Date(slot.specific_date).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }
  return weekdayLabels[slot.day_of_week];
}

function buildCalendarDays(
  appointments: ProviderAppointment[],
  availability: ProviderAvailabilitySlot[],
  startDateOffset = 0
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const base = new Date(today);
  base.setDate(today.getDate() + startDateOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(base);
    day.setDate(base.getDate() + index);
    
    // Format local date key: YYYY-MM-DD
    const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    const now = new Date();

    const availabilitySlots = availability
      .filter((slot) => {
        if (slot.is_active === false) return false;
        if (slot.specific_date) return slot.specific_date === dayKey;
        return slot.day_of_week === day.getDay();
      })
      .map((slot, slotIndex) => {
        const [startHours, startMinutes] = slot.start_time.slice(0, 5).split(":").map(Number);
        const [endHours, endMinutes] = slot.end_time.slice(0, 5).split(":").map(Number);

        const start = new Date(day);
        start.setHours(startHours, startMinutes, 0, 0);

        const end = new Date(day);
        end.setHours(endHours, endMinutes, 0, 0);

        return {
          id: `${slot.id}-${dayKey}-${slotIndex}`,
          start,
          end,
          startLabel: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
          endLabel: end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
        };
      })
      .filter((slot) => slot.end > now)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    return {
      dateKey: dayKey,
      label: day.toLocaleDateString([], { weekday: "short" }),
      dateText: day.toLocaleDateString([], { month: "short", day: "numeric" }),
      appointments: appointments
        .filter((appointment) => {
          const apptDate = new Date(appointment.start_time);
          const apptKey = `${apptDate.getFullYear()}-${String(apptDate.getMonth() + 1).padStart(2, "0")}-${String(apptDate.getDate()).padStart(2, "0")}`;
          return apptKey === dayKey;
        })
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
      availabilitySlots
    };
  });
}

function statusClasses(status: string) {
  if (status === "confirmed") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
  if (status === "pending") return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  if (status === "completed") return "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300";
  if (status === "cancelled") return "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300";
  return "bg-muted text-muted-foreground";
}

export default function ProviderSchedulePage() {
  const [appointments, setAppointments] = useState<ProviderAppointment[]>([]);
  const [availability, setAvailability] = useState<ProviderAvailabilitySlot[]>([]);
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const [slot, setSlot] = useState({ date: todayStr, startTime: "09:00", endTime: "17:00" });
  const [rescheduleMap, setRescheduleMap] = useState<Record<string, string>>({});
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState({ date: todayStr, startTime: "09:00", endTime: "17:00" });
  const [slotPendingDelete, setSlotPendingDelete] = useState<ProviderAvailabilitySlot | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [calendarOffset, setCalendarOffset] = useState(0);

  async function load() {
    const [appointmentsResult, availabilityResult] = await Promise.allSettled([
      fetchProviderAppointments(),
      fetchAvailability()
    ]);

    if (appointmentsResult.status === "fulfilled") {
      setAppointments(appointmentsResult.value);
    } else {
      setAppointments([]);
    }

    if (availabilityResult.status === "fulfilled") {
      setAvailability(availabilityResult.value);
    } else {
      setAvailability([]);
    }

    if (appointmentsResult.status === "rejected" && availabilityResult.status === "rejected") {
      showNotification((availabilityResult.reason as Error).message, "error");
    } else if (appointmentsResult.status === "rejected") {
      showNotification((appointmentsResult.reason as Error).message, "error");
    } else if (availabilityResult.status === "rejected") {
      showNotification((availabilityResult.reason as Error).message, "error");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!slotPendingDelete) return;

    const timer = window.setTimeout(() => {
      setIsDeleteModalVisible(true);
    }, 10);

    return () => window.clearTimeout(timer);
  }, [slotPendingDelete]);

  async function onSaveAvailability(e: React.FormEvent) {
    e.preventDefault();
    try {
      const nextSlot: ProviderAvailabilitySlot = {
        id: `${slot.date}-${slot.startTime}-${slot.endTime}`,
        day_of_week: new Date(slot.date).getDay(),
        start_time: slot.startTime,
        end_time: slot.endTime,
        is_active: true,
        specific_date: slot.date
      };

      await saveAvailability({
        specificDate: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime
      });
      setAvailability((prev) => mergeAvailabilitySlots(prev, nextSlot));
      showNotification("Availability slot saved for the selected date.");
    } catch (err) {
      showNotification((err as Error).message, "error");
    }
  }

  async function onReschedule(appointmentId: string) {
    const value = rescheduleMap[appointmentId];
    if (!value) return;

    try {
      const start = new Date(value);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      await rescheduleAppointment(appointmentId, start.toISOString(), end.toISOString());
      
      // Clear the input after success
      setRescheduleMap((prev) => {
        const next = { ...prev };
        delete next[appointmentId];
        return next;
      });
      
      await load();
      showNotification("Appointment successfully rescheduled and patient notified.");
    } catch (err) {
      showNotification((err as Error).message, "error");
    }
  }

  function startEditingAvailability(item: ProviderAvailabilitySlot) {
    setEditingSlotId(item.id);
    const dateStr = item.specific_date
      ? item.specific_date
      : (() => {
          const d = new Date();
          const next = new Date(d);
          for (let i = 0; i < 7; i++) {
            next.setDate(d.getDate() + i);
            if (next.getDay() === item.day_of_week) {
              return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
            }
          }
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        })();
    setEditingSlot({
      date: dateStr,
      startTime: item.start_time.slice(0, 5),
      endTime: item.end_time.slice(0, 5)
    });
  }

  async function onUpdateAvailability(item: ProviderAvailabilitySlot) {
    const nextSlot: ProviderAvailabilitySlot = {
      id: `${editingSlot.date}-${editingSlot.startTime}-${editingSlot.endTime}`,
      day_of_week: new Date(editingSlot.date).getDay(),
      start_time: editingSlot.startTime,
      end_time: editingSlot.endTime,
      is_active: true,
      specific_date: editingSlot.date
    };

    try {
      await updateAvailability({
        originalSpecificDate: item.specific_date,
        originalDayOfWeek: item.day_of_week,
        originalStartTime: item.start_time,
        originalEndTime: item.end_time,
        specificDate: editingSlot.date,
        startTime: nextSlot.start_time,
        endTime: nextSlot.end_time
      });

      setAvailability((prev) => mergeAvailabilitySlots(removeAvailabilitySlot(prev, item), nextSlot));
      setEditingSlotId(null);
      showNotification("Availability slot updated successfully.");
    } catch (err) {
      showNotification((err as Error).message, "error");
    }
  }

  async function onDeleteAvailability(item: ProviderAvailabilitySlot) {
    try {
      await deleteAvailability({
        specificDate: item.specific_date,
        dayOfWeek: item.day_of_week,
        startTime: item.start_time,
        endTime: item.end_time
      });

      setAvailability((prev) => removeAvailabilitySlot(prev, item));
      if (editingSlotId === item.id) {
        setEditingSlotId(null);
      }
      closeDeleteModal();
      showNotification("Availability slot deleted.");
    } catch (err) {
      showNotification((err as Error).message, "error");
    }
  }

  function closeDeleteModal() {
    setIsDeleteModalVisible(false);
    window.setTimeout(() => {
      setSlotPendingDelete(null);
    }, 220);
  }

  const calendarDays = buildCalendarDays(appointments, availability, calendarOffset);

  const calendarStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() + calendarOffset);
    return d;
  })();
  const calendarEnd = new Date(calendarStart);
  calendarEnd.setDate(calendarEnd.getDate() + 6);
  const dateRangeLabel =
    calendarOffset === 0
      ? "This week"
      : calendarOffset < 0
        ? `${calendarStart.toLocaleDateString([], { month: "short", day: "numeric" })} – ${calendarEnd.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`
        : `${calendarStart.toLocaleDateString([], { month: "short", day: "numeric" })} – ${calendarEnd.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Appointment Scheduler</h1>
      </div>

      {/* Top row: Weekly Availability form + Active Recurring Slots side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-fit shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase tracking-tight">Add Availability</CardTitle>
            <p className="text-xs text-muted-foreground font-normal">Set consultation hours for a specific date</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSaveAvailability} className="space-y-3">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">Date</label>
                <Input
                  type="date"
                  className="h-12 rounded-xl border border-input bg-background/50 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                  value={slot.date}
                  onChange={(e) => setSlot((prev) => ({ ...prev, date: e.target.value }))}
                />
                {slot.date && (
                  <p className="text-xs font-medium text-sky-700 dark:text-sky-300">
                    {weekdayLabels[new Date(slot.date).getDay()]}, {new Date(slot.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">Start time</label>
                  <Input type="time" className="rounded-xl bg-background/50 h-12" value={slot.startTime} onChange={(e) => setSlot((prev) => ({ ...prev, startTime: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 ml-1">End time</label>
                  <Input type="time" className="rounded-xl bg-background/50 h-12" value={slot.endTime} onChange={(e) => setSlot((prev) => ({ ...prev, endTime: e.target.value }))} />
                </div>
              </div>
              
              <Button type="submit" className="w-full rounded-xl shadow-lg shadow-primary/20 h-12 font-black text-xs uppercase tracking-widest">Save Availability Slot</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase tracking-tight">Your Availability Slots</CardTitle>
            <p className="text-xs text-muted-foreground font-normal">Date-specific and recurring consultation hours</p>
          </CardHeader>
          <CardContent>
            {!availability.length && <p className="text-sm text-muted-foreground italic px-1">No availability slots saved yet.</p>}
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 scrollbar-hide">
                {availability.map((item) => (
                  <div
                    key={item.id}
                    className="relative overflow-hidden rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-500/[0.10] via-background to-cyan-400/[0.08] p-3 shadow-sm transition-all hover:border-sky-500/35 hover:shadow-md"
                  >
                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-500 to-cyan-400" />
                    <div className="flex items-center gap-2 pl-2">
                      <p className="min-w-0 flex-1 truncate font-bold text-sm text-foreground">
                        {slotDisplayLabel(item)}
                      </p>
                      <span className="shrink-0 rounded-lg border border-sky-500/25 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700 dark:text-sky-300">
                        {item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)}
                      </span>
                      {editingSlotId !== item.id && (
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-sky-700 hover:bg-sky-500/15 hover:text-sky-800 dark:text-sky-300"
                            onClick={() => startEditingAvailability(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/15"
                            onClick={() => setSlotPendingDelete(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {editingSlotId === item.id ? (
                      <div className="mt-3 space-y-2 rounded-lg border border-sky-500/15 bg-background/80 p-2.5 backdrop-blur-sm">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Date</label>
                          <Input
                            type="date"
                            className="h-10 rounded-lg border border-sky-500/20 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/20"
                            value={editingSlot.date}
                            onChange={(e) => setEditingSlot((prev) => ({ ...prev, date: e.target.value }))}
                          />
                          {editingSlot.date && (
                            <p className="text-[11px] font-medium text-sky-700 dark:text-sky-300">
                              {weekdayLabels[new Date(editingSlot.date).getDay()]}, {new Date(editingSlot.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="time"
                            className="rounded-lg h-9 border-sky-500/20 bg-background text-sm"
                            value={editingSlot.startTime}
                            onChange={(e) => setEditingSlot((prev) => ({ ...prev, startTime: e.target.value }))}
                          />
                          <Input
                            type="time"
                            className="rounded-lg h-9 border-sky-500/20 bg-background text-sm"
                            value={editingSlot.endTime}
                            onChange={(e) => setEditingSlot((prev) => ({ ...prev, endTime: e.target.value }))}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" className="flex-1 rounded-lg text-[11px] font-bold" onClick={() => onUpdateAvailability(item)}>
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="flex-1 rounded-lg text-[11px] font-bold"
                            onClick={() => setEditingSlotId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full-width calendar below */}
      <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg font-black uppercase tracking-tight">Appointments Calendar</CardTitle>
              <p className="text-xs text-muted-foreground font-normal">{dateRangeLabel}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl gap-1.5 px-3 font-bold"
                onClick={() => setCalendarOffset((o) => o - 7)}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl gap-1.5 px-3 font-bold"
                onClick={() => setCalendarOffset((o) => o + 7)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 rounded-xl px-3 text-xs font-bold text-muted-foreground hover:text-foreground"
                onClick={() => setCalendarOffset(0)}
              >
                Today
              </Button>
              <div className="hidden sm:flex gap-1.5 ml-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <div className="h-2 w-2 rounded-full bg-primary/40"></div>
                <div className="h-2 w-2 rounded-full bg-muted"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {appointments.length === 0 && availability.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center mb-4 text-muted-foreground/40">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>
                </div>
                <p className="text-sm font-semibold text-muted-foreground">Your schedule is currently clear.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Add availability slots to allow patients to book appointments.</p>
              </div>
            )}

            {!!calendarDays.length && (
              <div className="flex flex-col sm:flex-row gap-4 overflow-x-auto pb-4 px-4 sm:px-0 snap-x scrollbar-hide">
                {calendarDays.map((day) => (
                  <div key={day.dateKey} className="min-w-[280px] sm:min-w-[300px] flex-1 snap-start flex flex-col group">
                    <div className="mb-4 flex items-center justify-between px-1">
                      <div>
                        <p className="font-bold text-base group-hover:text-primary transition-colors">{day.label}</p>
                        <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">{day.dateText}</p>
                      </div>
                      <span className="h-8 w-8 rounded-full bg-muted/20 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        {day.appointments.length + day.availabilitySlots.length}
                      </span>
                    </div>

                    <div className="space-y-4 flex-grow rounded-2xl bg-muted/10 p-4 border border-transparent hover:border-border/60 hover:bg-muted/20 transition-all duration-300">
                      {day.availabilitySlots.length === 0 && day.appointments.length === 0 && (
                        <div className="flex items-center justify-center h-20 border border-dashed rounded-xl border-muted-foreground/20">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/40 italic">Quiet Day</p>
                        </div>
                      )}

                      {day.availabilitySlots.map((slotItem) => (
                        <div
                          key={slotItem.id}
                          className="relative group/slot overflow-hidden rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-500/[0.12] via-background to-cyan-400/[0.08] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-500/35 hover:shadow-md"
                        >
                          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-500 to-cyan-400" />
                          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full border border-sky-500/20 bg-background/80 px-2 py-1 backdrop-blur">
                             <div className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse"></div>
                             <span className="text-[9px] font-black uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">Open</span>
                          </div>
                          <div className="flex flex-col gap-1 pl-2">
                            <p className="text-sm font-black text-sky-700 dark:text-sky-300 tracking-tight">
                              {slotItem.startLabel} - {slotItem.endLabel}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700/70 dark:text-sky-300/70">Available Slot</p>
                          </div>
                        </div>
                      ))}

                      {day.appointments.map((appointment) => (
                        <div key={appointment.id} className="rounded-xl border bg-background p-4 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-emerald-500">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="space-y-1">
                              <p className="text-sm font-black tracking-tight text-foreground/90">
                                {new Date(appointment.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                              </p>
                              <p className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-default">
                                {appointment.patient_name ?? "Patient"}
                              </p>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest shadow-sm ${statusClasses(appointment.status)}`}>
                              {appointment.status}
                            </span>
                          </div>

                          <div className="bg-muted/30 rounded-lg p-2.5 mb-4">
                            <p className="text-[10px] leading-relaxed text-muted-foreground font-medium italic">
                              &quot;{appointment.reason ?? 'Initial consultation regarding general wellness and follow-up.'}&quot;
                            </p>
                          </div>

                          <div className="pt-3 border-t border-border/40 space-y-3">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-0.5">Quick Reschedule</label>
                              <Input
                                type="datetime-local"
                                className="rounded-xl bg-muted/20 border-none h-9 text-xs font-medium focus-visible:ring-1 focus-visible:ring-primary/30"
                                value={rescheduleMap[appointment.id] ?? ""}
                                onChange={(e) => setRescheduleMap((prev) => ({ ...prev, [appointment.id]: e.target.value }))}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="flex-1 h-9 text-[11px] font-bold rounded-xl hover:bg-primary/5 hover:text-primary transition-colors border border-transparent hover:border-primary/20"
                                onClick={() => onReschedule(appointment.id)}
                              >
                                Update
                              </Button>
                              <Button asChild size="sm" className="flex-1 h-9 text-[11px] font-bold rounded-xl shadow-lg shadow-primary/10">
                                <Link href={`/consultation/${appointment.id}`}>Enter Call</Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      {slotPendingDelete ? (() => {
        const item = slotPendingDelete as ProviderAvailabilitySlot;
        return (
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm transition-all duration-200 ${
              isDeleteModalVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className={`w-full max-w-md rounded-[1.75rem] border border-border/60 bg-background p-6 shadow-2xl transition-all duration-200 ${
                isDeleteModalVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
              }`}
            >
              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-destructive">Confirm Delete</p>
                <h2 className="text-xl font-black tracking-tight text-foreground">Delete recurring availability slot?</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  This will remove the slot for {slotDisplayLabel(item)} from {item.start_time.slice(0, 5)} to {item.end_time.slice(0, 5)}.
                </p>
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={closeDeleteModal}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1 rounded-xl"
                  onClick={() => void onDeleteAvailability(item)}
                >
                  Delete Slot
                </Button>
              </div>
            </div>
          </div>
        );
      })() : null}
    </div>
  );
}
