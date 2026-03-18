"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2, Calendar as CalendarIcon, Check, CheckCircle2, List, Loader2 } from "lucide-react";
import { format, parseISO, startOfDay, addDays } from "date-fns";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const weekdayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});

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
    const dayKey = format(day, "yyyy-MM-dd");
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
      label: format(day, "EEE"),
      dateText: format(day, "MMM d"),
      appointments: appointments
        .filter((appointment) => {
          const apptDate = new Date(appointment.start_time);
          const apptKey = format(apptDate, "yyyy-MM-dd");
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

function TimeSelector({ value, onChange, label }: { value: string, onChange: (v: string) => void, label: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full h-12 rounded-xl justify-between px-4 bg-background/50 border-border/40 hover:border-primary/30 transition-all">
            <span className="font-medium">{value}</span>
            <ChevronLeft className="h-4 w-4 -rotate-90 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[180px] p-0" align="start">
          <div className="max-h-[200px] overflow-y-auto py-1 custom-scrollbar">
            {TIME_SLOTS.map((time) => (
              <button
                key={time}
                onClick={() => onChange(time)}
                className={cn(
                  "w-full px-4 py-2 text-sm text-left hover:bg-primary/10 flex items-center justify-between transition-colors",
                  value === time && "bg-primary/5 text-primary font-bold"
                )}
              >
                {time}
                {value === time && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function ProviderSchedulePage() {
  const [appointments, setAppointments] = useState<ProviderAppointment[]>([]);
  const [availability, setAvailability] = useState<ProviderAvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  
  const [rescheduleMap, setRescheduleMap] = useState<Record<string, string>>({});
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState({ date: format(new Date(), "yyyy-MM-dd"), startTime: "09:00", endTime: "17:00" });
  const [slotPendingDelete, setSlotPendingDelete] = useState<ProviderAvailabilitySlot | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [enteringCallId, setEnteringCallId] = useState<string | null>(null);
  const router = useRouter();

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
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    try {
      const nextSlot: ProviderAvailabilitySlot = {
        id: `${dateStr}-${startTime}-${endTime}`,
        day_of_week: selectedDate.getDay(),
        start_time: startTime,
        end_time: endTime,
        is_active: true,
        specific_date: dateStr
      };

      await saveAvailability({
        specificDate: dateStr,
        startTime: startTime,
        endTime: endTime
      });
      setAvailability((prev) => mergeAvailabilitySlots(prev, nextSlot));
      // Navigate calendar to the week containing the new slot so it appears in view
      const today = startOfDay(new Date());
      const selected = startOfDay(selectedDate);
      const diffMs = selected.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      setCalendarOffset(diffDays);
      await load(); // Refetch to keep listing, calendar, and backend in sync
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
      : format(addDays(startOfDay(new Date()), (item.day_of_week - new Date().getDay() + 7) % 7), "yyyy-MM-dd");
      
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

  const calendarStart = addDays(new Date(), calendarOffset);
  const calendarEnd = addDays(calendarStart, 6);
  
  const dateRangeLabel =
    calendarOffset === 0
      ? "This week"
      : `${format(calendarStart, "MMM d")} – ${format(calendarEnd, "MMM d, yyyy")}`;

  return (
    <div className="space-y-10 pb-10  animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Appointment Scheduler</h1>
        <p className="text-muted-foreground mt-1 text-base">Manage your availability and upcoming consultations.</p>
      </div>

      {/* Compact sync stats bar */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 rounded-2xl bg-primary/5 border border-primary/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-black uppercase tracking-tight leading-tight">Your practice is <span className="text-primary">fully synchronized.</span></h3>
            <p className="text-xs text-muted-foreground mt-0.5">Updates reflected in real-time for patients.</p>
          </div>
        </div>
        <div className="flex gap-4 ml-auto">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background/80 border border-border/40">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Today</span>
            <span className="text-lg font-black text-primary">{appointments.length}</span>
            <span className="text-xs font-bold text-muted-foreground uppercase">Visits</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background/80 border border-border/40">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Active</span>
            <span className="text-lg font-black text-emerald-600">{availability.length}</span>
            <span className="text-xs font-bold text-muted-foreground uppercase">Slots</span>
          </div>
        </div>
      </div>

      {/* Add Availability (70%) + Active Slots (30%) side by side; Active Slots min 420px to avoid wrapping */}
      <div className="flex flex-wrap gap-6">
        <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden flex-[7] min-w-0">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                Add Availability
              </CardTitle>
              <CardDescription>Select a date and time range for consultations.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <form onSubmit={onSaveAvailability} className="space-y-6">
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Select Date</label>
                    <Input
                      type="date"
                      value={format(selectedDate, "yyyy-MM-dd")}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) setSelectedDate(new Date(val + "T12:00:00"));
                      }}
                      className="h-12 rounded-xl bg-background/50 border-border/40 focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <TimeSelector label="Start Time" value={startTime} onChange={setStartTime} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <TimeSelector label="End Time" value={endTime} onChange={setEndTime} />
                  </div>
                </div>
                
                <Button type="submit" className="w-full rounded-[1.25rem] shadow-xl h-14 font-black text-xs uppercase tracking-widest transition-all">
                  Save Availability Slot
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden flex-[3] min-w-[420px]">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <List className="h-5 w-5 text-primary" />
                </div>
                Active Slots
              </CardTitle>
              <CardDescription>Your configured hours.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-2">
              {!availability.length && <p className="text-sm text-muted-foreground italic">No availability slots saved yet.</p>}
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {availability.map((item) => (
                    <div
                      key={item.id}
                      className="group relative overflow-hidden rounded-[1.5rem] border border-border/40 bg-background/40 p-4 transition-all hover:bg-background hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <p className="font-bold text-sm text-foreground/90 truncate">
                            {slotDisplayLabel(item)}
                          </p>
                          <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/5 text-xs font-black uppercase tracking-wider text-primary py-0.5 shrink-0">
                            {item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
                            onClick={() => startEditingAvailability(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                            onClick={() => setSlotPendingDelete(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
      </div>

      <Card className="w-full border-none shadow-2xl bg-card/60 backdrop-blur-md ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0">
            <div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Appointments Calendar</CardTitle>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">{dateRangeLabel}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-muted/30 p-1 rounded-xl ring-1 ring-border/50">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  onClick={() => setCalendarOffset((o) => o - 7)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  onClick={() => setCalendarOffset((o) => o + 7)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl px-6 font-black text-xs uppercase tracking-widest border-border/40 hover:bg-primary hover:text-white transition-all"
                onClick={() => setCalendarOffset(0)}
              >
                Today
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-8 sm:pt-0">
            {appointments.length === 0 && availability.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <div className="h-20 w-20 rounded-[2rem] bg-muted/20 flex items-center justify-center mb-6 text-muted-foreground/40">
                  <CalendarIcon className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-bold text-foreground/80">Your schedule is clear</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">Add availability slots to allow patients to book appointments.</p>
              </div>
            )}

            {!!calendarDays.length && (
              <div className="flex flex-col sm:flex-row gap-6 overflow-x-auto pb-8 snap-x custom-scrollbar">
                {calendarDays.map((day) => (
                  <div key={day.dateKey} className="min-w-[300px] flex-1 snap-start flex flex-col group">
                    <div className="mb-6 flex items-center justify-between px-2">
                      <div className="space-y-1">
                        <p className="font-black text-lg group-hover:text-primary transition-colors tracking-tight uppercase">{day.label}</p>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{day.dateText}</p>
                      </div>
                      <Badge variant="secondary" className="h-8 px-3 rounded-xl font-bold text-xs">
                        {day.appointments.length + day.availabilitySlots.length}
                      </Badge>
                    </div>

                    <div className="space-y-4 flex-grow rounded-[2rem] bg-muted/20 p-5 ring-1 ring-border/50 group-hover:bg-muted/30 transition-all duration-500">
                      {day.availabilitySlots.length === 0 && day.appointments.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-[1.5rem] border-muted-foreground/10">
                          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/30">Quiet Day</p>
                        </div>
                      )}

                      {day.availabilitySlots.map((slotItem) => (
                        <div
                          key={slotItem.id}
                          className="relative group/slot overflow-hidden rounded-[1.5rem] border border-primary/10 bg-background/60 p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
                        >
                          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-primary/40 to-primary" />
                          <div className="flex flex-col gap-1 pl-2">
                            <div className="flex items-center justify-between mb-1">
                               <p className="text-sm font-black text-primary tracking-tight">
                                {slotItem.startLabel} - {slotItem.endLabel}
                              </p>
                              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Available Slot</p>
                          </div>
                        </div>
                      ))}

                      {day.appointments.map((appointment) => (
                        <div key={appointment.id} className="rounded-[1.5rem] border border-border/40 bg-background p-5 shadow-sm hover:shadow-xl transition-all duration-500 group/appt">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="space-y-1.5">
                              <p className="text-sm font-black tracking-tight text-foreground/90">
                                {format(new Date(appointment.start_time), "HH:mm")}
                              </p>
                              <p className="text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
                                {appointment.patient_name ?? "Patient"}
                              </p>
                            </div>
                            <span className={cn(
                              "rounded-lg px-2.5 py-1 text-xs font-black uppercase tracking-widest shadow-sm",
                              statusClasses(appointment.status)
                            )}>
                              {appointment.status}
                            </span>
                          </div>

                          <div className="bg-muted/30 rounded-xl p-3 mb-5 group-hover/appt:bg-primary/5 transition-colors">
                            <p className="text-xs leading-relaxed text-muted-foreground font-medium italic line-clamp-2">
                              &quot;{appointment.reason ?? 'Initial consultation regarding general wellness.'}&quot;
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Quick Reschedule</label>
                              <div className="relative">
                                <Input
                                  type="datetime-local"
                                  className="rounded-xl bg-muted/20 border-none h-10 text-xs font-bold focus-visible:ring-1 focus-visible:ring-primary/30"
                                  value={rescheduleMap[appointment.id] ?? ""}
                                  onChange={(e) => setRescheduleMap((prev) => ({ ...prev, [appointment.id]: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 h-10 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all border-border/40"
                                onClick={() => onReschedule(appointment.id)}
                              >
                                Update
                              </Button>
                              <Button
                                size="sm"
                                className="flex-[1.5] h-10 text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/10"
                                disabled={enteringCallId !== null}
                                onClick={() => {
                                  setEnteringCallId(appointment.id);
                                  router.push(`/consultation/${appointment.id}`);
                                }}
                              >
                                {enteringCallId === appointment.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                ) : (
                                  "Enter Call"
                                )}
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

      {slotPendingDelete ? (
        <div
          className={cn(
            "fixed inset-0 z-[200] flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm transition-all duration-200",
            isDeleteModalVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <div
            className={cn(
              "w-full max-w-md rounded-[2.5rem] border border-border/60 bg-card p-8 shadow-2xl transition-all duration-200",
              isDeleteModalVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
            )}
          >
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                 <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">Delete Slot?</h2>
                <p className="text-sm leading-relaxed text-muted-foreground mt-2">
                  Are you sure you want to remove the availability for <span className="text-foreground font-bold">{slotDisplayLabel(slotPendingDelete)}</span>?
                </p>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-xl font-bold"
                onClick={closeDeleteModal}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1 h-12 rounded-xl font-bold shadow-xl shadow-destructive/20"
                onClick={() => void onDeleteAvailability(slotPendingDelete)}
              >
                Delete Slot
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
