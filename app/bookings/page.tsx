"use client"

import useSWR, { mutate } from "swr"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Mail, X, MessageSquare } from "lucide-react"
import { fetcher } from "@/lib/fetcher"
import { formatTimestamp, formatDate } from "@/lib/format"
import type { Booking } from "@/lib/db"

function BookingCard({
  booking,
  showCancel = false,
  onCancel,
}: {
  booking: Booking
  showCancel?: boolean
  onCancel?: (id: number) => void
}) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{booking.event_title}</h3>
              <Badge variant="secondary">{booking.event_duration} min</Badge>
              {booking.status === "cancelled" && (
                <Badge variant="destructive">Cancelled</Badge>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(booking.start_time)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTimestamp(booking.start_time)} - {formatTimestamp(booking.end_time)}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {booking.booker_name}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {booking.booker_email}
              </span>
            </div>
            {booking.custom_responses &&
              Object.keys(booking.custom_responses).length > 0 && (
                <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-sm">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground text-xs uppercase tracking-wider mb-1">
                    <MessageSquare className="w-3.5 h-3.5" /> Responses
                  </span>
                  {Object.entries(booking.custom_responses).map(
                    ([questionLabel, response]) => (
                      <div key={questionLabel} className="flex flex-col gap-0.5">
                        <span className="text-muted-foreground text-xs font-medium">
                          {questionLabel}
                        </span>
                        <span className="text-foreground">{response}</span>
                      </div>
                    )
                  )}
                </div>
              )}
          </div>
          {showCancel && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel(booking.id)}
              className="text-destructive hover:text-destructive shrink-0"
            >
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

export default function BookingsPage() {
  const { data: bookings, isLoading } = useSWR<Booking[]>("/api/bookings", fetcher)

  const now = new Date()

  const upcoming =
    bookings
      ?.filter((b) => b.status === "confirmed" && new Date(b.start_time) >= now)
      .sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      ) || []

  const past =
    bookings
      ?.filter((b) => b.status === "confirmed" && new Date(b.start_time) < now)
      .sort(
        (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      ) || []

  const cancelled = bookings?.filter((b) => b.status === "cancelled") || []

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return
    await fetch(`/api/bookings/${id}/cancel`, { method: "POST" })
    toast.success("Booking cancelled")
    mutate("/api/bookings")
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Bookings</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              View and manage your scheduled meetings.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-2/5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList className="mb-6">
              <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {upcoming.length === 0 ? (
                <EmptyState message="No upcoming bookings." />
              ) : (
                <div className="space-y-3">
                  {upcoming.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      showCancel
                      onCancel={handleCancel}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past">
              {past.length === 0 ? (
                <EmptyState message="No past bookings." />
              ) : (
                <div className="space-y-3">
                  {past.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled">
              {cancelled.length === 0 ? (
                <EmptyState message="No cancelled bookings." />
              ) : (
                <div className="space-y-3">
                  {cancelled.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}
