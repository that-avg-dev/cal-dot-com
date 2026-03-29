"use client"

import { useState, use } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { ArrowLeft, Clock, Calendar as CalendarIcon, CheckCircle } from "lucide-react"
import { fetcher } from "@/lib/fetcher"
import { formatTime } from "@/lib/format"
import type { EventType, Settings, Availability, DateOverride } from "@/lib/db"

export default function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [step, setStep] = useState<"calendar" | "form" | "confirmed">("calendar")
  const [form, setForm] = useState({ name: "", email: "" })
  const [customResponses, setCustomResponses] = useState<Record<string, string>>({})
  const [booking, setBooking] = useState<{ date: string; time: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { data: eventTypes } = useSWR<EventType[]>("/api/event-types", fetcher)
  const { data: settings } = useSWR<Settings>("/api/settings", fetcher)
  const { data: availability } = useSWR<Availability[]>("/api/availability", fetcher)
  const { data: dateOverrides } = useSWR<DateOverride[]>("/api/date-overrides", fetcher)

  const event = eventTypes?.find((e) => e.slug === slug && e.is_active)

  // Build a set of unavailable weekdays (0=Sun, 6=Sat)
  const unavailableDays = new Set<number>()
  if (availability) {
    availability.forEach((a) => {
      if (!a.is_available) unavailableDays.add(a.day_of_week)
    })
  }

  // Build a set of blocked dates from date overrides
  const blockedDates = new Set<string>()
  if (dateOverrides) {
    dateOverrides.forEach((o) => {
      if (!o.is_available) {
        const d = new Date(o.override_date)
        blockedDates.add(
          `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
        )
      }
    })
  }

  const isDateDisabled = (date: Date) => {
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true
    if (unavailableDays.has(date.getDay())) return true
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    if (blockedDates.has(dateKey)) return true
    return false
  }

  const dateStr = selectedDate?.toISOString().split("T")[0]
  const { data: slots, isLoading: loadingSlots } = useSWR<string[]>(
    dateStr && event
      ? `/api/slots?date=${dateStr}&duration=${event.duration}&event_type_id=${event.id}`
      : null,
    fetcher,
    { revalidateOnFocus: true, revalidateOnMount: true, dedupingInterval: 0 }
  )

  const handleBook = async () => {
    if (!event || !selectedDate || !selectedTime) return
    setSubmitting(true)

    const [hour, min] = selectedTime.split(":").map(Number)
    let endHour = hour
    let endMin = min + event.duration
    if (endMin >= 60) {
      endHour += Math.floor(endMin / 60)
      endMin = endMin % 60
    }
    const endTime = `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`

    // Map response IDs back to their question labels for readable storage
    const mappedResponses: Record<string, string> = {}
    if (event.custom_questions) {
      event.custom_questions.forEach((q) => {
        if (customResponses[q.id]) {
          mappedResponses[q.label] = customResponses[q.id]
        }
      })
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type_id: event.id,
          booker_name: form.name,
          booker_email: form.email,
          booking_date: dateStr,
          start_time: selectedTime,
          end_time: endTime,
          custom_responses: mappedResponses,
        }),
      })

      if (res.ok) {
        setBooking({ date: dateStr!, time: selectedTime })
        setStep("confirmed")
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!eventTypes) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-semibold mb-2">Event Not Found</h1>
            <p className="text-muted-foreground">
              This event type does not exist or is not available.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "confirmed" && booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground mb-6">Your meeting has been scheduled.</p>
            <div className="bg-muted rounded-lg p-4 text-left space-y-2">
              <p>
                <strong>Event:</strong> {event.title}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(booking.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p>
                <strong>Time:</strong> {formatTime(booking.time)}
              </p>
              <p>
                <strong>Duration:</strong> {event.duration} minutes
              </p>
              <p>
                <strong>Host:</strong> {settings?.user_name}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-0">
            <div className="grid md:grid-cols-[300px_1fr]">
              {/* Left Panel - Event Info */}
              <div className="p-6 border-b md:border-b-0 md:border-r border-border">
                <p className="text-sm text-muted-foreground mb-1">{settings?.user_name}</p>
                <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Clock className="w-4 h-4" />
                  <span>{event.duration} min</span>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                )}
                {selectedDate && step === "form" && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        {selectedDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(selectedTime!)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel - Calendar/Form */}
              <div className="p-6">
                {step === "calendar" && (
                  <div className="flex flex-col md:flex-row gap-6">
                    <div>
                      <h2 className="font-semibold mb-4">Select a Date</h2>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date)
                          setSelectedTime(null)
                        }}
                        disabled={isDateDisabled}
                        className="rounded-md border"
                      />
                    </div>
                    {selectedDate && (
                      <div className="flex-1">
                        <h2 className="font-semibold mb-4">
                          {selectedDate.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </h2>
                        {loadingSlots ? (
                          <div className="space-y-2">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className="h-10 bg-muted rounded animate-pulse"
                              />
                            ))}
                          </div>
                        ) : !slots || slots.length === 0 ? (
                          <p className="text-muted-foreground text-sm">
                            No available times on this day.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                            {slots.map((time) => (
                              <Button
                                key={time}
                                variant={selectedTime === time ? "default" : "outline"}
                                className="justify-center"
                                onClick={() => setSelectedTime(time)}
                              >
                                {formatTime(time)}
                              </Button>
                            ))}
                          </div>
                        )}
                        {selectedTime && (
                          <Button className="w-full mt-4" onClick={() => setStep("form")}>
                            Continue
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {step === "form" && (
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep("calendar")}
                      className="mb-4"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <h2 className="font-semibold mb-4">Enter your details</h2>
                    <FieldGroup>
                      <Field>
                        <FieldLabel>Your Name</FieldLabel>
                        <Input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Email Address</FieldLabel>
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="john@example.com"
                        />
                      </Field>
                      {event.custom_questions &&
                        event.custom_questions.map((q) => (
                          <Field key={q.id}>
                            <FieldLabel>
                              {q.label}{" "}
                              {q.required && (
                                <span className="text-destructive">*</span>
                              )}
                            </FieldLabel>
                            <Input
                              value={customResponses[q.id] || ""}
                              onChange={(e) =>
                                setCustomResponses({
                                  ...customResponses,
                                  [q.id]: e.target.value,
                                })
                              }
                              required={q.required}
                            />
                          </Field>
                        ))}
                      <Button
                        onClick={handleBook}
                        disabled={
                          submitting ||
                          !form.name ||
                          !form.email ||
                          (event.custom_questions || []).some(
                            (q) => q.required && !customResponses[q.id]
                          )
                        }
                        className="w-full"
                      >
                        {submitting ? "Booking..." : "Confirm Booking"}
                      </Button>
                    </FieldGroup>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
