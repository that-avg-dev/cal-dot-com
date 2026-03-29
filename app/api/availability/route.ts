import { NextResponse } from "next/server"
import { getAvailability, updateAvailabilitySchedules } from "@/lib/services/availability"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const availability = await getAvailability();
    return NextResponse.json(availability);
  } catch (error) {
    console.error("Availability GET error:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { schedules } = await request.json();
    
    if (!schedules || !Array.isArray(schedules)) {
      return NextResponse.json({ error: "Invalid payload: 'schedules' array is required" }, { status: 400 });
    }

    const updated = await updateAvailabilitySchedules(schedules);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Availability PUT error:", error);
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }
}
