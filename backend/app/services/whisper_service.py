from pathlib import Path

from app.core.config import settings
from fastapi import HTTPException, status
from groq import Groq, GroqError


class WhisperService:
    def __init__(self) -> None:
        self.model = settings.transcription_model

    def transcribe(self, audio_path: Path) -> str:
        if not settings.groq_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GROQ_API_KEY is not configured. Add it to .env to enable transcription.",
            )

        client = Groq(api_key=settings.groq_api_key)

        try:
            with audio_path.open("rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    file=audio_file,
                    model=self.model,
                    response_format="text",
                    temperature=0,
                )
        except GroqError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Groq transcription service failed: {exc}",
            ) from exc

        return str(transcription).strip()
