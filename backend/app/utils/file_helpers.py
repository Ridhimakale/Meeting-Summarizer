import re
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

SUPPORTED_AUDIO_EXTENSIONS = {".flac", ".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".ogg", ".wav", ".webm"}
SUPPORTED_AUDIO_MIME_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/mp4a-latm",
    "audio/flac",
    "audio/ogg",
    "audio/x-m4a",
    "audio/wav",
    "audio/x-wav",
    "audio/webm",
    "video/mp4",
    "video/webm",
}


def sanitize_filename(filename: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", filename).strip("._")
    return cleaned or "meeting-audio"


def validate_audio_file(file: UploadFile, max_bytes: int) -> None:
    original_name = file.filename or ""
    extension = Path(original_name).suffix.lower()

    if extension not in SUPPORTED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Upload flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, or webm audio.",
        )

    if file.content_type and file.content_type not in SUPPORTED_AUDIO_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported MIME type for audio upload.",
        )

    size = getattr(file, "size", None)
    if size is not None and size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Audio file is too large for this server.",
        )


def unique_storage_name(filename: str) -> str:
    original = sanitize_filename(filename)
    extension = Path(original).suffix.lower()
    stem = Path(original).stem or "meeting-audio"
    return f"{stem}-{uuid4().hex}{extension}"
