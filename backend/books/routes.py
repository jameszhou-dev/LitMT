from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request, Depends
from fastapi.responses import StreamingResponse
import io
from bson import ObjectId
import motor.motor_asyncio
from users.auth import require_admin

from .models import BookIn, BookOut, TranslatedBookIn, TranslatedBookOut, SourceUploadResponse, BookUpdate

router = APIRouter()


@router.post("/books", response_model=BookOut)
async def create_book(book: BookIn, request: Request, _: bool = Depends(require_admin)):
    db = request.app.state.db
    doc = book.dict()
    translations = doc.pop('translated_books', []) or []
    
    print(f"📖 Creating book: {book.title} by {book.author}")
    print(f"📝 Document to insert: {doc}")
    
    result = await db.books.insert_one(doc)
    if not result.acknowledged:
        print(f"❌ Failed to insert book")
        raise HTTPException(status_code=500, detail="Failed to insert book")
    
    book_id = result.inserted_id
    print(f"✅ Book created with ID: {book_id}")

    created_translations = []
    for t in translations:
        # Always store DB reference types as ObjectId
        tdoc = {
            'book_id': ObjectId(str(book_id)),
            'language': t.get('language'),
            'filename': t.get('filename'),
            'text': t.get('text'),
            'translated_by': t.get('translated_by'),
        }
        tres = await db.translations.insert_one(tdoc)
        if tres.acknowledged:
            print(f"✅ Translation created: {t.get('language')} (ID: {tres.inserted_id})")
            # Build a safe, serialized payload for the response model
            t_out = {
                'id': str(tres.inserted_id),
                'book_id': str(book_id),
                'language': tdoc.get('language') or '',
                'filename': tdoc.get('filename') or '',
                'text': tdoc.get('text'),
                'file_id': None,
                'translated_by': tdoc.get('translated_by') or None,
            }
            created_translations.append(TranslatedBookOut(**t_out))

    return BookOut(id=str(book_id), translated_books=created_translations, **doc)


@router.put("/books/{book_id}", response_model=BookOut)
async def update_book(book_id: str, payload: BookUpdate, request: Request, _: bool = Depends(require_admin)):
    db = request.app.state.db
    try:
        existing = await db.books.find_one({"_id": ObjectId(book_id)})
    except Exception:
        existing = None
    if not existing:
        raise HTTPException(status_code=404, detail="Book not found")

    updates = {k: v for k, v in payload.dict(exclude_unset=True).items()}
    if not updates:
        # No-op update; return current
        # Also include translations in the response to match BookOut
        translations = []
        try:
            async for tdoc in db.translations.find({'book_id': ObjectId(book_id)}):
                t_out = {
                    'id': str(tdoc.get('_id')),
                    'book_id': str(tdoc.get('book_id')) if tdoc.get('book_id') is not None else '',
                    'language': tdoc.get('language') or '',
                    'filename': tdoc.get('filename') or '',
                    'text': tdoc.get('text'),
                    'file_id': (str(tdoc.get('file_id')) if tdoc.get('file_id') is not None else None),
                    'translated_by': tdoc.get('translated_by'),
                }
                translations.append(TranslatedBookOut(**t_out))
        except Exception:
            pass
        # Normalize ObjectId fields for Pydantic
        existing['id'] = str(existing['_id'])
        existing.pop('_id', None)
        if existing.get('source_file_id') is not None:
            try:
                existing['source_file_id'] = str(existing['source_file_id'])
            except Exception:
                existing['source_file_id'] = None
        return BookOut(**existing, translated_books=translations)

    res = await db.books.update_one({"_id": ObjectId(book_id)}, {"$set": updates})
    if not res.acknowledged:
        raise HTTPException(status_code=500, detail="Failed to update book")

    # Build response
    updated = await db.books.find_one({"_id": ObjectId(book_id)})
    translations = []
    try:
        async for tdoc in db.translations.find({'book_id': ObjectId(book_id)}):
            t_out = {
                'id': str(tdoc.get('_id')),
                'book_id': str(tdoc.get('book_id')) if tdoc.get('book_id') is not None else '',
                'language': tdoc.get('language') or '',
                'filename': tdoc.get('filename') or '',
                'text': tdoc.get('text'),
                'file_id': (str(tdoc.get('file_id')) if tdoc.get('file_id') is not None else None),
                'translated_by': tdoc.get('translated_by'),
            }
            translations.append(TranslatedBookOut(**t_out))
    except Exception:
        pass

    # Normalize ObjectId fields for Pydantic
    updated['id'] = str(updated['_id'])
    updated.pop('_id', None)
    if updated.get('source_file_id') is not None:
        try:
            updated['source_file_id'] = str(updated['source_file_id'])
        except Exception:
            updated['source_file_id'] = None
    return BookOut(**updated, translated_books=translations)


@router.post("/books/{book_id}/translations", response_model=TranslatedBookOut)
async def upload_translation(
    book_id: str,
    language: str = Form(...),
    file: UploadFile = File(...),
    translated_by: Optional[str] = Form(None),
    request: Request = None,
    _: bool = Depends(require_admin),
):
    db = request.app.state.db
    try:
        b = await db.books.find_one({"_id": ObjectId(book_id)})
    except Exception:
        b = None
    if not b:
        raise HTTPException(status_code=404, detail="Book not found")

    content = await file.read()
    bucket = motor.motor_asyncio.AsyncIOMotorGridFSBucket(db)
    file_id = await bucket.upload_from_stream(file.filename, content)

    tdoc = {
        'book_id': ObjectId(book_id),
        'language': language,
        'filename': file.filename,
        'file_id': file_id,
        'translated_by': translated_by,
    }
    tres = await db.translations.insert_one(tdoc)
    if not tres.acknowledged:
        raise HTTPException(status_code=500, detail="Failed to create translation record")

    return TranslatedBookOut(
        id=str(tres.inserted_id),
        book_id=book_id,
        language=language,
        filename=file.filename,
        file_id=str(file_id),
        translated_by=translated_by,
    )


@router.get("/translations/{translation_id}/file")
async def download_translation_file(translation_id: str, request: Request):
    db = request.app.state.db
    try:
        t = await db.translations.find_one({"_id": ObjectId(translation_id)})
    except Exception:
        t = None
    if not t:
        raise HTTPException(status_code=404, detail="Translation not found")

    file_id = t.get('file_id')
    if not file_id:
        raise HTTPException(status_code=404, detail="No file for this translation")

    bucket = motor.motor_asyncio.AsyncIOMotorGridFSBucket(db)
    try:
        stream = await bucket.open_download_stream(ObjectId(file_id))
        data = await stream.read()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read file from storage")

    return StreamingResponse(
        io.BytesIO(data),
        media_type='text/plain',
        headers={
            'Content-Disposition': f'attachment; filename="{t.get("filename","translation.txt")}"'
        }
    )



@router.get("/translations/{translation_id}/view")
async def view_translation_inline(translation_id: str, request: Request):
    """Return the translation text inline (text/plain) so frontends can display it."""
    db = request.app.state.db
    try:
        t = await db.translations.find_one({"_id": ObjectId(translation_id)})
    except Exception:
        t = None
    if not t:
        raise HTTPException(status_code=404, detail="Translation not found")

    file_id = t.get('file_id')
    if not file_id:
        raise HTTPException(status_code=404, detail="No file for this translation")

    bucket = motor.motor_asyncio.AsyncIOMotorGridFSBucket(db)
    try:
        stream = await bucket.open_download_stream(ObjectId(file_id))
        data = await stream.read()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to read file from storage")

    return StreamingResponse(io.BytesIO(data), media_type='text/plain')


@router.post("/translations/{translation_id}/file", response_model=TranslatedBookOut)
async def replace_translation_file(
    translation_id: str,
    file: UploadFile = File(...),
    request: Request = None,
    _: bool = Depends(require_admin),
):
    """Replace the file content of an existing translation. Stores the file in GridFS and updates the translation doc."""
    db = request.app.state.db
    try:
        t = await db.translations.find_one({"_id": ObjectId(translation_id)})
    except Exception:
        t = None
    if not t:
        raise HTTPException(status_code=404, detail="Translation not found")

    content = await file.read()
    bucket = motor.motor_asyncio.AsyncIOMotorGridFSBucket(db)

    # Remove prior file if it exists
    old_id = t.get('file_id')
    if old_id:
        try:
            await bucket.delete(ObjectId(old_id))
        except Exception:
            # Non-fatal if delete fails
            pass

    new_file_id = await bucket.upload_from_stream(file.filename, content)

    await db.translations.update_one(
        {"_id": ObjectId(translation_id)},
        {"$set": {"file_id": new_file_id, "filename": file.filename}}
    )

    return TranslatedBookOut(
        id=translation_id,
        book_id=str(t.get('book_id')) if t.get('book_id') is not None else '',
        language=t.get('language') or '',
        filename=file.filename,
        file_id=str(new_file_id),
        translated_by=t.get('translated_by'),
    )


@router.get("/books/{book_id}/source")
async def view_book_source(book_id: str, request: Request):
    """Return the original book source as text/plain. If the book stores a GridFS file, stream that; otherwise return the `source` field."""
    db = request.app.state.db
    try:
        b = await db.books.find_one({"_id": ObjectId(book_id)})
    except Exception:
        b = None
    if not b:
        raise HTTPException(status_code=404, detail="Book not found")

    # If a GridFS file id is stored on the book as 'source_file_id', stream it
    source_file_id = b.get('source_file_id')
    if source_file_id:
        bucket = motor.motor_asyncio.AsyncIOMotorGridFSBucket(db)
        try:
            stream = await bucket.open_download_stream(ObjectId(source_file_id))
            data = await stream.read()
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to read source file from storage")
        return StreamingResponse(io.BytesIO(data), media_type='text/plain')

    # Otherwise return the source text stored on the document (if any)
    src = b.get('source') or ''
    return StreamingResponse(io.BytesIO(src.encode('utf-8')), media_type='text/plain')


@router.post("/books/{book_id}/source", response_model=SourceUploadResponse)
async def upload_book_source(
    book_id: str,
    file: UploadFile = File(...),
    request: Request = None,
    _: bool = Depends(require_admin),
):
    """Upload or replace the original source as a text file (.txt). Stores the file in GridFS and updates the book doc."""
    db = request.app.state.db
    try:
        b = await db.books.find_one({"_id": ObjectId(book_id)})
    except Exception:
        b = None
    if not b:
        raise HTTPException(status_code=404, detail="Book not found")

    # Read file and store in GridFS
    content = await file.read()
    bucket = motor.motor_asyncio.AsyncIOMotorGridFSBucket(db)

    # If an existing source file exists, try to delete it to avoid orphaned files
    old_id = b.get('source_file_id')
    if old_id:
        try:
            await bucket.delete(ObjectId(old_id))
        except Exception:
            # Non-fatal if deletion fails; continue to upload new
            pass

    new_file_id = await bucket.upload_from_stream(file.filename, content)

    # Update book document with new file id and filename
    await db.books.update_one(
        {"_id": ObjectId(book_id)},
        {"$set": {"source_file_id": new_file_id, "source_filename": file.filename}}
    )

    return SourceUploadResponse(id=book_id, source_file_id=str(new_file_id), source_filename=file.filename)


@router.get("/books", response_model=List[BookOut])
async def list_books(limit: int = 50, request: Request = None):
    db = request.app.state.db
    items: List[BookOut] = []
    try:
        cursor = db.books.find().limit(limit)
        async for doc in cursor:
            # Serialize book document
            doc['id'] = str(doc['_id'])
            doc.pop('_id', None)
            # Normalize ObjectId fields for Pydantic
            if doc.get('source_file_id') is not None:
                try:
                    doc['source_file_id'] = str(doc['source_file_id'])
                except Exception:
                    doc['source_file_id'] = None
            # fetch translations for this book
            translations = []
            try:
                trans_cursor = db.translations.find({'book_id': ObjectId(doc['id'])})
                async for tdoc in trans_cursor:
                    try:
                        # Build a fully serialized translation object for the response model
                        t_out = {
                            'id': str(tdoc.get('_id')),
                            'book_id': str(tdoc.get('book_id')) if tdoc.get('book_id') is not None else '',
                            'language': tdoc.get('language') or '',
                            'filename': tdoc.get('filename') or '',
                            'text': tdoc.get('text'),
                            'file_id': (str(tdoc.get('file_id')) if tdoc.get('file_id') is not None else None),
                            'translated_by': tdoc.get('translated_by'),
                        }
                        translations.append(TranslatedBookOut(**t_out))
                    except Exception as e:
                        # Log and skip malformed translation records instead of failing the entire request
                        print(f"⚠️  Skipping malformed translation {_safe_id(tdoc)}: {e}")
                        continue
            except Exception as e:
                print(f"⚠️  Failed to read translations for book {doc.get('id')}: {e}")

            try:
                items.append(BookOut(**doc, translated_books=translations))
            except Exception as e:
                print(f"⚠️  Skipping malformed book {doc.get('id')}: {e}")
                continue
        return items
    except Exception as e:
        # Ensure CORS headers are still applied by returning a handled error
        print(f"❌ Database error while listing books: {e}")
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Database unavailable")


def _safe_id(d: dict):
    try:
        return str(d.get('_id'))
    except Exception:
        return "<unknown>"


@router.delete("/books/{book_id}")
async def delete_book(book_id: str, request: Request, _: bool = Depends(require_admin)):
    """Delete a book and its related resources.
    - Removes the book document
    - Removes all translations for the book
    - Deletes any associated GridFS files (book source_file_id and translation file_id)
    """
    db = request.app.state.db
    # Find the book
    try:
        book = await db.books.find_one({"_id": ObjectId(book_id)})
    except Exception:
        book = None
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    bucket = motor.motor_asyncio.AsyncIOMotorGridFSBucket(db)

    # Delete book's original source file if present
    src_id = book.get("source_file_id")
    if src_id:
        try:
            await bucket.delete(ObjectId(src_id))
        except Exception:
            # Non-fatal: log and continue
            pass

    # Collect translations and delete their files
    try:
        async for tdoc in db.translations.find({"book_id": ObjectId(book_id)}):
            fid = tdoc.get("file_id")
            if fid:
                try:
                    await bucket.delete(ObjectId(fid))
                except Exception:
                    pass
    except Exception:
        # Continue even if listing translations fails
        pass

    # Remove translation documents
    try:
        await db.translations.delete_many({"book_id": ObjectId(book_id)})
    except Exception:
        # Non-fatal
        pass

    # Finally remove the book document
    res = await db.books.delete_one({"_id": ObjectId(book_id)})
    if not res.acknowledged:
        raise HTTPException(status_code=500, detail="Failed to delete book")

    return {"status": "deleted", "id": book_id}
