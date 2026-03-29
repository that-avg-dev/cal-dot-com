import { NextResponse } from "next/server"
import { getEventTypes, getEventTypeBySlug, createEventType } from "@/lib/services/event-types"

export async function GET() {
  try {
    const eventTypes = await getEventTypes();
    return NextResponse.json(eventTypes);
  } catch (error) {
    console.error("Event types GET error:", error);
    return NextResponse.json({ error: "Failed to fetch event types" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, duration, slug, buffer_before, buffer_after, custom_questions } = body;

    // Input validation
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!slug?.trim()) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }
    if (!duration || duration < 1) {
      return NextResponse.json({ error: "Duration must be at least 1 minute" }, { status: 400 });
    }

    const existing = await getEventTypeBySlug(slug.trim());
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }
    
    // Create via service
    const newEventType = await createEventType({
      title: title.trim(),
      description,
      duration,
      slug: slug.trim(),
      buffer_before,
      buffer_after,
      custom_questions
    });

    return NextResponse.json(newEventType);
  } catch (error) {
    console.error("Event types POST error:", error);
    return NextResponse.json({ error: "Failed to create event type" }, { status: 500 });
  }
}
