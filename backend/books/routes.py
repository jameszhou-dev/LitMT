from typing import List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse
import io
from bson import ObjectId
import motor.motor_asyncio

from .models import BookIn, BookOut, TranslatedBookIn, TranslatedBookOut

router = APIRouter()


@router.post("/books", response_model=BookOut)
async def create_book(book: BookIn, request: Request):
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
            }
            created_translations.append(TranslatedBookOut(**t_out))

    return BookOut(id=str(book_id), translated_books=created_translations, **doc)


@router.post("/books/{book_id}/translations", response_model=TranslatedBookOut)
async def upload_translation(book_id: str, language: str = Form(...), file: UploadFile = File(...), request: Request = None):
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
    }
    tres = await db.translations.insert_one(tdoc)
    if not tres.acknowledged:
        raise HTTPException(status_code=500, detail="Failed to create translation record")

    return TranslatedBookOut(id=str(tres.inserted_id), book_id=book_id, language=language, filename=file.filename, file_id=str(file_id))


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
