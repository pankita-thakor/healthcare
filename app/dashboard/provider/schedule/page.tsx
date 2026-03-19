"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  Edit,
  X,
  Plus,
  List
} from "lucide-react";
import {
  deleteProviderAvailability,
  fetchProviderAvailability,
  setProviderAvailability,
  type ProviderAvailability
} from "@/services/provider/dashboard";
import { showNotification } from "@/components/layout/GlobalNotification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";

export default function ProviderSchedulePage() {
  const [availability, setAvailability] = useState<ProviderAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("17:00");

  async function loadAvailability() {
    setIsLoading(true);
    try {
      const data = await fetchProviderAvailability();
      setAvailability(data);
      if (data) {
        setFormDate(data.available_date);
        setFormStartTime(data.start_time.slice(0, 5));
        setFormEndTime(data.end_time.slice(0, 5));
      }
      if (!data) setIsFormOpen(true);
    } catch (err) {
      showNotification((err as Error).message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAvailability();
  }, []);

  async function handleSave() {
    setIsLoading(true);
    try {
      await setProviderAvailability({
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
      });
      showNotification("Your availability has been saved.", "success");
      await loadAvailability();
      setIsFormOpen(false);
    } catch (err) {
      showNotification((err as Error).message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setIsLoading(true);
    try {
      await deleteProviderAvailability();
      showNotification("Your availability has been cleared.", "success");
      setAvailability(null);
      setIsFormOpen(true);
    } catch (err) {
      showNotification((err as Error).message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  const highlightedDate = availability
    ? parseISO(availability.available_date)
    : null;

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground/90">
          Schedule & Availability
        </h1>
        <p className="text-muted-foreground mt-1 text-base">
          Set your available dates and times. Patients can book appointments within these slots.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
        {/* Left: Add Slot Form + Calendar */}
        <div className="space-y-6">
          {/* Availability Selection Form */}
          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                {isFormOpen ? "Add Availability Slot" : "Availability Selection"}
              </CardTitle>
              <CardDescription>
                {isFormOpen
                  ? "Choose a date and time range when you are available for consultations."
                  : "Click the button below to add or update your availability."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              {isFormOpen ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground">
                        Available Date
                      </label>
                      <Input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="h-12 rounded-xl font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground">
                        Start Time
                      </label>
                      <Input
                        type="time"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                        className="h-12 rounded-xl font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-muted-foreground">
                        End Time
                      </label>
                      <Input
                        type="time"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        className="h-12 rounded-xl font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="h-12 rounded-xl font-black text-sm uppercase tracking-widest"
                    >
                      {isLoading ? "Saving..." : "Save Slot"}
                    </Button>
                    {availability && (
                      <Button
                        variant="outline"
                        onClick={() => setIsFormOpen(false)}
                        className="h-12 rounded-xl font-bold"
                      >
                        <X className="h-4 w-4 mr-2" /> Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setIsFormOpen(true)}
                  className="h-12 rounded-xl font-bold"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add / Update Slot
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Calendar View */}
          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                Calendar View
              </CardTitle>
              <CardDescription>
                Your available date is highlighted below.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 flex flex-col items-center">
              <Calendar
                mode="single"
                selected={highlightedDate ?? undefined}
                onSelect={(date) => {
                  if (date) {
                    setFormDate(format(date, "yyyy-MM-dd"));
                    setIsFormOpen(true);
                  }
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-2xl border border-border/40"
              />
              {!availability && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Add an availability slot above to see it on the calendar.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Slot Listing */}
        <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md ring-1 ring-border/50 rounded-[2.5rem] overflow-hidden h-fit">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <List className="h-5 w-5 text-primary" />
              </div>
              Your Slots
            </CardTitle>
            <CardDescription>
              List of your current availability slots visible to patients.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold text-muted-foreground">Loading...</p>
              </div>
            ) : availability ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-foreground truncate">
                        {format(parseISO(availability.available_date), "EEEE, MMM d, yyyy")}
                      </p>
                      <p className="text-sm font-bold text-muted-foreground">
                        {availability.start_time.slice(0, 5)} – {availability.end_time.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsFormOpen(true);
                        setFormDate(availability.available_date);
                        setFormStartTime(availability.start_time.slice(0, 5));
                        setFormEndTime(availability.end_time.slice(0, 5));
                      }}
                      className="rounded-xl"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isLoading}
                      className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <List className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-bold text-foreground/80 mb-1">No slots yet</p>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                  Add an availability slot using the form on the left.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsFormOpen(true)}
                  className="rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Slot
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
