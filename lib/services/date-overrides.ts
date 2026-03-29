import { sql } from "@/lib/db"

export interface DateOverrideInput {
  override_date: string;
  is_available: boolean;
  start_time?: string | null;
  end_time?: string | null;
}

export async function getDateOverrides() {
  return await sql`SELECT * FROM date_overrides ORDER BY override_date ASC`;
}

export async function upsertDateOverride(data: DateOverrideInput) {
  const result = await sql`
    INSERT INTO date_overrides (override_date, is_available, start_time, end_time)
    VALUES (${data.override_date}, ${data.is_available}, ${data.start_time || null}, ${data.end_time || null})
    ON CONFLICT (override_date) DO UPDATE SET
      is_available = ${data.is_available},
      start_time = ${data.start_time || null},
      end_time = ${data.end_time || null},
      updated_at = NOW()
    RETURNING *
  `;
  return result[0];
}

export async function deleteDateOverride(id: string | number) {
  await sql`DELETE FROM date_overrides WHERE id = ${id}`;
  return true;
}
