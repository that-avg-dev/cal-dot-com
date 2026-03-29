import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const eventTypes = await sql`SELECT * FROM event_types ORDER BY created_at DESC`
    return NextResponse.json(eventTypes)
  } catch (error) {
    console.error("Event types GET error:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, duration, slug, buffer_before, buffer_after, custom_questions } = body

    // Input validation
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }
    if (!slug?.trim()) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 })
    }
    if (!duration || duration < 1) {
      return NextResponse.json({ error: "Duration must be at least 1 minute" }, { status: 400 })
    }

    const existing = await sql`SELECT id FROM event_types WHERE slug = ${slug.trim()}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 })
    }
    
    const result = await sql`
      INSERT INTO event_types (title, description, duration, slug, buffer_before, buffer_after, custom_questions)
      VALUES (${title.trim()}, ${description || null}, ${duration}, ${slug.trim()}, ${buffer_before || 0}, ${buffer_after || 0}, ${JSON.stringify(custom_questions || [])}::jsonb)
      RETURNING *
    `
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Event types POST error:", error)
    return NextResponse.json({ error: "Failed to create event type" }, { status: 500 })
  }
}
