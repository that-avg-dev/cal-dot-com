import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const overrides = await sql`
      SELECT * FROM date_overrides ORDER BY override_date ASC
    `
    return NextResponse.json(overrides)
  } catch (error) {
    console.error("Date overrides GET error:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const { override_date, is_available, start_time, end_time } = await request.json()

    if (!override_date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO date_overrides (override_date, is_available, start_time, end_time)
      VALUES (${override_date}, ${is_available}, ${start_time || null}, ${end_time || null})
      ON CONFLICT (override_date) DO UPDATE SET
        is_available = ${is_available},
        start_time = ${start_time || null},
        end_time = ${end_time || null},
        updated_at = NOW()
      RETURNING *
    `
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Date overrides POST error:", error)
    return NextResponse.json({ error: "Failed to create date override" }, { status: 500 })
  }
}
