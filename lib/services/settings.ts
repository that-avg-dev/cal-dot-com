import { sql } from "@/lib/db"

export interface SettingsInput {
  timezone: string;
  user_name: string;
  user_email: string;
}

export async function getSettings() {
  const result = await sql`SELECT * FROM settings WHERE id = 1`;
  if (result.length === 0) {
    return { timezone: "UTC", user_name: "User", user_email: "" };
  }
  return result[0];
}

export async function updateSettings(data: SettingsInput) {
  await sql`
    UPDATE settings 
    SET timezone = ${data.timezone}, 
        user_name = ${data.user_name || "User"}, 
        user_email = ${data.user_email || ""}, 
        updated_at = NOW()
    WHERE id = 1
  `;
  return true;
}
