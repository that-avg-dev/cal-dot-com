import { NextResponse } from "next/server"
import { deleteDateOverride } from "@/lib/services/date-overrides"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteDateOverride(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Date override DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete date override" }, { status: 500 })
  }
}
