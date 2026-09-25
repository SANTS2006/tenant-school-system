import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/pagination";

import type {
  Period,
  PeriodPayload,
  Room,
  RoomPayload,
  TimetableEntry,
  TimetableEntryListParams,
  TimetableEntryPayload,
} from "./types";

interface PageParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

export async function fetchRooms(params: PageParams): Promise<PaginatedResponse<Room>> {
  const { data } = await apiClient.get<PaginatedResponse<Room>>("/timetable/rooms/", { params });
  return data;
}

export async function getRoom(id: string): Promise<Room> {
  const { data } = await apiClient.get<Room>(`/timetable/rooms/${id}/`);
  return data;
}

export async function createRoom(values: RoomPayload): Promise<Room> {
  const { data } = await apiClient.post<Room>("/timetable/rooms/", values);
  return data;
}

export async function updateRoom(id: string, values: RoomPayload): Promise<Room> {
  const { data } = await apiClient.patch<Room>(`/timetable/rooms/${id}/`, values);
  return data;
}

export async function deleteRoom(id: string): Promise<void> {
  await apiClient.delete(`/timetable/rooms/${id}/`);
}

export async function fetchPeriods(params: PageParams): Promise<PaginatedResponse<Period>> {
  const { data } = await apiClient.get<PaginatedResponse<Period>>("/timetable/periods/", { params });
  return data;
}

export async function getPeriod(id: string): Promise<Period> {
  const { data } = await apiClient.get<Period>(`/timetable/periods/${id}/`);
  return data;
}

export async function createPeriod(values: PeriodPayload): Promise<Period> {
  const { data } = await apiClient.post<Period>("/timetable/periods/", values);
  return data;
}

export async function updatePeriod(id: string, values: PeriodPayload): Promise<Period> {
  const { data } = await apiClient.patch<Period>(`/timetable/periods/${id}/`, values);
  return data;
}

export async function deletePeriod(id: string): Promise<void> {
  await apiClient.delete(`/timetable/periods/${id}/`);
}

export async function fetchEntries(
  params: PageParams & TimetableEntryListParams,
): Promise<PaginatedResponse<TimetableEntry>> {
  const { data } = await apiClient.get<PaginatedResponse<TimetableEntry>>("/timetable/entries/", { params });
  return data;
}

export async function getEntry(id: string): Promise<TimetableEntry> {
  const { data } = await apiClient.get<TimetableEntry>(`/timetable/entries/${id}/`);
  return data;
}

export async function createEntry(values: TimetableEntryPayload): Promise<TimetableEntry> {
  const { data } = await apiClient.post<TimetableEntry>("/timetable/entries/", values);
  return data;
}

export async function updateEntry(id: string, values: TimetableEntryPayload): Promise<TimetableEntry> {
  const { data } = await apiClient.patch<TimetableEntry>(`/timetable/entries/${id}/`, values);
  return data;
}

export async function deleteEntry(id: string): Promise<void> {
  await apiClient.delete(`/timetable/entries/${id}/`);
}

export async function fetchMyTimetable(): Promise<TimetableEntry[]> {
  const { data } = await apiClient.get<{ results: TimetableEntry[] }>("/timetable/me/");
  return data.results;
}
