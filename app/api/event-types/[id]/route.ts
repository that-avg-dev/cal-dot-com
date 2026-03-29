import { NextResponse } from "next/server"
import { getEventTypeById, updateEventType, deleteEventType } from "@/lib/services/event-types"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const eventType = await getEventTypeById(id);
    
    if (!eventType) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    
    return NextResponse.json(eventType);
  } catch (error) {
    console.error("Event type GET error:", error);
    return NextResponse.json({ error: "Failed to get event type" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updatedEventType = await updateEventType(id, body);
    
    if (!updatedEventType) {
      return NextResponse.json({ error: "Update failed or not found" }, { status: 404 });
    }
    
    return NextResponse.json(updatedEventType);
  } catch (error) {
    console.error("Event type PUT error:", error);
    return NextResponse.json({ error: "Failed to update event type" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteEventType(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Event type DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete event type" }, { status: 500 });
  }
}
