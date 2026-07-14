from pathlib import Path

from app.core.config import BASE_DIR


class PromptService:
    def __init__(self, prompt_dir: Path | None = None) -> None:
        self.prompt_dir = prompt_dir or BASE_DIR / "app" / "prompts"

    def get_summary_prompt(self) -> str:
        return (self.prompt_dir / "summary_prompt.txt").read_text(encoding="utf-8")
