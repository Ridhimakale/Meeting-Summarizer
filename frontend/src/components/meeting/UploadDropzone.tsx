import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { FileAudio, UploadCloud, XCircle } from "lucide-react";
import { Button } from "../ui/Button";

type UploadDropzoneProps = {
  disabled?: boolean;
  onUpload: (file: File) => void;
};

const supportedTypes = ".flac,.mp3,.mp4,.mpeg,.mpga,.m4a,.ogg,.wav,.webm";

export function UploadDropzone({ disabled = false, onUpload }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  function chooseFile(file: File | undefined) {
    if (!file) {
      return;
    }

    const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
    const allowed = [".flac", ".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".ogg", ".wav", ".webm"];

    if (!allowed.includes(extension)) {
      setError("Upload flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, or webm audio.");
      setSelectedFile(null);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError("Audio file must be 25 MB or smaller.");
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    chooseFile(event.target.files?.[0]);
  }

  return (
    <div className="space-y-4">
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center transition ${
          dragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
            : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={supportedTypes}
          className="hidden"
          onChange={handleInput}
          disabled={disabled}
        />
        <UploadCloud className="mb-3 text-blue-600 dark:text-blue-300" size={32} />
        <p className="text-base font-semibold">Drop meeting audio here</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">FLAC, MP3, M4A, OGG, WAV, WEBM, MP4 up to 25 MB</p>
        <Button className="mt-4" disabled={disabled} onClick={() => inputRef.current?.click()}>
          <FileAudio size={18} />
          Select Audio
        </Button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          <XCircle size={16} />
          {error}
        </div>
      ) : null}

      {selectedFile ? (
        <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
          <Button disabled={disabled} onClick={() => onUpload(selectedFile)}>
            <UploadCloud size={18} />
            Transcribe
          </Button>
        </div>
      ) : null}
    </div>
  );
}
