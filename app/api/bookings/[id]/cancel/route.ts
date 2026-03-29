import { NextResponse } from "next/server"
import { cancelBooking } from "@/lib/services/bookings"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const canceledBooking = await cancelBooking(id);
    
    if (!canceledBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }
    
    return NextResponse.json(canceledBooking)
  } catch (error) {
    console.error("Booking cancel error:", error)
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
  }
}
