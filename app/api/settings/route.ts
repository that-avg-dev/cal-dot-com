import { NextResponse } from "next/server"
import { getSettings, updateSettings } from "@/lib/services/settings"

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Settings GET error:", error)
    return NextResponse.json({ timezone: "UTC", user_name: "User", user_email: "" })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    await updateSettings(body);
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Settings PUT error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
