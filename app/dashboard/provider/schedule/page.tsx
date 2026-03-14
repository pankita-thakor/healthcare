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
    const dayKey = day.toISOString().slice(0, 10);
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
        .filter((appointment) => appointment.start_time.slice(0, 10) === dayKey)
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
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  async function load() {
    try {
      const [a, avail] = await Promise.all([fetchProviderAppointments(), fetchAvailability()]);
      setAppointments(a);
      setAvailability(avail);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setAvailability([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSaveAvailability(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    setError(null);
    await saveAvailability({
      dayOfWeek: Number(slot.dayOfWeek),
      startTime: slot.startTime,
      endTime: slot.endTime
    });
    await load();
    setStatus("Availability slot saved and synced for patient booking.");
  }

  async function onReschedule(appointmentId: string) {
    const value = rescheduleMap[appointmentId];
    if (!value) return;

    const start = new Date(value);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    await rescheduleAppointment(appointmentId, start.toISOString(), end.toISOString());
    await load();
  }

  const calendarDays = buildCalendarDays(appointments, availability);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Appointment Scheduler</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {status && <p className="text-sm text-emerald-600">{status}</p>}

      <Card>
        <CardHeader><CardTitle>Availability settings</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSaveAvailability} className="grid gap-3 md:grid-cols-4">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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
            <Input type="time" value={slot.startTime} onChange={(e) => setSlot((prev) => ({ ...prev, startTime: e.target.value }))} />
            <Input type="time" value={slot.endTime} onChange={(e) => setSlot((prev) => ({ ...prev, endTime: e.target.value }))} />
            <Button type="submit">Save Slot</Button>
          </form>
          <div className="mt-4 space-y-2 text-sm">
            {!availability.length && <p className="text-muted-foreground">No recurring slots saved yet.</p>}
            {availability.map((item) => (
              <div key={item.id} className="rounded border p-3">
                <p className="font-medium">
                  {weekdayLabels[item.day_of_week]}: {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Patient booking preview: {buildUpcomingDates(item).join(" | ") || "No future occurrences"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Calendar view / appointments</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {appointments.length === 0 && availability.length === 0 && (
            <p className="text-sm text-muted-foreground">No appointments or saved slots yet.</p>
          )}

          {!!calendarDays.length && (
            <div className="grid gap-4 xl:grid-cols-7 md:grid-cols-2">
              {calendarDays.map((day) => (
                <div key={day.dateKey} className="rounded-xl border bg-muted/10 p-3">
                  <div className="mb-3 border-b pb-2">
                    <p className="font-semibold">{day.label}</p>
                    <p className="text-xs text-muted-foreground">{day.dateText}</p>
                  </div>

                  <div className="space-y-3">
                    {day.availabilitySlots.length === 0 && day.appointments.length === 0 && (
                      <p className="text-xs text-muted-foreground">No slots or appointments</p>
                    )}

                    {day.availabilitySlots.map((slotItem) => (
                      <div key={slotItem.id} className="rounded-lg border border-dashed border-sky-200 bg-sky-50/80 p-3 shadow-sm dark:border-sky-900 dark:bg-sky-950/30">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">
                              {slotItem.startLabel} - {slotItem.endLabel}
                            </p>
                            <p className="text-sm text-muted-foreground">Available booking slot</p>
                          </div>
                          <span className="rounded-full bg-sky-100 px-2 py-1 text-[11px] font-medium text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                            Open
                          </span>
                        </div>
                      </div>
                    ))}

                    {day.appointments.map((appointment) => (
                      <div key={appointment.id} className="rounded-lg border bg-background p-3 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">
                              {new Date(appointment.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.patient_name ?? "Patient"}
                            </p>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[11px] font-medium capitalize ${statusClasses(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-muted-foreground">
                          {appointment.reason ?? "No reason shared yet."}
                        </p>

                        <div className="mt-3 space-y-2">
                          <Input
                            type="datetime-local"
                            value={rescheduleMap[appointment.id] ?? ""}
                            onChange={(e) => setRescheduleMap((prev) => ({ ...prev, [appointment.id]: e.target.value }))}
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => onReschedule(appointment.id)}>
                              Reschedule
                            </Button>
                            <Button asChild size="sm">
                              <Link href={`/consultation/${appointment.id}`}>Start</Link>
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
  );
}
