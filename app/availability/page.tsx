"use client"

import { useState, useEffect, useCallback } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Plus, Trash2, Ban, Clock } from "lucide-react"
import { fetcher } from "@/lib/fetcher"
import { formatTimeValue } from "@/lib/format"
import { DAYS, TIMES, TIMEZONES } from "@/lib/constants"
import type { Availability, Settings, DateOverride } from "@/lib/db"

type ScheduleState = {
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

export default function AvailabilityPage() {
  const {
    data: availability,
    isLoading: loadingAvail,
    mutate: mutateAvail,
  } = useSWR<Availability[]>("/api/availability", fetcher)
  const {
    data: settings,
    isLoading: loadingSettings,
    mutate: mutateSettings,
  } = useSWR<Settings>("/api/settings", fetcher)
  const { data: dateOverrides, mutate: mutateOverrides } = useSWR<DateOverride[]>(
    "/api/date-overrides",
    fetcher
  )

  const [schedules, setSchedules] = useState<ScheduleState[]>([])
  const [timezone, setTimezone] = useState("UTC")
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  // Date override dialog state
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [overrideDate, setOverrideDate] = useState<Date | undefined>()
  const [overrideMode, setOverrideMode] = useState<"block" | "custom">("block")
  const [overrideStart, setOverrideStart] = useState("09:00")
  const [overrideEnd, setOverrideEnd] = useState("17:00")

  // Initialize local state ONCE when data first loads
  useEffect(() => {
    if (!dataLoaded && availability && availability.length > 0) {
      const mapped = availability.map((a) => ({
        day_of_week: a.day_of_week,
        start_time: formatTimeValue(a.start_time),
        end_time: formatTimeValue(a.end_time),
        is_available: a.is_available,
      }))
      setSchedules(mapped)
      if (settings?.timezone) {
        setTimezone(settings.timezone)
      }
      setDataLoaded(true)
    }
  }, [availability, settings, dataLoaded])

  const updateSchedule = useCallback(
    (dayOfWeek: number, field: string, value: string | boolean) => {
      setSchedules((prev) =>
        prev.map((s) => (s.day_of_week === dayOfWeek ? { ...s, [field]: value } : s))
      )
      setHasChanges(true)
    },
    []
  )

  const handleTimezoneChange = useCallback((value: string) => {
    setTimezone(value)
    setHasChanges(true)
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules }),
      })
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timezone,
          user_name: settings?.user_name || "User",
          user_email: settings?.user_email || "",
        }),
      })
      await mutateAvail()
      await mutateSettings()
      setHasChanges(false)
      toast.success("Availability saved")
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Failed to save availability")
    } finally {
      setSaving(false)
    }
  }, [schedules, timezone, settings, mutateAvail, mutateSettings])

  const handleAddOverride = useCallback(async () => {
    if (!overrideDate) return
    const dateStr = overrideDate.toISOString().split("T")[0]

    await fetch("/api/date-overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        override_date: dateStr,
        is_available: overrideMode === "custom",
        start_time: overrideMode === "custom" ? overrideStart : null,
        end_time: overrideMode === "custom" ? overrideEnd : null,
      }),
    })
    await mutateOverrides()
    toast.success(overrideMode === "block" ? "Date blocked" : "Custom hours set")
    setOverrideDialogOpen(false)
    setOverrideDate(undefined)
    setOverrideMode("block")
    setOverrideStart("09:00")
    setOverrideEnd("17:00")
  }, [overrideDate, overrideMode, overrideStart, overrideEnd, mutateOverrides])

  const handleDeleteOverride = useCallback(
    async (id: number) => {
      await fetch(`/api/date-overrides/${id}`, { method: "DELETE" })
      await mutateOverrides()
      toast.success("Override removed")
    },
    [mutateOverrides]
  )

  const formatOverrideDate = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    })
  }

  const isLoading = loadingAvail || loadingSettings

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Availability</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Set your weekly hours when you are available for bookings.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="w-full sm:w-auto"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-8 bg-muted rounded w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Timezone</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={timezone} onValueChange={handleTimezoneChange}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Weekly Hours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {schedules.length === 0 ? (
                  <p className="text-muted-foreground py-4">No availability data found.</p>
                ) : (
                  schedules.map((schedule) => (
                    <div
                      key={schedule.day_of_week}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-4 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10">
                          <Switch
                            checked={schedule.is_available}
                            onCheckedChange={(checked) =>
                              updateSchedule(schedule.day_of_week, "is_available", checked)
                            }
                          />
                        </div>
                        <div className="w-28 font-medium text-foreground">
                          {DAYS[schedule.day_of_week]}
                        </div>
                      </div>
                      {schedule.is_available ? (
                        <div className="flex items-center gap-2 pl-13 sm:pl-0">
                          <Select
                            value={schedule.start_time}
                            onValueChange={(v) =>
                              updateSchedule(schedule.day_of_week, "start_time", v)
                            }
                          >
                            <SelectTrigger className="w-24 sm:w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIMES.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-muted-foreground">-</span>
                          <Select
                            value={schedule.end_time}
                            onValueChange={(v) =>
                              updateSchedule(schedule.day_of_week, "end_time", v)
                            }
                          >
                            <SelectTrigger className="w-24 sm:w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIMES.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm pl-13 sm:pl-0">
                          Unavailable
                        </span>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Date Overrides Section */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Date Overrides</CardTitle>
                    <CardDescription className="mt-1">
                      Block specific dates or set custom hours that override your weekly
                      schedule.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOverrideDialogOpen(true)}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Override
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!dateOverrides || dateOverrides.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">
                    No date overrides set. Add one to block a specific date or set custom
                    hours.
                  </p>
                ) : (
                  <div className="space-y-0">
                    {dateOverrides.map((override) => (
                      <div
                        key={override.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-border last:border-0"
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-medium text-sm">
                            {formatOverrideDate(override.override_date)}
                          </span>
                          {override.is_available ? (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeValue(override.start_time || "09:00")} –{" "}
                              {formatTimeValue(override.end_time || "17:00")}
                            </Badge>
                          ) : (
                            <Badge
                              variant="destructive"
                              className="flex items-center gap-1"
                            >
                              <Ban className="w-3 h-3" /> Blocked
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOverride(override.id)}
                          className="shrink-0"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Add Override Dialog */}
        <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Date Override</DialogTitle>
              <DialogDescription>
                Block a specific date or set custom hours.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <FieldLabel className="mb-2 block">Select Date</FieldLabel>
                <Calendar
                  mode="single"
                  selected={overrideDate}
                  onSelect={setOverrideDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border w-fit"
                />
              </div>

              {overrideDate && (
                <>
                  <Field>
                    <FieldLabel>Override Type</FieldLabel>
                    <Select
                      value={overrideMode}
                      onValueChange={(v) => setOverrideMode(v as "block" | "custom")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="block">Block entire day</SelectItem>
                        <SelectItem value="custom">Set custom hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  {overrideMode === "custom" && (
                    <div className="flex items-center gap-2">
                      <Field className="flex-1">
                        <FieldLabel>Start</FieldLabel>
                        <Select value={overrideStart} onValueChange={setOverrideStart}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMES.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <span className="text-muted-foreground mt-6">–</span>
                      <Field className="flex-1">
                        <FieldLabel>End</FieldLabel>
                        <Select value={overrideEnd} onValueChange={setOverrideEnd}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMES.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  )}

                  <Button onClick={handleAddOverride} className="w-full">
                    {overrideMode === "block" ? "Block This Date" : "Set Custom Hours"}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
