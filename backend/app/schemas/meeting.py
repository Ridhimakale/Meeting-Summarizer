from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.summary import SummaryResponse


class TranscriptResponse(BaseModel):
    id: int
    meeting_id: int
    transcript: str
    word_count: int
    speaker_count: int

    model_config = ConfigDict(from_attributes=True)


class MeetingListItem(BaseModel):
    id: int
    filename: str
    original_filename: str
    duration: int | None
    upload_date: datetime
    status: str
    created_at: datetime
    word_count: int = 0
    action_item_count: int = 0
    has_summary: bool = False

    model_config = ConfigDict(from_attributes=True)


class MeetingResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    duration: int | None
    upload_date: datetime
    status: str
    created_at: datetime
    transcript: TranscriptResponse | None = None
    summary: SummaryResponse | None = None

    model_config = ConfigDict(from_attributes=True)
