from pathlib import Path

from fastapi import HTTPException, UploadFile, status


class StorageService:
    def __init__(self, upload_dir: Path, transcript_dir: Path, summary_dir: Path | None = None) -> None:
        self.upload_dir = upload_dir
        self.transcript_dir = transcript_dir
        self.summary_dir = summary_dir
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.transcript_dir.mkdir(parents=True, exist_ok=True)
        if self.summary_dir is not None:
            self.summary_dir.mkdir(parents=True, exist_ok=True)

    async def save_upload(self, file: UploadFile, filename: str, max_bytes: int) -> Path:
        target_path = self.upload_dir / filename
        total_bytes = 0

        try:
            with target_path.open("wb") as output:
                while chunk := await file.read(1024 * 1024):
                    total_bytes += len(chunk)
                    if total_bytes > max_bytes:
                        target_path.unlink(missing_ok=True)
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail="Audio file is too large for this server.",
                        )
                    output.write(chunk)
        finally:
            await file.close()

        return target_path

    def save_transcript(self, meeting_id: int, transcript: str) -> Path:
        target_path = self.transcript_dir / f"meeting-{meeting_id}.txt"
        target_path.write_text(transcript, encoding="utf-8")
        return target_path

    def save_summary(self, meeting_id: int, summary_json: str) -> Path | None:
        if self.summary_dir is None:
            return None
        target_path = self.summary_dir / f"meeting-{meeting_id}.json"
        target_path.write_text(summary_json, encoding="utf-8")
        return target_path
