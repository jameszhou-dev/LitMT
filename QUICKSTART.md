# Quick Start - Book Translation System

## 🚀 Start Services

### Terminal 1 - Backend

```bash
cd /Users/jimmyzhou/Desktop/LitMT/backend
python -m uvicorn main:app --port 8080
```

### Terminal 2 - Frontend

```bash
cd /Users/jimmyzhou/Desktop/LitMT/litmt
npm run dev
```

## 📱 Access Application

**Manage Books Page**: http://localhost:3000/manage-book

## 📚 How to Use

1. **Fill Book Information**

   - Title (required)
   - Author, Year, Description (optional)
   - Original Source Text (optional)

2. **Add Translations**

   - Click "Add Translation"
   - Enter Language (e.g., "French", "Spanish")
   - Upload .txt file with the translation
   - Add as many as you want

3. **Create Book**
   - Click "Create Book"
   - Wait for success message
   - Form will reset automatically

## ✨ Data Structure

```
Book {
  id: "507f1f77bcf86cd799439010"
  title: "The Great Gatsby"
  author: "F. Scott Fitzgerald"
  year: 1925
  description: "..."
  source: "..."
  translated_books: [
    {
      id: "507f1f77bcf86cd799439011"
      language: "French"
      filename: "gatsby_fr.txt"
      file_id: "507f1f77bcf86cd799439012"
    },
    {
      id: "507f1f77bcf86cd799439013"
      language: "Spanish"
      filename: "gatsby_es.txt"
      file_id: "507f1f77bcf86cd799439014"
    }
  ]
}
```

## 🔗 API Endpoints

| Method | Endpoint                       | Purpose                          |
| ------ | ------------------------------ | -------------------------------- |
| POST   | `/api/books`                   | Create book                      |
| GET    | `/api/books`                   | List all books with translations |
| POST   | `/api/books/{id}/translations` | Upload translation               |
| GET    | `/api/books/{id}/source`       | Get original text                |
| GET    | `/api/translations/{id}/view`  | View translation                 |
| GET    | `/api/translations/{id}/file`  | Download translation             |

## 📦 Tech Stack

- **Backend**: FastAPI (Python)
- **Database**: MongoDB Atlas (Cloud)
- **File Storage**: MongoDB GridFS
- **Frontend**: Next.js (React)
- **Styling**: Inline CSS (can be enhanced)

## 🔍 Debug Commands

```bash
# Check backend is running
curl http://localhost:8080/api/books

# Create a test book
curl -X POST http://localhost:8080/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","author":"Author"}'

# List all books
curl http://localhost:8080/api/books | python3 -m json.tool
```

## ⚙️ Configuration

**Backend** - `/backend/.env`:

```
MONGO_URI=mongodb+srv://jzhou12:...@litmt.yvtmnxk.mongodb.net/...
MONGO_DB=litmt
```

**Frontend** - `/litmt/.env.local` (optional):

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

## 📝 Notes

- Books are stored in MongoDB `litmt` database
- Translation files are stored in GridFS (auto-managed by MongoDB)
- Each translation has language, filename, and file reference
- Files are .txt format but can be extended
- Frontend auto-connects to backend at http://localhost:8080

---

**Everything is set up and ready to use! 🎉**
