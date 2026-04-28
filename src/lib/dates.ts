import { format } from 'date-fns'

/** Format a Date to YYYY-MM-DD in the local timezone. */
export function toLocalDateStr(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd')
}
