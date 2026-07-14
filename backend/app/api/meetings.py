from app.database.session import get_db
from app.schemas.meeting import MeetingListItem, MeetingResponse
from app.schemas.summary import SummaryResponse
from app.services.meeting_service import MeetingService
from app.services.summary_service import SummaryService
from fastapi import APIRouter, Depends, File, Query, Response, UploadFile, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["meetings"])


def get_meeting_service(db: Session = Depends(get_db)) -> MeetingService:
    return MeetingService(db)


def get_summary_service(db: Session = Depends(get_db)) -> SummaryService:
    return SummaryService(db)


@router.post("/upload", response_model=MeetingResponse, status_code=201)
async def upload_audio(
    file: UploadFile = File(...),
    service: MeetingService = Depends(get_meeting_service),
) -> MeetingResponse:
    return await service.upload_and_transcribe(file)


@router.get("/meetings", response_model=list[MeetingListItem])
def list_meetings(
    search: str | None = Query(default=None),
    service: MeetingService = Depends(get_meeting_service),
) -> list[MeetingListItem]:
    return service.list_meetings(search=search)


@router.get("/meeting/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: int,
    service: MeetingService = Depends(get_meeting_service),
) -> MeetingResponse:
    return service.get_meeting(meeting_id)


@router.delete("/meeting/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: int,
    service: MeetingService = Depends(get_meeting_service),
) -> Response:
    service.delete_meeting(meeting_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/meeting/{meeting_id}/summary", response_model=SummaryResponse, status_code=201)
def generate_summary(
    meeting_id: int,
    service: SummaryService = Depends(get_summary_service),
) -> SummaryResponse:
    return service.generate_summary(meeting_id)


@router.get("/meeting/{meeting_id}/summary", response_model=SummaryResponse)
def get_summary(
    meeting_id: int,
    service: SummaryService = Depends(get_summary_service),
) -> SummaryResponse:
    return service.get_summary(meeting_id)


@router.get("/download/transcript/{meeting_id}")
def download_transcript(
    meeting_id: int,
    service: MeetingService = Depends(get_meeting_service),
) -> Response:
    return service.transcript_export(meeting_id)


@router.get("/download/summary/{meeting_id}")
def download_summary(
    meeting_id: int,
    service: MeetingService = Depends(get_meeting_service),
) -> Response:
    return service.summary_export(meeting_id)


@router.get("/download/pdf/{meeting_id}")
def download_pdf(
    meeting_id: int,
    service: MeetingService = Depends(get_meeting_service),
) -> Response:
    return service.pdf_export(meeting_id)
