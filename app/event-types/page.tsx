"use client"

import { useState, useEffect, useCallback } from "react"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Plus, Copy, Pencil, Trash2, Clock, ExternalLink, Timer } from "lucide-react"
import { fetcher } from "@/lib/fetcher"
import type { EventType } from "@/lib/db"

const EVENT_COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

const initialForm = {
  title: "",
  description: "",
  duration: 30,
  slug: "",
  buffer_before: 0,
  buffer_after: 0,
  custom_questions: [] as { id: string; label: string; required: boolean }[],
}

export default function EventTypesPage() {
  const { data: eventTypes, isLoading } = useSWR<EventType[]>("/api/event-types", fetcher)
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [form, setForm] = useState(initialForm)

  const editingEvent = eventTypes?.find((e) => e.id === editingId)

  useEffect(() => {
    if (editingEvent && dialogMode === "edit") {
      setForm({
        title: editingEvent.title,
        description: editingEvent.description || "",
        duration: editingEvent.duration,
        slug: editingEvent.slug,
        buffer_before: editingEvent.buffer_before || 0,
        buffer_after: editingEvent.buffer_after || 0,
        custom_questions: editingEvent.custom_questions || [],
      })
    }
  }, [editingId, dialogMode, editingEvent])

  const openCreateDialog = useCallback(() => {
    setForm(initialForm)
    setDialogMode("create")
  }, [])

  const openEditDialog = useCallback((event: EventType) => {
    setEditingId(event.id)
    setDialogMode("edit")
  }, [])

  const closeDialog = useCallback(() => {
    setDialogMode(null)
    setEditingId(null)
    setForm(initialForm)
  }, [])

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  }

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const title = e.target.value
      setForm((prev) => ({
        ...prev,
        title,
        slug: dialogMode === "create" ? generateSlug(title) : prev.slug,
      }))
    },
    [dialogMode]
  )

  const handleCreate = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error("Title and slug are required")
      return
    }
    const res = await fetch("/api/event-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success("Event type created")
      mutate("/api/event-types")
      closeDialog()
    } else {
      const data = await res.json()
      toast.error(data.error || "Failed to create event type")
    }
  }

  const handleUpdate = async () => {
    if (!editingEvent) return
    const res = await fetch(`/api/event-types/${editingEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, is_active: editingEvent.is_active }),
    })
    if (res.ok) {
      toast.success("Event type updated")
      mutate("/api/event-types")
      closeDialog()
    } else {
      toast.error("Failed to update event type")
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    await fetch(`/api/event-types/${deletingId}`, { method: "DELETE" })
    toast.success("Event type deleted")
    mutate("/api/event-types")
    setDeletingId(null)
  }

  const toggleActive = async (event: EventType) => {
    await fetch(`/api/event-types/${event.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...event, is_active: !event.is_active }),
    })
    mutate("/api/event-types")
  }

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/book/${slug}`)
    toast.success("Booking link copied to clipboard")
  }

  const addCustomQuestion = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      custom_questions: [
        ...prev.custom_questions,
        { id: `q_${Date.now()}`, label: "", required: false },
      ],
    }))
  }, [])

  const updateCustomQuestion = useCallback(
    (id: string, field: "label" | "required", value: string | boolean) => {
      setForm((prev) => ({
        ...prev,
        custom_questions: prev.custom_questions.map((q) =>
          q.id === id ? { ...q, [field]: value } : q
        ),
      }))
    },
    []
  )

  const removeCustomQuestion = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      custom_questions: prev.custom_questions.filter((q) => q.id !== id),
    }))
  }, [])

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Event Types</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Create events to share for people to book on your calendar.
            </p>
          </div>
          <Button onClick={openCreateDialog} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> New Event Type
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 sm:p-5">
                  <div className="animate-pulse flex items-center gap-4">
                    <div className="w-1.5 h-12 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : eventTypes?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No event types yet. Create your first one!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {eventTypes?.map((event, index) => (
              <Card
                key={event.id}
                className={`overflow-hidden ${!event.is_active ? "opacity-60" : ""}`}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Colored accent bar */}
                    <div
                      className="w-1.5 shrink-0"
                      style={{
                        backgroundColor: EVENT_COLORS[index % EVENT_COLORS.length],
                      }}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-5 sm:py-4 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-0.5 flex-wrap">
                          <h3 className="font-semibold truncate">{event.title}</h3>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {event.duration} min
                          </span>
                          {(event.buffer_before > 0 || event.buffer_after > 0) && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              {event.buffer_before > 0 && `${event.buffer_before}m before`}
                              {event.buffer_before > 0 && event.buffer_after > 0 && " · "}
                              {event.buffer_after > 0 && `${event.buffer_after}m after`}
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mb-1 truncate">
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">/book/{event.slug}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Switch
                          checked={event.is_active}
                          onCheckedChange={() => toggleActive(event)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyLink(event.slug)}
                          title="Copy link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(event)}
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingId(event.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "create" ? "Create Event Type" : "Edit Event Type"}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === "create"
                  ? "Add a new event type for people to book."
                  : "Update your event type details."}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel>Title</FieldLabel>
                <Input
                  value={form.title}
                  onChange={handleTitleChange}
                  placeholder="Quick Chat"
                />
              </Field>
              <Field>
                <FieldLabel>URL Slug</FieldLabel>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="quick-chat"
                />
              </Field>
              <Field>
                <FieldLabel>Duration (minutes)</FieldLabel>
                <Input
                  type="number"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: parseInt(e.target.value) || 30 })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="A quick chat to discuss..."
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Buffer before (min)</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={form.buffer_before}
                    onChange={(e) =>
                      setForm({ ...form, buffer_before: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </Field>
                <Field>
                  <FieldLabel>Buffer after (min)</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    value={form.buffer_after}
                    onChange={(e) =>
                      setForm({ ...form, buffer_after: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </Field>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Add buffer time before or after meetings to prevent back-to-back scheduling.
              </p>

              <div className="pt-4 border-t border-border mt-2">
                <div className="flex items-center justify-between mb-4">
                  <FieldLabel className="mb-0">Custom Questions</FieldLabel>
                  <Button variant="outline" size="sm" onClick={addCustomQuestion}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Question
                  </Button>
                </div>
                {form.custom_questions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No custom questions added yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {form.custom_questions.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-start gap-3 bg-muted/30 p-3 rounded-md border border-border/50"
                      >
                        <div className="flex-1 space-y-2">
                          <Input
                            className="h-8 text-sm"
                            placeholder="Question label (e.g. What is your phone number?)"
                            value={q.label}
                            onChange={(e) =>
                              updateCustomQuestion(q.id, "label", e.target.value)
                            }
                          />
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={q.required}
                              onCheckedChange={(c) =>
                                updateCustomQuestion(q.id, "required", c)
                              }
                              id={`req-${q.id}`}
                            />
                            <label
                              htmlFor={`req-${q.id}`}
                              className="text-xs font-medium cursor-pointer"
                            >
                              Required
                            </label>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive shrink-0"
                          onClick={() => removeCustomQuestion(q.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={dialogMode === "create" ? handleCreate : handleUpdate}
                className="w-full mt-4"
              >
                {dialogMode === "create" ? "Create Event Type" : "Save Changes"}
              </Button>
            </FieldGroup>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog
          open={deletingId !== null}
          onOpenChange={(open) => !open && setDeletingId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event Type</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this event type? This will also remove all
                associated bookings. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
