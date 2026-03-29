import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await sql`
      UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = ${id} RETURNING *
    `
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Booking cancel error:", error)
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
  }
}
