import { sql } from "@/lib/db"

export interface BookingInput {
  event_type_id: number;
  booker_name: string;
  booker_email: string;
  start_time: string; // ISO String or Timestamp
  end_time: string; // ISO String or Timestamp
  custom_responses?: Record<string, string>;
}

export async function getBookings() {
  return await sql`
    SELECT b.*, e.title as event_title, e.duration as event_duration 
    FROM bookings b 
    JOIN event_types e ON b.event_type_id = e.id 
    ORDER BY b.start_time DESC
  `;
}

export async function checkDoubleBooking(startTime: string) {
  const existing = await sql`
    SELECT id FROM bookings 
    WHERE start_time = ${startTime}::timestamp
    AND status = 'confirmed'
  `;
  return existing.length > 0;
}

export async function createBooking(data: BookingInput) {
  const result = await sql`
    INSERT INTO bookings (
      event_type_id, booker_name, booker_email, start_time, end_time, custom_responses
    )
    VALUES (
      ${data.event_type_id}, 
      ${data.booker_name}, 
      ${data.booker_email}, 
      ${data.start_time}::timestamp, 
      ${data.end_time}::timestamp, 
      ${JSON.stringify(data.custom_responses || {})}::jsonb
    )
    RETURNING *
  `;
  return result[0];
}

export async function cancelBooking(id: string | number) {
  const result = await sql`
    UPDATE bookings 
    SET status = 'cancelled', updated_at = NOW() 
    WHERE id = ${id} 
    RETURNING *
  `;
  return result.length > 0 ? result[0] : null;
}
