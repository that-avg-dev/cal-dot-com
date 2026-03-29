import { sql } from "@/lib/db"

export interface AvailabilitySchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

/**
 * Fetch all availability schedules ordered by the day of the week.
 */
export async function getAvailability() {
  return await sql`SELECT * FROM availability ORDER BY day_of_week`;
}

/**
 * Update the full set of availability schedules.
 */
export async function updateAvailabilitySchedules(schedules: AvailabilitySchedule[]) {
  // Execute updates sequentially. In a robust system, this might be a transaction.
  for (const schedule of schedules) {
    await sql`
      UPDATE availability 
      SET start_time = ${schedule.start_time}::time, 
          end_time = ${schedule.end_time}::time, 
          is_available = ${schedule.is_available},
          updated_at = NOW()
      WHERE day_of_week = ${schedule.day_of_week}
    `;
  }
  
  // Return the newly updated availability array
  return await getAvailability();
}
