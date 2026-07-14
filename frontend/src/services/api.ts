import axios from "axios";
import { HealthResponse, MeetingListItem, MeetingResponse, SummaryResponse } from "../types/api";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000"
});

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function getHealth(): Promise<HealthResponse> {
  const response = await api.get<HealthResponse>("/health");
  return response.data;
}

export async function uploadAudio(file: File): Promise<MeetingResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<MeetingResponse>("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data;
}

export async function getMeetings(search?: string): Promise<MeetingListItem[]> {
  const response = await api.get<MeetingListItem[]>("/meetings", {
    params: search ? { search } : undefined
  });
  return response.data;
}

export async function getMeeting(meetingId: number): Promise<MeetingResponse> {
  const response = await api.get<MeetingResponse>(`/meeting/${meetingId}`);
  return response.data;
}

export async function generateSummary(meetingId: number): Promise<SummaryResponse> {
  const response = await api.post<SummaryResponse>(`/meeting/${meetingId}/summary`);
  return response.data;
}

export async function deleteMeeting(meetingId: number): Promise<void> {
  await api.delete(`/meeting/${meetingId}`);
}

export function downloadUrl(kind: "transcript" | "summary" | "pdf", meetingId: number): string {
  return `${apiBaseUrl}/download/${kind}/${meetingId}`;
}
