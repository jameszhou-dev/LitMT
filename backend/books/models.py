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
    # Optional inline source text (legacy). Prefer uploading a .txt via /books/{id}/source
    source: Optional[str] = Field(
        None,
        example="Original text content...",
        description="Inline original source text (legacy); prefer uploading a .txt file."
    )
    # Optional filename metadata if provided at creation time (no file upload in this payload)
    source_filename: Optional[str] = Field(
        None,
        example="original_source.txt",
        description="Filename of the original source when uploaded as a file."
    )
    translated_books: Optional[List[TranslatedBookIn]] = Field(None)


class BookOut(BookIn):
    id: str
    # Present if the original source was uploaded to GridFS
    source_file_id: Optional[str] = Field(
        None,
        example="664b3cfe2f8b9c4b1a23d4ef",
        description="GridFS file id for the original source text file"
    )
    source_filename: Optional[str] = Field(
        None,
        example="original_source.txt",
        description="Original source filename"
    )
    translated_books: List[TranslatedBookOut] = Field(default_factory=list)


class SourceUploadResponse(BaseModel):
    id: str = Field(..., description="Book id")
    source_file_id: str = Field(..., description="GridFS file id for the uploaded source file")
    source_filename: str = Field(..., description="Stored filename for the uploaded source file")


class BookUpdate(BaseModel):
    """Partial update model for a book. All fields are optional; only provided fields will be updated."""
    title: Optional[str] = None
    author: Optional[str] = None
    year: Optional[int] = None
    description: Optional[str] = None
    original_language: Optional[str] = None
    # Do not allow updating translated_books via this model
    # Source file is handled by a separate endpoint; legacy inline source can be updated if provided
    source: Optional[str] = None
    source_filename: Optional[str] = None
