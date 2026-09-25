export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface Room {
  id: string;
  name: string;
  capacity: number;
  created_at: string;
  updated_at: string;
}

export interface RoomPayload {
  name: string;
  capacity: number;
}

export interface Period {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  order: number;
  is_break: boolean;
  created_at: string;
  updated_at: string;
}

export interface PeriodPayload {
  name: string;
  start_time: string;
  end_time: string;
  order: number;
  is_break: boolean;
}

export interface TimetableEntry {
  id: string;
  section: string;
  section_name: string | null;
  day_of_week: DayOfWeek;
  period: string;
  period_name: string;
  subject: string | null;
  subject_name: string | null;
  teacher: string | null;
  teacher_name: string | null;
  room: string | null;
  room_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimetableEntryPayload {
  section: string;
  day_of_week: DayOfWeek;
  period: string;
  subject?: string;
  teacher?: string;
  room?: string;
}

export interface TimetableEntryListParams {
  section?: string;
  day_of_week?: DayOfWeek;
  teacher?: string;
  room?: string;
}
