import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL!)

export type EventType = {
  id: number
  title: string
  description: string | null
  duration: number
  slug: string
  is_active: boolean
  buffer_before: number
  buffer_after: number
  custom_questions?: { id: string; label: string; required: boolean }[]
  created_at: string
}

export type Availability = {
  id: number
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

export type Settings = {
  id: number
  timezone: string
  user_name: string
  user_email: string
}

export type Booking = {
  id: number
  event_type_id: number
  booker_name: string
  booker_email: string
  start_time: string
  end_time: string
  status: "confirmed" | "cancelled"
  notes: string | null
  created_at: string
  event_title?: string
  event_duration?: number
  custom_responses?: Record<string, string>
}

export type DateOverride = {
  id: number
  override_date: string
  is_available: boolean
  start_time: string | null
  end_time: string | null
  created_at: string
}
