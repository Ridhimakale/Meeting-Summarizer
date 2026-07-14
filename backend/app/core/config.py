from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "MeetWise AI"
    database_url: str = "sqlite:///./database.db"
    frontend_origin: str = "http://localhost:5173"
    groq_api_key: str = ""
    max_upload_mb: int = 25
    transcription_model: str = "whisper-large-v3-turbo"
    summary_model: str = "openai/gpt-oss-20b"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR.parent / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
