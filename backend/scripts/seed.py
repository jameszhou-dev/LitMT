"""
Seed the database with example books and translations.

Usage (local):
  cd backend && python scripts/seed.py

Usage (Docker):
  # If using docker compose for dev, run inside the backend container
  docker compose exec backend python scripts/seed.py

Environment variables:
  MONGO_URI (default: mongodb://localhost:27017)
  MONGO_DB  (default: litmt)
"""

import os
import asyncio
from datetime import datetime
from typing import List, Dict, Any
from bson import ObjectId
import motor.motor_asyncio

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.environ.get("MONGO_DB", "litmt")


def sample_data() -> List[Dict[str, Any]]:
    """Return a list of books with inline translations to seed."""
    now = datetime.utcnow()
    return [
        {
            "title": "Journey to the West",
            "author": "Wu Cheng'en",
            "description": "A classic Chinese novel following the pilgrimage of Xuanzang and his companions.",
            "original_language": "Chinese",
            "year": 1592,
            "source": "《西遊記》節選：話說唐僧師徒西天取經途中的一段奇遇……",
            "created_at": now,
            "updated_at": now,
            "translations": [
                {
                    "language": "English",
                    "translated_by": "gpt-4o",
                    "text": "An excerpt describing a curious episode on the road to the West…",
                },
                {
                    "language": "French",
                    "translated_by": "Mistral Large",
                    "text": "Un extrait décrivant un épisode curieux sur la route de l’Ouest…",
                },
            ],
        },
        {
            "title": "Crime and Punishment",
            "author": "Fyodor Dostoevsky",
            "description": "A psychological novel exploring morality, guilt, and redemption.",
            "original_language": "Russian",
            "year": 1866,
            "source": "Отрывок из романа, описывающий внутреннюю борьбу Раскольникова…",
            "created_at": now,
            "updated_at": now,
            "translations": [
                {
                    "language": "English",
                    "translated_by": "Human Translator",
                    "text": "An excerpt depicting Raskolnikov’s inner turmoil…",
                },
                {
                    "language": "Spanish",
                    "translated_by": "gpt-4o",
                    "text": "Un pasaje que muestra el conflicto interno de Raskólnikov…",
                },
            ],
        },
        {
            "title": "The Tale of Genji",
            "author": "Murasaki Shikibu",
            "description": "A classic of Japanese literature focusing on court life and romance.",
            "original_language": "Japanese",
            "year": 1021,
            "source": "源氏物語 抜粋：光源氏の物語の一節…",
            "created_at": now,
            "updated_at": now,
            "translations": [
                {
                    "language": "English",
                    "translated_by": "Claude-3.5-Sonnet",
                    "text": "An excerpt from the life and loves of Hikaru Genji…",
                }
            ],
        },
    ]


async def upsert_book_with_translations(db):
    books = sample_data()
    inserted_books = 0
    inserted_translations = 0

    for b in books:
        # Check for existing book by title + author
        existing = await db.books.find_one({
            "title": b["title"],
            "author": b["author"],
        })

        book_doc = {k: v for k, v in b.items() if k != "translations"}

        if existing:
            # Update metadata timestamp only
            await db.books.update_one({"_id": existing["_id"]}, {"$set": {"updated_at": datetime.utcnow()}})
            book_id = existing["_id"]
            print(f"↻ Book exists, updated timestamp: {b['title']} ({book_id})")
        else:
            res = await db.books.insert_one(book_doc)
            book_id = res.inserted_id
            inserted_books += 1
            print(f"✓ Inserted book: {b['title']} ({book_id})")

        # Seed translations (inline text)
        for t in b.get("translations", []):
            existing_t = await db.translations.find_one({
                "book_id": ObjectId(book_id),
                "language": t["language"],
            })
            if existing_t:
                print(f"  ↻ Translation exists for {t['language']}")
                continue

            tdoc = {
                "book_id": ObjectId(book_id),
                "language": t["language"],
                "filename": f"{b['title']} - {t['language']}.txt",
                "file_id": None,  # not using GridFS for seed; inline text only
                "text": t.get("text"),
                "translated_by": t.get("translated_by"),
            }
            tres = await db.translations.insert_one(tdoc)
            inserted_translations += 1
            print(f"  ✓ Inserted translation: {t['language']} ({tres.inserted_id})")

    return inserted_books, inserted_translations


async def main():
    print(f"🔗 Connecting to Mongo at {MONGO_URI} / db={MONGO_DB}")
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
    db = client[MONGO_DB]

    before_books = await db.books.count_documents({})
    before_trans = await db.translations.count_documents({})
    print(f"📚 Before: books={before_books}, translations={before_trans}")

    b_added, t_added = await upsert_book_with_translations(db)

    after_books = await db.books.count_documents({})
    after_trans = await db.translations.count_documents({})
    print(f"✅ After: books={after_books} (+{b_added}), translations={after_trans} (+{t_added})")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
