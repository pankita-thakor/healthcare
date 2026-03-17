"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchAvailability,
  fetchProviderAppointments,
  rescheduleAppointment,
  saveAvailability,
  type ProviderAppointment,
  type ProviderAvailabilitySlot
} from "@/services/provider/dashboard";
import { showNotification } from "@/components/layout/GlobalNotification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const weekdayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function buildUpcomingDates(slot: ProviderAvailabilitySlot) {
  const results: string[] = [];
  const now = new Date();
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < 21 && results.length < 3; offset += 1) {
    const current = new Date(base);
    current.setDate(base.getDate() + offset);
    if (current.getDay() !== slot.day_of_week) continue;

    const [hours, minutes] = slot.start_time.slice(0, 5).split(":").map(Number);
    current.setHours(hours, minutes, 0, 0);
    if (current < now) continue;

    results.push(current.toLocaleString());
  }

  return results;
}

function buildCalendarDays(appointments: ProviderAppointment[], availability: ProviderAvailabilitySlot[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() + index);
    
    // Format local date key: YYYY-MM-DD
    const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    const now = new Date();

    const availabilitySlots = availability
      .filter((slot) => slot.day_of_week === day.getDay() && slot.is_active !== false)
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
          startLabel: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          endLabel: end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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
  const [slot, setSlot] = useState({ dayOfWeek: "1", startTime: "09:00", endTime: "17:00" });
  const [rescheduleMap, setRescheduleMap] = useState<Record<string, string>>({});

  async function load() {
    try {
      const [a, avail] = await Promise.all([fetchProviderAppointments(), fetchAvailability()]);
      setAppointments(a);
      setAvailability(avail);
    } catch (err) {
      showNotification((err as Error).message, "error");
      setAvailability([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSaveAvailability(e: React.FormEvent) {
    e.preventDefault();
    try {
      await saveAvailability({
        dayOfWeek: Number(slot.dayOfWeek),
        startTime: slot.startTime,
        endTime: slot.endTime
      });
      await load();
      showNotification("Availability slot saved and synced successfully.");
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

  const calendarDays = buildCalendarDays(appointments, availability);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Appointment Scheduler</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Availability</CardTitle>
            <p className="text-xs text-muted-foreground font-normal">Define your recurring consultation hours</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onSaveAvailability} className="space-y-3">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Day of week</label>
                <select
                  className="w-full h-10 rounded-xl border border-input bg-background/50 px-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  value={slot.dayOfWeek}
                  onChange={(e) => setSlot((prev) => ({ ...prev, dayOfWeek: e.target.value }))}
                >
                  <option value="0">Sunday</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Start time</label>
                  <Input type="time" className="rounded-xl bg-background/50 h-10" value={slot.startTime} onChange={(e) => setSlot((prev) => ({ ...prev, startTime: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">End time</label>
                  <Input type="time" className="rounded-xl bg-background/50 h-10" value={slot.endTime} onChange={(e) => setSlot((prev) => ({ ...prev, endTime: e.target.value }))} />
                </div>
              </div>
              
              <Button type="submit" className="w-full rounded-xl shadow-lg shadow-primary/20 h-11 font-bold">Save Availability Slot</Button>
            </form>

            <div className="pt-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Active Recurring Slots</h3>
              {!availability.length && <p className="text-sm text-muted-foreground italic">No recurring slots saved yet.</p>}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                {availability.map((item) => (
                  <div key={item.id} className="rounded-xl border bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-foreground">
                        {weekdayLabels[item.day_of_week]}
                      </p>
                      <span className="text-[11px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                         {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground font-medium">
                      Next: {buildUpcomingDates(item).slice(0, 2).join(" • ") || "None scheduled"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">Appointments Calendar</CardTitle>
              <p className="text-xs text-muted-foreground font-normal">Manage your upcoming consultations for the next 7 days</p>
            </div>
            <div className="flex gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <div className="h-2 w-2 rounded-full bg-primary/40"></div>
              <div className="h-2 w-2 rounded-full bg-muted"></div>
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
                        <div key={slotItem.id} className="relative group/slot overflow-hidden rounded-xl border border-primary/10 bg-primary/[0.03] p-4 transition-all hover:bg-primary/[0.05] hover:border-primary/20">
                          <div className="absolute top-0 right-0 p-1.5">
                             <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse"></div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-black text-primary/80 tracking-tight">
                              {slotItem.startLabel} - {slotItem.endLabel}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/40">Available Slot</p>
                          </div>
                        </div>
                      ))}

                      {day.appointments.map((appointment) => (
                        <div key={appointment.id} className="rounded-xl border bg-background p-4 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-emerald-500">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="space-y-1">
                              <p className="text-sm font-black tracking-tight text-foreground/90">
                                {new Date(appointment.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                              "{appointment.reason ?? "Initial consultation regarding general wellness and follow-up."}"
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
      </div>
    </div>
  );
}
