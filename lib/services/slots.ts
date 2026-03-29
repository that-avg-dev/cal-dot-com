import { sql } from "@/lib/db"
import { getEventTypeById } from "./event-types"

/**
 * Helper to get the blocked time ranges for a specific date from confirmed bookings.
 */
async function getBlockedRangesForDate(date: string) {
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;
  
  const bookings = await sql`
    SELECT b.start_time, b.end_time, e.buffer_before, e.buffer_after 
    FROM bookings b
    JOIN event_types e ON b.event_type_id = e.id
    WHERE b.start_time >= ${startOfDay}::timestamp 
    AND b.start_time <= ${endOfDay}::timestamp
    AND b.status = 'confirmed'
  `;
  
  // Return list of blocked time ranges (booking time expanded by buffers in minutes)
  return bookings.map((b: any) => {
    const bStart = new Date(b.start_time)
    const bEnd = new Date(b.end_time)
    const existingBufferBefore = b.buffer_before || 0
    const existingBufferAfter = b.buffer_after || 0
    return {
      start: bStart.getHours() * 60 + bStart.getMinutes() - existingBufferBefore,
      end: bEnd.getHours() * 60 + bEnd.getMinutes() + existingBufferAfter,
    }
  });
}

/**
 * Calculates the valid operating hours for a date based on overrides or weekly availability.
 */
async function getOperatingHours(date: string) {
  // Check for date override first
  const overrides = await sql`
    SELECT * FROM date_overrides WHERE override_date = ${date}::date
  `;

  if (overrides.length > 0) {
    const override = overrides[0];
    if (!override.is_available) {
      return null; // Date is completely blocked
    }
    return {
      startTime: override.start_time?.toString() || "09:00",
      endTime: override.end_time?.toString() || "17:00"
    };
  } 
  
  // Fall back to weekly availability
  const dayOfWeek = new Date(date + "T00:00:00").getDay();
  const availability = await sql`
    SELECT * FROM availability WHERE day_of_week = ${dayOfWeek} AND is_available = true
  `;
  
  if (availability.length === 0) {
    return null; // Day not available
  }
  
  return {
    startTime: availability[0].start_time?.toString() || "09:00",
    endTime: availability[0].end_time?.toString() || "17:00"
  };
}

/**
 * Pure generator algorithm that takes constraint inputs and outputs slot strings.
 */
export function generateAvailableSlots(
  startTime: string,
  endTime: string,
  duration: number,
  bufferBefore: number,
  bufferAfter: number,
  blockedRanges: { start: number; end: number }[]
): string[] {
  const slots: string[] = [];
  const startParts = startTime.toString().split(":");
  const endParts = endTime.toString().split(":");
  const availStartMin = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
  const availEndMin = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);
  
  let currentMin = availStartMin;
  
  while (currentMin < availEndMin) {
    const slotStart = currentMin;
    const slotEnd = currentMin + duration;
    
    // Slot must fit within availability window
    if (slotEnd > availEndMin) break;
    
    // The effective range this slot occupies, including buffers for the NEW booking
    const effectiveStart = slotStart - bufferBefore;
    const effectiveEnd = slotEnd + bufferAfter;
    
    // Check if slot conflicts with any existing blocked range
    const hasConflict = blockedRanges.some(
      (range) => effectiveStart < range.end && effectiveEnd > range.start
    );

    if (!hasConflict) {
      const h = Math.floor(currentMin / 60);
      const m = currentMin % 60;
      slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
    
    currentMin += 30; // Increment step
  }
  
  return slots;
}

/**
 * Main service endpoint combining all logical steps to find available slots for a request.
 */
export async function getAvailableSlots(date: string, duration: number, eventTypeId?: string | null) {
  // 1. Look up buffer settings from event type
  let bufferBefore = 0;
  let bufferAfter = 0;
  
  if (eventTypeId) {
    const etResult = await getEventTypeById(eventTypeId);
    if (etResult) {
      bufferBefore = etResult.buffer_before || 0;
      bufferAfter = etResult.buffer_after || 0;
    }
  }

  // 2. Determine base operating hours using overrides & availability defaults
  const operatingHours = await getOperatingHours(date);
  if (!operatingHours) {
    return []; // Completely blocked day
  }

  // 3. Get existing bookings for this date to determine blocked ranges
  const blockedRanges = await getBlockedRangesForDate(date);
  
  // 4. Generate available slots by calculating gaps
  return generateAvailableSlots(
    operatingHours.startTime,
    operatingHours.endTime,
    duration,
    bufferBefore,
    bufferAfter,
    blockedRanges
  );
}
