import { NextResponse } from "next/server"
import { getAvailableSlots } from "@/lib/services/slots"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const duration = parseInt(searchParams.get("duration") || "30", 10)
    const eventTypeId = searchParams.get("event_type_id")
    
    if (!date) {
      return NextResponse.json({ error: "Date required" }, { status: 400 })
    }

    const slots = await getAvailableSlots(date, duration, eventTypeId);
    return NextResponse.json(slots)

  } catch (error) {
    console.error("Slots GET error:", error)
    return NextResponse.json({ error: "Failed to compute slots" }, { status: 500 })
  }
}
