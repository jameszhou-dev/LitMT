from typing import List, Optional
from pydantic import BaseModel, Field


class TranslatedBookIn(BaseModel):
    language: str = Field(..., example="French")
    filename: str = Field(..., example="le_grand_gatsby.txt")
    text: Optional[str] = Field(None, example="Translated text content...")
    translated_by: Optional[str] = Field(
        None, example="gpt-4o", description="Model or system that performed the translation"
    )


class TranslatedBookOut(TranslatedBookIn):
    id: str
    book_id: str
    file_id: Optional[str] = None


class BookIn(BaseModel):
    title: str = Field(...)
    author: Optional[str] = Field(None)
    year: Optional[int] = Field(None)
    description: Optional[str] = Field(None)
    original_language: Optional[str] = Field(
        None, example="English", description="The original language of the source text"
    )
    source: Optional[str] = Field(None, example="Original text or source reference")
    translated_books: Optional[List[TranslatedBookIn]] = Field(None)


class BookOut(BookIn):
    id: str
    translated_books: List[TranslatedBookOut] = Field(default_factory=list)
