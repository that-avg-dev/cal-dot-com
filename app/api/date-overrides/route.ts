import { NextResponse } from "next/server"
import { getDateOverrides, upsertDateOverride } from "@/lib/services/date-overrides"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const overrides = await getDateOverrides()
    return NextResponse.json(overrides)
  } catch (error) {
    console.error("Date overrides GET error:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.override_date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    const newOverride = await upsertDateOverride({
      override_date: body.override_date,
      is_available: body.is_available,
      start_time: body.start_time,
      end_time: body.end_time
    });
    
    return NextResponse.json(newOverride)
  } catch (error) {
    console.error("Date overrides POST error:", error)
    return NextResponse.json({ error: "Failed to create date override" }, { status: 500 })
  }
}
