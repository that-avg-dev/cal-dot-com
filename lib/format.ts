/** Format a 24h time string like "14:30" to "2:30 PM" */
export function formatTime(time: string): string {
  const [hour, min] = time.split(":").map(Number)
  const ampm = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12
  return `${hour12}:${min.toString().padStart(2, "0")} ${ampm}`
}

/** Format a timestamp string like "2026-03-28T09:00:00" to "2:30 PM" */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

/** Format a timestamp to a readable date like "Mon, Mar 28, 2026" */
export function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/** Normalize a time string like "9:00:00" to "09:00" */
export function formatTimeValue(time: string): string {
  if (!time) return "09:00"
  const parts = time.toString().split(":")
  return `${parts[0].padStart(2, "0")}:${parts[1]?.padStart(2, "0") || "00"}`
}
