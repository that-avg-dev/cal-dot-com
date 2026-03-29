import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await sql`SELECT * FROM event_types WHERE id = ${id}`
    if (result.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Event type GET error:", error)
    return NextResponse.json({ error: "Failed to get event type" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { title, description, duration, slug, is_active, buffer_before, buffer_after, custom_questions } = await request.json()
    
    const result = await sql`
      UPDATE event_types 
      SET title = ${title}, description = ${description}, duration = ${duration}, 
          slug = ${slug}, is_active = ${is_active}, 
          buffer_before = ${buffer_before || 0}, buffer_after = ${buffer_after || 0},
          custom_questions = ${JSON.stringify(custom_questions || [])}::jsonb,
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Event type PUT error:", error)
    return NextResponse.json({ error: "Failed to update event type" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await sql`DELETE FROM event_types WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Event type DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete event type" }, { status: 500 })
  }
}
