import { NextResponse } from "next/server"
import { getBookings, checkDoubleBooking, createBooking } from "@/lib/services/bookings"

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
    const isDoubleBooked = await checkDoubleBooking(startTimestamp);
    
    if (isDoubleBooked) {
      return NextResponse.json({ error: "Time slot already booked" }, { status: 400 })
    }
    
    const newBooking = await createBooking({
      event_type_id,
      booker_name: booker_name.trim(),
      booker_email: booker_email.trim(),
      start_time: startTimestamp,
      end_time: endTimestamp,
      custom_responses
    });

    return NextResponse.json(newBooking)
  } catch (error) {
    console.error("Bookings POST error:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const bookings = await getBookings();
    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Bookings GET error:", error)
    return NextResponse.json([])
  }
}
