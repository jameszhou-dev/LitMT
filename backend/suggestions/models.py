from typing import Optional
from pydantic import BaseModel, Field


class SuggestionIn(BaseModel):
    title: str = Field(..., description="Proposed book title")
    author: Optional[str] = Field(None, description="Proposed author")
    original_language: Optional[str] = Field(None, description="Original language of the work")
    description: Optional[str] = Field(None, description="Why this book? Context, links, etc.")


class SuggestionOut(SuggestionIn):
    id: str
    submitter_id: Optional[str] = None
    submitter_username: Optional[str] = None
    created_at: str
    # Review/notification flags
    notify_admins: bool = Field(True, description="If true, admin UIs should surface this immediately")
    needs_review: bool = Field(True, description="True until an admin acknowledges the suggestion")
    acknowledged: bool = Field(False, description="Set true once an admin acknowledges the suggestion")
    acknowledged_by: Optional[str] = Field(None, description="Admin username or id who acknowledged")
    acknowledged_at: Optional[str] = Field(None, description="ISO timestamp when acknowledged")
