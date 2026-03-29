export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

export const TIMES = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const min = i % 2 === 0 ? "00" : "30"
  return `${hour.toString().padStart(2, "0")}:${min}`
})

export const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Australia/Sydney",
] as const
