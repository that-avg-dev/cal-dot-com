import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const result = await sql`SELECT * FROM settings WHERE id = 1`
    if (result.length === 0) {
      return NextResponse.json({ timezone: "UTC", user_name: "User", user_email: "" })
    }
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Settings GET error:", error)
    return NextResponse.json({ timezone: "UTC", user_name: "User", user_email: "" })
  }
}

export async function PUT(request: Request) {
  try {
    const { timezone, user_name, user_email } = await request.json()
    
    await sql`
      UPDATE settings 
      SET timezone = ${timezone}, user_name = ${user_name || "User"}, user_email = ${user_email || ""}, updated_at = NOW()
      WHERE id = 1
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Settings PUT error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
