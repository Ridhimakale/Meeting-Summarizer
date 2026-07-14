import { CheckCircle2, Clock, FileAudio, History, ListChecks, Server, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SummaryPanel } from "../components/meeting/SummaryPanel";
import { UploadDropzone } from "../components/meeting/UploadDropzone";
import { TranscriptViewer } from "../components/meeting/TranscriptViewer";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { generateSummary, getHealth, getMeetings, uploadAudio } from "../services/api";
import { HealthResponse, MeetingListItem, MeetingResponse } from "../types/api";

export function Dashboard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<MeetingResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    Promise.all([getHealth(), getMeetings()])
      .then((response) => {
        setHealth(response[0]);
        setMeetings(response[1]);
        setError("");
      })
      .catch(() => {
        setError("Backend is not reachable yet.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadMessage("Uploading audio and generating transcript...");
    setError("");

    try {
      const meeting = await uploadAudio(file);
      setActiveMeeting(meeting);
      setMeetings(await getMeetings());
      setUploadMessage("Transcript saved successfully.");
    } catch (requestError: any) {
      setUploadMessage("");
      setError(requestError?.response?.data?.detail ?? "Upload failed. Check the backend logs and try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerateSummary() {
    if (!activeMeeting) {
      return;
    }

    setSummarizing(true);
    setError("");

    try {
      const summary = await generateSummary(activeMeeting.id);
      setActiveMeeting({ ...activeMeeting, status: "summarized", summary });
      setMeetings((current) =>
        current.map((meeting) =>
          meeting.id === activeMeeting.id
            ? { ...meeting, status: "summarized", has_summary: true, action_item_count: summary.action_items.length }
            : meeting
        )
      );
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail ?? "Summary generation failed.");
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <section className="space-y-6">
        <Card>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Demo-ready workflow</p>
              <h2 className="mt-1 text-3xl font-semibold">Upload, transcribe, summarize, and export meetings.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                A complete local meeting library powered by Groq transcription and strict structured summary output.
              </p>
            </div>
            <FileAudio className="hidden text-blue-600 dark:text-blue-300 md:block" size={42} />
          </div>
        </Card>

        <Card title="Upload Audio">
          <UploadDropzone disabled={uploading} onUpload={handleUpload} />
          {uploading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <LoadingSpinner />
              {uploadMessage}
            </div>
          ) : uploadMessage ? (
            <div className="mt-4">
              <Alert tone="success">{uploadMessage}</Alert>
            </div>
          ) : null}
          {error ? (
            <div className="mt-4">
              <Alert tone="error">{error}</Alert>
            </div>
          ) : null}
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Transcription">
            <p className="text-sm text-slate-600 dark:text-slate-300">Upload validation, storage, and Groq Whisper transcription are active.</p>
          </Card>
          <Card title="Structured Summary">
            <p className="text-sm text-slate-600 dark:text-slate-300">Groq output is constrained to a strict JSON schema and validated server-side.</p>
          </Card>
          <Card title="Meeting Library">
            <p className="text-sm text-slate-600 dark:text-slate-300">New transcripts create persistent history entries.</p>
          </Card>
        </div>

        {activeMeeting?.transcript ? (
          <Card title="Transcript">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <span className="rounded-md bg-slate-100 px-3 py-2 dark:bg-slate-800">
                  {activeMeeting.transcript.word_count} words
                </span>
                <span className="rounded-md bg-slate-100 px-3 py-2 dark:bg-slate-800">
                  {activeMeeting.transcript.speaker_count} speakers
                </span>
                <span className="rounded-md bg-slate-100 px-3 py-2 dark:bg-slate-800">
                  {activeMeeting.summary?.action_items.length ?? 0} actions
                </span>
              </div>
              <Button disabled={summarizing} onClick={handleGenerateSummary}>
                {summarizing ? <LoadingSpinner /> : <Sparkles size={18} />}
                {activeMeeting.summary ? "Refresh Summary" : "Generate Summary"}
              </Button>
            </div>
            <TranscriptViewer transcript={activeMeeting.transcript.transcript} />
          </Card>
        ) : null}

        {activeMeeting?.summary ? <SummaryPanel summary={activeMeeting.summary} /> : null}
      </section>

      <aside className="space-y-6">
        <Card title="System Status">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <LoadingSpinner />
              Checking backend
            </div>
          ) : error ? (
            <Alert tone="error">{error}</Alert>
          ) : (
            <Alert tone="success">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} />
                {health?.app} API is {health?.status}; database {health?.database}.
              </span>
            </Alert>
          )}
        </Card>

        <Card title="Recent Meetings">
          {meetings.length ? (
            <div className="space-y-3">
              {meetings.slice(0, 5).map((meeting) => (
                <Link
                  to="/history"
                  key={meeting.id}
                  className="block rounded-md border border-slate-200 p-3 text-sm transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:hover:border-blue-800 dark:hover:bg-blue-950"
                >
                  <p className="truncate font-medium">{meeting.original_filename}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <ListChecks size={14} />
                      {meeting.status}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={14} />
                      {meeting.word_count} words
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Sparkles size={14} />
                      {meeting.has_summary ? `${meeting.action_item_count} actions` : "no summary"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              <History size={18} />
              No meetings yet.
            </div>
          )}
        </Card>

        <Card title="API Bridge">
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <Server size={18} />
            Axios client configured for FastAPI.
          </div>
        </Card>
      </aside>
    </div>
  );
}
