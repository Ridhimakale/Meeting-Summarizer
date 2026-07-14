from app.core.config import BASE_DIR, settings
import logging
from app.models.meeting import Meeting
from app.models.summary import Summary
from app.models.transcript import Transcript
from app.schemas.meeting import MeetingListItem, MeetingResponse
from app.services.storage_service import StorageService
from app.services.whisper_service import WhisperService
from app.utils.export_helpers import build_meeting_report_pdf, build_summary_text, build_transcript_text
from app.utils.file_helpers import unique_storage_name, validate_audio_file
from fastapi import HTTPException, UploadFile, status
from fastapi.responses import Response
from pathlib import Path
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

logger = logging.getLogger("meetwise.meetings")


class MeetingService:
    def __init__(
        self,
        db: Session,
        storage: StorageService | None = None,
        whisper: WhisperService | None = None,
    ) -> None:
        self.db = db
        self.storage = storage or StorageService(
            upload_dir=BASE_DIR / "uploads",
            transcript_dir=BASE_DIR / "transcripts",
            summary_dir=BASE_DIR / "summaries",
        )
        self.whisper = whisper or WhisperService()
        self.max_bytes = settings.max_upload_mb * 1024 * 1024

    async def upload_and_transcribe(self, file: UploadFile) -> MeetingResponse:
        validate_audio_file(file, self.max_bytes)

        original_filename = file.filename or "meeting-audio"
        stored_filename = unique_storage_name(original_filename)
        audio_path = await self.storage.save_upload(file, stored_filename, self.max_bytes)

        meeting = Meeting(
            filename=stored_filename,
            original_filename=original_filename,
            status="processing",
        )
        self.db.add(meeting)
        self.db.commit()
        self.db.refresh(meeting)
        logger.info("Created meeting %s for %s", meeting.id, original_filename)

        try:
            transcript_text = self.whisper.transcribe(audio_path)
            transcript = Transcript(
                meeting_id=meeting.id,
                transcript=transcript_text,
                word_count=self._count_words(transcript_text),
                speaker_count=self._estimate_speakers(transcript_text),
            )
            meeting.status = "transcribed"
            self.db.add(transcript)
            self.db.commit()
            self.storage.save_transcript(meeting.id, transcript_text)
            logger.info("Transcribed meeting %s with %s words", meeting.id, transcript.word_count)
        except HTTPException:
            meeting.status = "failed"
            self.db.commit()
            logger.warning("Meeting %s failed during transcription", meeting.id)
            raise
        except Exception as exc:
            meeting.status = "failed"
            self.db.commit()
            logger.exception("Unexpected transcription failure for meeting %s", meeting.id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Meeting transcription failed.",
            ) from exc

        return self.get_meeting(meeting.id)

    def list_meetings(self, search: str | None = None) -> list[MeetingListItem]:
        statement = select(Meeting).options(joinedload(Meeting.transcript), joinedload(Meeting.summary))

        if search:
            pattern = f"%{search.strip()}%"
            statement = statement.where(
                Meeting.original_filename.ilike(pattern)
                | Meeting.filename.ilike(pattern)
                | Meeting.transcript.has(Transcript.transcript.ilike(pattern))
                | Meeting.summary.has(Summary.executive_summary.ilike(pattern))
            )

        meetings = self.db.scalars(statement.order_by(Meeting.created_at.desc())).unique()

        return [
            MeetingListItem(
                id=meeting.id,
                filename=meeting.filename,
                original_filename=meeting.original_filename,
                duration=meeting.duration,
                upload_date=meeting.upload_date,
                status=meeting.status,
                created_at=meeting.created_at,
                word_count=meeting.transcript.word_count if meeting.transcript else 0,
                action_item_count=len(meeting.summary.action_items) if meeting.summary else 0,
                has_summary=meeting.summary is not None,
            )
            for meeting in meetings
        ]

    def get_meeting(self, meeting_id: int) -> MeetingResponse:
        meeting = self.db.scalar(
            select(Meeting)
            .options(joinedload(Meeting.transcript), joinedload(Meeting.summary))
            .where(Meeting.id == meeting_id)
        )

        if meeting is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")

        return MeetingResponse.model_validate(meeting)

    def delete_meeting(self, meeting_id: int) -> None:
        meeting = self._get_meeting_model(meeting_id)

        upload_path = BASE_DIR / "uploads" / meeting.filename
        transcript_path = BASE_DIR / "transcripts" / f"meeting-{meeting.id}.txt"
        summary_path = BASE_DIR / "summaries" / f"meeting-{meeting.id}.json"

        self.db.delete(meeting)
        self.db.commit()
        logger.info("Deleted meeting %s", meeting_id)

        for path in [upload_path, transcript_path, summary_path]:
            path.unlink(missing_ok=True)

    def transcript_export(self, meeting_id: int) -> Response:
        meeting = self._get_meeting_model(meeting_id)
        if meeting.transcript is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found.")

        return self._download_response(
            content=build_transcript_text(meeting).encode("utf-8"),
            filename=f"meeting-{meeting.id}-transcript.txt",
            media_type="text/plain; charset=utf-8",
        )

    def summary_export(self, meeting_id: int) -> Response:
        meeting = self._get_meeting_model(meeting_id)
        if meeting.summary is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found.")

        return self._download_response(
            content=build_summary_text(meeting).encode("utf-8"),
            filename=f"meeting-{meeting.id}-summary.txt",
            media_type="text/plain; charset=utf-8",
        )

    def pdf_export(self, meeting_id: int) -> Response:
        meeting = self._get_meeting_model(meeting_id)
        return self._download_response(
            content=build_meeting_report_pdf(meeting),
            filename=f"meeting-{meeting.id}-report.pdf",
            media_type="application/pdf",
        )

    def _get_meeting_model(self, meeting_id: int) -> Meeting:
        meeting = self.db.scalar(
            select(Meeting)
            .options(joinedload(Meeting.transcript), joinedload(Meeting.summary))
            .where(Meeting.id == meeting_id)
        )

        if meeting is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")

        return meeting

    @staticmethod
    def _download_response(content: bytes, filename: str, media_type: str) -> Response:
        return Response(
            content=content,
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    @staticmethod
    def _count_words(text: str) -> int:
        return len([word for word in text.split() if word.strip()])

    @staticmethod
    def _estimate_speakers(text: str) -> int:
        speaker_labels = {
            line.split(":", 1)[0].strip().lower()
            for line in text.splitlines()
            if ":" in line and line.split(":", 1)[0].strip().lower().startswith("speaker")
        }
        return len(speaker_labels)
