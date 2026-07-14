from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ActionItem(BaseModel):
    owner: str = ""
    task: str = ""
    deadline: str = ""


class StructuredSummary(BaseModel):
    executive_summary: str = ""
    discussion_points: list[str] = Field(default_factory=list)
    decisions: list[str] = Field(default_factory=list)
    action_items: list[ActionItem] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    next_meeting: list[str] = Field(default_factory=list)


class SummaryResponse(StructuredSummary):
    id: int
    meeting_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
