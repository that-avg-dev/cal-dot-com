import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await sql`DELETE FROM date_overrides WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Date override DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete date override" }, { status: 500 })
  }
}
