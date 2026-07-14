import json
import logging

from app.core.config import BASE_DIR, settings
from app.models.meeting import Meeting
from app.models.summary import Summary
from app.schemas.summary import StructuredSummary, SummaryResponse
from app.services.prompt_service import PromptService
from app.services.storage_service import StorageService
from fastapi import HTTPException, status
from groq import Groq, GroqError
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

logger = logging.getLogger("meetwise.summary")


SUMMARY_JSON_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "executive_summary",
        "discussion_points",
        "decisions",
        "action_items",
        "risks",
        "next_meeting",
    ],
    "properties": {
        "executive_summary": {"type": "string"},
        "discussion_points": {"type": "array", "items": {"type": "string"}},
        "decisions": {"type": "array", "items": {"type": "string"}},
        "action_items": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["owner", "task", "deadline"],
                "properties": {
                    "owner": {"type": "string"},
                    "task": {"type": "string"},
                    "deadline": {"type": "string"},
                },
            },
        },
        "risks": {"type": "array", "items": {"type": "string"}},
        "next_meeting": {"type": "array", "items": {"type": "string"}},
    },
}


class SummaryService:
    def __init__(
        self,
        db: Session,
        prompt_service: PromptService | None = None,
        storage: StorageService | None = None,
    ) -> None:
        self.db = db
        self.prompt_service = prompt_service or PromptService()
        self.storage = storage or StorageService(
            upload_dir=BASE_DIR / "uploads",
            transcript_dir=BASE_DIR / "transcripts",
            summary_dir=BASE_DIR / "summaries",
        )

    def generate_summary(self, meeting_id: int) -> SummaryResponse:
        meeting = self._get_meeting_with_transcript(meeting_id)

        if meeting.summary is not None:
            logger.info("Using cached summary for meeting %s", meeting.id)
            return SummaryResponse.model_validate(meeting.summary)

        if meeting.transcript is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Meeting must be transcribed before summarization.",
            )

        structured_summary = self._summarize_transcript(meeting.transcript.transcript)
        summary = Summary(
            meeting_id=meeting.id,
            executive_summary=structured_summary.executive_summary,
            discussion_points=structured_summary.discussion_points,
            decisions=structured_summary.decisions,
            action_items=[item.model_dump() for item in structured_summary.action_items],
            risks=structured_summary.risks,
            next_meeting=structured_summary.next_meeting,
        )

        meeting.status = "summarized"
        self.db.add(summary)
        self.db.commit()
        self.db.refresh(summary)
        self.storage.save_summary(meeting.id, structured_summary.model_dump_json(indent=2))
        logger.info("Generated summary %s for meeting %s", summary.id, meeting.id)

        return SummaryResponse.model_validate(summary)

    def get_summary(self, meeting_id: int) -> SummaryResponse:
        meeting = self._get_meeting_with_transcript(meeting_id)

        if meeting.summary is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found.")

        return SummaryResponse.model_validate(meeting.summary)

    def _summarize_transcript(self, transcript: str) -> StructuredSummary:
        if not settings.groq_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GROQ_API_KEY is not configured. Add it to .env to enable AI summarization.",
            )

        client = Groq(api_key=settings.groq_api_key)
        prompt = self.prompt_service.get_summary_prompt()

        try:
            response = client.chat.completions.create(
                model=settings.summary_model,
                messages=[
                    {
                        "role": "system",
                        "content": prompt,
                    },
                    {
                        "role": "user",
                        "content": f"Meeting transcript:\n\n{transcript}",
                    },
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "meeting_summary",
                        "strict": True,
                        "schema": SUMMARY_JSON_SCHEMA,
                    },
                },
                temperature=0,
            )
        except GroqError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Groq summarization failed: {exc}",
            ) from exc

        output_text = response.choices[0].message.content if response.choices else ""
        return self._parse_structured_output(output_text or "")

    def _parse_structured_output(self, output_text: str) -> StructuredSummary:
        try:
            payload = json.loads(output_text)
            return StructuredSummary.model_validate(payload)
        except (json.JSONDecodeError, ValidationError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Groq returned invalid structured summary JSON.",
            ) from exc

    def _get_meeting_with_transcript(self, meeting_id: int) -> Meeting:
        meeting = self.db.scalar(
            select(Meeting)
            .options(joinedload(Meeting.transcript), joinedload(Meeting.summary))
            .where(Meeting.id == meeting_id)
        )

        if meeting is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")

        return meeting
