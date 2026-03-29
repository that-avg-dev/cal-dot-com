import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { event_type_id, booker_name, booker_email, booking_date, start_time, end_time, custom_responses } = body

    // Input validation
    if (!event_type_id) {
      return NextResponse.json({ error: "Event type is required" }, { status: 400 })
    }
    if (!booker_name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }
    if (!booker_email?.trim() || !booker_email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }
    if (!booking_date || !start_time || !end_time) {
      return NextResponse.json({ error: "Date and time are required" }, { status: 400 })
    }

    // Combine date and time into timestamps
    const startTimestamp = `${booking_date}T${start_time}:00`
    const endTimestamp = `${booking_date}T${end_time}:00`
    
    // Check for double booking
    const existing = await sql`
      SELECT id FROM bookings 
      WHERE start_time = ${startTimestamp}::timestamp
      AND status = 'confirmed'
    `
    
    if (existing.length > 0) {
      return NextResponse.json({ error: "Time slot already booked" }, { status: 400 })
    }
    
    const result = await sql`
      INSERT INTO bookings (event_type_id, booker_name, booker_email, start_time, end_time, custom_responses)
      VALUES (${event_type_id}, ${booker_name.trim()}, ${booker_email.trim()}, ${startTimestamp}::timestamp, ${endTimestamp}::timestamp, ${JSON.stringify(custom_responses || {})}::jsonb)
      RETURNING *
    `
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Bookings POST error:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const bookings = await sql`
      SELECT b.*, e.title as event_title, e.duration as event_duration 
      FROM bookings b 
      JOIN event_types e ON b.event_type_id = e.id 
      ORDER BY b.start_time DESC
    `
    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Bookings GET error:", error)
    return NextResponse.json([])
  }
}
