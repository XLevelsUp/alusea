// Dates as the business sees them. Pure and free of app imports, so it is unit-testable in plain Node.

// Today as YYYY-MM-DD in India. toISOString() reports the UTC day, which is still yesterday until 5:30 in the morning here.
export function todayInIndia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}
