export type HealthResponse = {
  status: string;
  app: string;
  database: string;
};

export type TranscriptResponse = {
  id: number;
  meeting_id: number;
  transcript: string;
  word_count: number;
  speaker_count: number;
};

export type ActionItem = {
  owner: string;
  task: string;
  deadline: string;
};

export type SummaryResponse = {
  id: number;
  meeting_id: number;
  executive_summary: string;
  discussion_points: string[];
  decisions: string[];
  action_items: ActionItem[];
  risks: string[];
  next_meeting: string[];
  created_at: string;
};

export type MeetingListItem = {
  id: number;
  filename: string;
  original_filename: string;
  duration: number | null;
  upload_date: string;
  status: string;
  created_at: string;
  word_count: number;
  action_item_count: number;
  has_summary: boolean;
};

export type MeetingResponse = {
  id: number;
  filename: string;
  original_filename: string;
  duration: number | null;
  upload_date: string;
  status: string;
  created_at: string;
  transcript: TranscriptResponse | null;
  summary: SummaryResponse | null;
};
