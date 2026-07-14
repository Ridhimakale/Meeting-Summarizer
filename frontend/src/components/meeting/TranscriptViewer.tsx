import { Search } from "lucide-react";
import { useMemo, useState } from "react";

type TranscriptViewerProps = {
  transcript: string;
};

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  const [query, setQuery] = useState("");

  const visibleTranscript = useMemo(() => {
    if (!query.trim()) {
      return transcript;
    }

    return transcript
      .split(/\n+/)
      .filter((line) => line.toLowerCase().includes(query.trim().toLowerCase()))
      .join("\n");
  }, [query, transcript]);

  return (
    <div className="space-y-3">
      <label className="flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
        <Search size={16} className="text-slate-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search transcript"
          className="h-full flex-1 bg-transparent text-sm outline-none"
        />
      </label>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-sm leading-6 text-slate-100">
        {visibleTranscript || "No matching transcript lines."}
      </pre>
    </div>
  );
}
