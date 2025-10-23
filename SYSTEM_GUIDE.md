# Book Translation System - Complete Guide

## ✅ System Architecture

### Data Model

Each **Book** contains:

- `id`: Unique book identifier
- `title`: Book title (required)
- `author`: Author name
- `year`: Publication year
- `description`: Book description
- `source`: Original text
- `translated_books`: Array of translations

Each **Translation** contains:

- `id`: Unique translation identifier
- `book_id`: Reference to parent book
- `language`: Language name (e.g., "French", "Spanish")
- `filename`: Original filename
- `file_id`: GridFS file identifier (file is stored in MongoDB)

### Database Structure

MongoDB Database: `litmt`

Collections:

- `books` - Stores book metadata
- `translations` - Stores translation metadata and references to GridFS files
- `fs.files` & `fs.chunks` - GridFS collections for file storage (auto-created)

## 🚀 Running the System

### Start Backend

```bash
cd /Users/jimmyzhou/Desktop/LitMT/backend
python -m uvicorn main:app --port 8080
```

Expected output:

```
🔌 MongoDB Connection: mongodb+srv://...
📚 Database: litmt
✅ MongoDB connected successfully!
INFO:     Uvicorn running on http://127.0.0.1:8080
```

### Start Frontend

```bash
cd /Users/jimmyzhou/Desktop/LitMT/litmt
npm run dev
```

Then open: `http://localhost:3000/manage-book`

## 📖 API Reference

### Create Book

**POST** `/api/books`

```json
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "year": 1925,
  "description": "A classic American novel",
  "source": "In my younger and more vulnerable years..."
}
```

Response:

```json
{
  "id": "68f983e6bb23db7460713378",
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "year": 1925,
  "description": "A classic American novel",
  "source": "In my younger and more vulnerable years...",
  "translated_books": []
}
```

### Upload Translation

**POST** `/api/books/{book_id}/translations`

Form data:

- `language`: string (required) - e.g., "French"
- `file`: file (required) - .txt file containing the translation

Response:

```json
{
  "id": "507f1f77bcf86cd799439011",
  "book_id": "68f983e6bb23db7460713378",
  "language": "French",
  "filename": "gatsby_fr.txt",
  "file_id": "507f1f77bcf86cd799439012"
}
```

### List All Books (with Translations)

**GET** `/api/books?limit=50`

Response:

```json
[
  {
    "id": "68f983e6bb23db7460713378",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "year": 1925,
    "description": "A classic American novel",
    "source": "In my younger and more vulnerable years...",
    "translated_books": [
      {
        "id": "507f1f77bcf86cd799439011",
        "book_id": "68f983e6bb23db7460713378",
        "language": "French",
        "filename": "gatsby_fr.txt",
        "file_id": "507f1f77bcf86cd799439012"
      },
      {
        "id": "507f1f77bcf86cd799439013",
        "book_id": "68f983e6bb23db7460713378",
        "language": "Spanish",
        "filename": "gatsby_es.txt",
        "file_id": "507f1f77bcf86cd799439014"
      }
    ]
  }
]
```

### Download Translation File

**GET** `/api/translations/{translation_id}/file`

Downloads the translation file as attachment (text/plain)

### View Translation Inline

**GET** `/api/translations/{translation_id}/view`

Returns the translation text as text/plain for displaying in browser

### Get Original Source

**GET** `/api/books/{book_id}/source`

Returns the original source text as text/plain

## 🧪 Testing with curl

### 1. Create a book

```bash
curl -X POST http://localhost:8080/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Book",
    "author": "Test Author",
    "year": 2024,
    "description": "A test book",
    "source": "Original text"
  }'
```

### 2. Create a translation file and upload

```bash
# Create test file
echo "This is a French translation" > /tmp/test_fr.txt

# Upload (replace BOOK_ID with the id from step 1)
curl -X POST http://localhost:8080/api/books/BOOK_ID/translations \
  -F "language=French" \
  -F "file=@/tmp/test_fr.txt"
```

### 3. List all books with translations

```bash
curl http://localhost:8080/api/books
```

### 4. Download a translation

```bash
# Replace TRANSLATION_ID with the id from step 2
curl http://localhost:8080/api/translations/TRANSLATION_ID/file
```

## 🎨 Frontend Features

Visit `http://localhost:3000/manage-book`

Features:

- ✅ Add book metadata (title, author, year, description, source text)
- ✅ Add multiple translations
- ✅ Upload .txt file for each translation
- ✅ View upload status and success messages
- ✅ Form auto-resets after successful upload
- ✅ Beautiful styled form with validation

## 🔧 Troubleshooting

### "Creating book..." but no response

1. Check backend is running: `curl http://localhost:8080/api/books`
2. Check browser console (F12) for errors
3. Check backend logs for stack traces

### Translation upload fails

1. Ensure file is .txt format
2. Check language field is filled
3. Verify backend is running and MongoDB is connected
4. Check backend logs: `INFO: 127.0.0.1:... POST /api/books/{id}/translations`

### No data appears in MongoDB

1. Verify connection string is correct (check `.env` file)
2. Check MongoDB cluster is accessible
3. Verify credentials in `.env`
4. Check backend shows "✅ MongoDB connected successfully!" on startup

### Books appear but translations are empty

1. Make sure translations were uploaded after creating book
2. Check book_id matches in translations collection
3. Verify GridFS files were created (`fs.files` and `fs.chunks` collections)

## 📝 Environment Variables

### Backend (.env)

```
MONGO_URI=mongodb+srv://jzhou12:9FrBqLxZOtIC9C2G@litmt.yvtmnxk.mongodb.net/?retryWrites=true&w=majority&appName=litmt
MONGO_DB=litmt
```

### Frontend (.env.local)

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

For production, set `NEXT_PUBLIC_BACKEND_URL` to your production backend URL.

## 📊 Data Flow

```
Frontend (React)
    ↓
    Creates book via POST /api/books
    ↓
Backend (FastAPI)
    ↓
    Stores in MongoDB books collection
    ↓
    Returns book with ID
    ↓
Frontend uploads translation file
    ↓
    POST /api/books/{id}/translations with FormData
    ↓
Backend (FastAPI)
    ↓
    Uploads file to GridFS
    ↓
    Stores translation metadata in translations collection
    ↓
    Returns translation with file_id
    ↓
When listing books:
    ↓
Backend fetches books and joins with translations
    ↓
Converts ObjectIds to strings
    ↓
Returns complete structure with all translations
```

## ✨ Features Summary

✅ Books can have multiple translations
✅ Each translation stores language and file
✅ Files stored in MongoDB GridFS
✅ Download or view translations inline
✅ Full-featured REST API
✅ Beautiful frontend form
✅ Real-time status updates
✅ Form validation
✅ Auto-reset after success
