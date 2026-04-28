import type { Database } from '@/types/database'

export type Reminder = Database['public']['Tables']['reminders']['Row']
export type ReminderUpdate = Database['public']['Tables']['reminders']['Update']
