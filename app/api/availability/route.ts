import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const availability = await sql`SELECT * FROM availability ORDER BY day_of_week`
    return NextResponse.json(availability)
  } catch (error) {
    console.error("Availability GET error:", error)
    return NextResponse.json([])
  }
}

export async function PUT(request: Request) {
  try {
    const { schedules } = await request.json()
    
    for (const schedule of schedules) {
      await sql`
        UPDATE availability 
        SET start_time = ${schedule.start_time}::time, 
            end_time = ${schedule.end_time}::time, 
            is_available = ${schedule.is_available},
            updated_at = NOW()
        WHERE day_of_week = ${schedule.day_of_week}
      `
    }
    
    const updated = await sql`SELECT * FROM availability ORDER BY day_of_week`
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Availability PUT error:", error)
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 })
  }
}
