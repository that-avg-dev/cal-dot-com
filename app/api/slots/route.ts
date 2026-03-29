import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const duration = parseInt(searchParams.get("duration") || "30")
    const eventTypeId = searchParams.get("event_type_id")
    
    if (!date) {
      return NextResponse.json({ error: "Date required" }, { status: 400 })
    }

    // 1. Look up buffer settings from event type
    let bufferBefore = 0
    let bufferAfter = 0
    if (eventTypeId) {
      const etResult = await sql`
        SELECT buffer_before, buffer_after FROM event_types WHERE id = ${eventTypeId}
      `
      if (etResult.length > 0) {
        bufferBefore = etResult[0].buffer_before || 0
        bufferAfter = etResult[0].buffer_after || 0
      }
    }

    // 2. Check for date override first
    const overrides = await sql`
      SELECT * FROM date_overrides WHERE override_date = ${date}::date
    `

    let startTime: string
    let endTime: string

    if (overrides.length > 0) {
      const override = overrides[0]
      if (!override.is_available) {
        // Date is blocked entirely
        return NextResponse.json([])
      }
      // Use custom hours from override
      startTime = override.start_time?.toString() || "09:00"
      endTime = override.end_time?.toString() || "17:00"
    } else {
      // 3. Fall back to weekly availability
      const dayOfWeek = new Date(date + "T00:00:00").getDay()
      const availability = await sql`
        SELECT * FROM availability WHERE day_of_week = ${dayOfWeek} AND is_available = true
      `
      if (availability.length === 0) {
        return NextResponse.json([])
      }
      startTime = availability[0].start_time?.toString() || "09:00"
      endTime = availability[0].end_time?.toString() || "17:00"
    }
    
    // 4. Get existing bookings for this date
    const startOfDay = `${date}T00:00:00`
    const endOfDay = `${date}T23:59:59`
    
    const bookings = await sql`
      SELECT b.start_time, b.end_time, e.buffer_before, e.buffer_after 
      FROM bookings b
      JOIN event_types e ON b.event_type_id = e.id
      WHERE b.start_time >= ${startOfDay}::timestamp 
      AND b.start_time <= ${endOfDay}::timestamp
      AND b.status = 'confirmed'
    `
    
    // Build list of blocked time ranges (booking time expanded by buffers)
    const blockedRanges: { start: number; end: number }[] = bookings.map(
      (b: Record<string, any>) => {
        const bStart = new Date(b.start_time)
        const bEnd = new Date(b.end_time)
        const existingBufferBefore = b.buffer_before || 0
        const existingBufferAfter = b.buffer_after || 0
        return {
          start: bStart.getHours() * 60 + bStart.getMinutes() - existingBufferBefore,
          end: bEnd.getHours() * 60 + bEnd.getMinutes() + existingBufferAfter,
        }
      }
    )
    
    // 5. Generate available slots
    const slots: string[] = []
    const startParts = startTime.toString().split(":")
    const endParts = endTime.toString().split(":")
    const availStartMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1])
    const availEndMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1])
    
    let currentMin = availStartMin
    
    while (currentMin < availEndMin) {
      const slotStart = currentMin
      const slotEnd = currentMin + duration
      
      // Slot must fit within availability window
      if (slotEnd > availEndMin) break
      
      // The effective range this slot occupies, including buffers for the NEW booking
      const effectiveStart = slotStart - bufferBefore
      const effectiveEnd = slotEnd + bufferAfter
      
      // Check if slot conflicts with any blocked range
      const hasConflict = blockedRanges.some(
        (range) => effectiveStart < range.end && effectiveEnd > range.start
      )

      if (!hasConflict) {
        const h = Math.floor(currentMin / 60)
        const m = currentMin % 60
        slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
      }
      
      currentMin += 30
    }
    
    return NextResponse.json(slots)
  } catch (error) {
    console.error("Slots GET error:", error)
    return NextResponse.json([])
  }
}
