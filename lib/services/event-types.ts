import { sql } from "@/lib/db"

export interface EventTypeInput {
  title: string;
  description?: string;
  duration: number;
  slug: string;
  buffer_before?: number;
  buffer_after?: number;
  custom_questions?: Array<{ id: string; label: string; required: boolean }>;
  is_active?: boolean;
}

export async function getEventTypes() {
  return await sql`SELECT * FROM event_types ORDER BY created_at DESC`;
}

export async function getEventTypeById(id: string | number) {
  const result = await sql`SELECT * FROM event_types WHERE id = ${id}`;
  return result.length > 0 ? result[0] : null;
}

export async function getEventTypeBySlug(slug: string) {
  const result = await sql`SELECT * FROM event_types WHERE slug = ${slug}`;
  return result.length > 0 ? result[0] : null;
}

export async function createEventType(data: EventTypeInput) {
  const result = await sql`
    INSERT INTO event_types (
      title, description, duration, slug, buffer_before, buffer_after, custom_questions
    )
    VALUES (
      ${data.title}, 
      ${data.description || null}, 
      ${data.duration}, 
      ${data.slug}, 
      ${data.buffer_before || 0}, 
      ${data.buffer_after || 0}, 
      ${JSON.stringify(data.custom_questions || [])}::jsonb
    )
    RETURNING *
  `;
  return result[0];
}

export async function updateEventType(id: string | number, data: EventTypeInput) {
  const result = await sql`
    UPDATE event_types 
    SET title = ${data.title}, 
        description = ${data.description || null}, 
        duration = ${data.duration}, 
        slug = ${data.slug}, 
        is_active = ${data.is_active !== undefined ? data.is_active : true}, 
        buffer_before = ${data.buffer_before || 0}, 
        buffer_after = ${data.buffer_after || 0},
        custom_questions = ${JSON.stringify(data.custom_questions || [])}::jsonb,
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return result.length > 0 ? result[0] : null;
}

export async function deleteEventType(id: string | number) {
  await sql`DELETE FROM event_types WHERE id = ${id}`;
  return true;
}
