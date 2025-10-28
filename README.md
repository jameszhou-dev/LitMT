
LitMT consists of a Next.js frontend and a FastAPI backend backed by MongoDB. 

- Frontend: `litmt/` (Next.js App Router, TypeScript, Tailwind)
- Backend: `backend/` (FastAPI, Motor/MongoDB, JWT)
- Database: MongoDB (runs locally or via Docker)

- Browse Library (requires sign-in)
- Book detail pages with available translations and original source view
- Admin-only: manage books and upload translations
- JWT-based authentication with UI and server-side authorization guards
- Accessible, responsive header with profile menu and admin links

## Tech Stack

- Frontend: Next.js 15, React 19, TailwindCSS 4
- Backend: FastAPI, Uvicorn, Motor (MongoDB), PyJWT, bcrypt
- DB: MongoDB 6
- Dev tooling: Docker Compose (optional)

## App Flow

1. Sign In / Create Account

   - User registers or logs in; backend issues a JWT with `isadmin` claim.
   - Frontend stores `{ user, token }` in `localStorage` and dispatches a `userLoggedIn` event.

2. Library

   - Accessible to signed-in users; fetches books from `/api/books`.
   - Search by title, author, or original language.

3. Book Detail

   - Route: `/book/[id]`. Shows metadata, list of translations, and links to view or download.
   - "View Original" opens the original text at `/api/books/{id}/source`.

4. Admin Controls

- Header shows “Add Book” if `user.isadmin` is truthy.
- Mutating endpoints require a valid admin JWT (server-guarded).

## Frontend

- Folder: `litmt/`
- Notable routes (App Router):
  - `/` Landing: shows “Browse Library” only for signed-in users; otherwise shows Sign In / Create Account CTAs.
  - `/sign-in`, `/create-account` Authentication pages.
  - `/library` Auth-guarded; redirects to sign-in if unauthenticated.
  - `/book/[id]` Book detail with translations and original source link.
  - `/addbook` Admin-only add-book page.
- Header (`src/app/_components/Header.tsx`):
  - Detects login and admin state from `localStorage`.
  - Profile menu with Profile and Logout.
  - Admin links in both desktop and mobile menus.

Environment (frontend)

- `NEXT_PUBLIC_BACKEND_URL` (e.g., `http://localhost:8080`)

## Backend

- Folder: `backend/`
- Entrypoint: `main.py`
- Mongo connection via env vars; exposes `/api` routes.

Environment (backend)

- `MONGO_URI` (default `mongodb://localhost:27017` for native; `mongodb://mongo:27017/litmt` in Docker)
- `MONGO_DB` (default `litmt`)
- `CORS_ALLOW_ORIGINS` (comma-separated; default allows `http://localhost:3000`)
- `JWT_SECRET` (required; set this to a long random string)
- `JWT_ALGORITHM` (default `HS256`)
- `JWT_EXPIRES_MIN` (token lifetime in minutes)

### Data Models (simplified)

- Book

  - `id` (string)
  - `title`, `author`, `description?`, `year?`
  - `original_language?`
  - `source?` or `source_file_id?` (for original text)
  - `translated_books: Translation[]`

- Translation

  - `id` (string)
  - `book_id` (string)
  - `language` (string)
  - `filename?`, `file_id?` (GridFS)
  - `text?` (optional inline text)
  - `translated_by?` (model name or translator)

- SuggestedBook
  - `id` (string)
  - `title`, `author?`, `original_language?`, `description?`
  - `submitter_id?`, `submitter_username?`, `created_at` (ISO)
  - `notify_admins` (bool, default true)
  - `needs_review` (bool, default true)
  - `acknowledged` (bool), `acknowledged_by?`, `acknowledged_at?`

### API Endpoints (selected)

Prefix: `/api`

- Users (`backend/users/routes.py`)

  - `POST /users/register` → create a user
  - `POST /users/login` → returns `{ access_token, token_type: "bearer", user }` with `isadmin`
  - `GET /users/` → list users
  - `GET /users/{user_id}` → get user
  - `PUT /users/{user_id}` → update user
  - `DELETE /users/{user_id}` → delete user

- Books and Translations (`backend/books/routes.py`)

  - `GET /books` → list books with embedded translations
  - `POST /books` (admin JWT) → create a book (can include initial translations)
  - `POST /books/{book_id}/translations` (admin JWT, multipart) → upload a translation file (`language`, `file`, optional `translated_by`)
  - `GET /translations/{translation_id}/view` → text/plain inline view of translation
  - `GET /translations/{translation_id}/file` → download translation file
  - `GET /books/{book_id}/source` → view original source (inline text or GridFS file)

- Suggestions (`backend/suggestions/routes.py`)
  - `POST /suggestions` (auth required) → create a suggested book; sets `notify_admins=true`, `needs_review=true`
  - `GET /suggestions?only_needing_review=true|false` (admin) → list suggestions; filter to those needing review
  - `GET /suggestions/mine` (auth required) → list suggestions created by current user
  - `PUT /suggestions/{id}/acknowledge` (admin) → mark suggestion acknowledged; clears `needs_review` and `notify_admins`

### Auth

- Login returns a JWT with claims `{ sub, username, email, isadmin }`.
- Frontend stores token in `localStorage` and includes `Authorization: Bearer <token>` for admin actions.
- Server validates JWT and enforces admin-only POST endpoints.

