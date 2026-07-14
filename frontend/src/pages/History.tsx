import {
  Download,
  FileDown,
  History as HistoryIcon,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SummaryPanel } from "../components/meeting/SummaryPanel";
import { TranscriptViewer } from "../components/meeting/TranscriptViewer";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { deleteMeeting, downloadUrl, generateSummary, getMeeting, getMeetings } from "../services/api";
import { MeetingListItem, MeetingResponse } from "../types/api";

export function History() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingResponse | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    refreshMeetings();
  }, []);

  async function refreshMeetings(search = query) {
    setLoading(true);
    try {
      const meetingList = await getMeetings(search);
      setMeetings(meetingList);
      setError("");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail ?? "Could not load meeting history.");
    } finally {
      setLoading(false);
    }
  }

  async function openMeeting(meetingId: number) {
    setDetailLoading(true);
    try {
      setSelectedMeeting(await getMeeting(meetingId));
      setError("");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail ?? "Could not load meeting details.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function summarizeSelected() {
    if (!selectedMeeting) {
      return;
    }

    setSummarizing(true);
    try {
      const summary = await generateSummary(selectedMeeting.id);
      setSelectedMeeting({ ...selectedMeeting, status: "summarized", summary });
      setMeetings((current) =>
        current.map((meeting) =>
          meeting.id === selectedMeeting.id
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

  async function removeSelected() {
    if (!selectedMeeting) {
      return;
    }

    setDeleting(true);
    try {
      await deleteMeeting(selectedMeeting.id);
      setMeetings((current) => current.filter((meeting) => meeting.id !== selectedMeeting.id));
      setSelectedMeeting(null);
      setError("");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail ?? "Could not delete meeting.");
    } finally {
      setDeleting(false);
    }
  }

  const activeStats = useMemo(() => {
    if (!selectedMeeting) {
      return null;
    }

    return {
      words: selectedMeeting.transcript?.word_count ?? 0,
      speakers: selectedMeeting.transcript?.speaker_count ?? 0,
      actions: selectedMeeting.summary?.action_items.length ?? 0,
    };
  }, [selectedMeeting]);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.4fr]">
      <section className="space-y-5">
        <Card title="Meeting History">
          <form
            className="mb-4 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              refreshMeetings(query);
            }}
          >
            <label className="flex h-10 flex-1 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
              <Search size={16} className="text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search meetings and transcripts"
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <LoadingSpinner />
              Loading meetings
            </div>
          ) : meetings.length ? (
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <button
                  key={meeting.id}
                  onClick={() => openMeeting(meeting.id)}
                  className={`w-full rounded-md border p-4 text-left text-sm transition ${
                    selectedMeeting?.id === meeting.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                  }`}
                >
                  <p className="truncate font-semibold">{meeting.original_filename}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>{meeting.status}</span>
                    <span>{meeting.word_count} words</span>
                    <span>{meeting.has_summary ? `${meeting.action_item_count} actions` : "no summary"}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              <HistoryIcon size={18} />
              No saved meetings found.
            </div>
          )}
        </Card>
        {error ? <Alert tone="error">{error}</Alert> : null}
      </section>

      <section className="space-y-5">
        {!selectedMeeting ? (
          <Card>
            <div className="flex min-h-72 items-center justify-center text-center text-sm text-slate-500 dark:text-slate-400">
              Select a meeting to view transcript, summary, exports, and delete controls.
            </div>
          </Card>
        ) : detailLoading ? (
          <Card>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <LoadingSpinner />
              Loading meeting details
            </div>
          </Card>
        ) : (
          <>
            <Card>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Meeting Details</p>
                  <h2 className="mt-1 truncate text-2xl font-semibold">{selectedMeeting.original_filename}</h2>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span>{selectedMeeting.status}</span>
                    <span>{activeStats?.words} words</span>
                    <span>{activeStats?.speakers} speakers</span>
                    <span>{activeStats?.actions} actions</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={downloadUrl("transcript", selectedMeeting.id)}>
                    <Button variant="secondary">
                      <Download size={16} />
                      TXT
                    </Button>
                  </a>
                  {selectedMeeting.summary ? (
                    <a href={downloadUrl("summary", selectedMeeting.id)}>
                      <Button variant="secondary">
                        <Sparkles size={16} />
                        Summary
                      </Button>
                    </a>
                  ) : (
                    <Button variant="secondary" disabled>
                      <Sparkles size={16} />
                      Summary
                    </Button>
                  )}
                  <a href={downloadUrl("pdf", selectedMeeting.id)}>
                    <Button variant="secondary">
                      <FileDown size={16} />
                      PDF
                    </Button>
                  </a>
                  <Button disabled={summarizing || !selectedMeeting.transcript} onClick={summarizeSelected}>
                    {summarizing ? <LoadingSpinner /> : <Sparkles size={16} />}
                    {selectedMeeting.summary ? "Use Cached Summary" : "Summarize"}
                  </Button>
                  <Button
                    className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950"
                    disabled={deleting}
                    variant="secondary"
                    onClick={removeSelected}
                  >
                    {deleting ? <LoadingSpinner /> : <Trash2 size={16} />}
                    Delete
                  </Button>
                </div>
              </div>
            </Card>

            {selectedMeeting.transcript ? (
              <Card title="Searchable Transcript">
                <TranscriptViewer transcript={selectedMeeting.transcript.transcript} />
              </Card>
            ) : (
              <Alert tone="info">This meeting does not have a transcript yet.</Alert>
            )}

            {selectedMeeting.summary ? (
              <SummaryPanel summary={selectedMeeting.summary} />
            ) : (
              <Card title="Summary">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Generate a structured summary to unlock decisions, action items, risks, and exports.
                </p>
              </Card>
            )}
          </>
        )}
      </section>
    </div>
  );
}
