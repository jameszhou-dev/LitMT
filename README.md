# LitMT

A research web app that makes previously-untranslated literary works accessible to global audiences through machine translation and community collaboration.

## Overview

LitMT consists of a Next.js frontend and a FastAPI backend backed by MongoDB. Readers can browse books, view translations, and (for admins) manage the catalog and upload translations. Authentication issues JWTs; UI updates instantly via localStorage and custom events.

- Frontend: `litmt/` (Next.js App Router, TypeScript, Tailwind)
- Backend: `backend/` (FastAPI, Motor/MongoDB, JWT)
- Database: MongoDB (runs locally or via Docker)

## Key Features

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
   - Header shows “Manage Books” and “Add Book” if `user.isadmin` is truthy.
   - Mutating endpoints require a valid admin JWT (server-guarded).

## Frontend

- Folder: `litmt/`
- Notable routes (App Router):
  - `/` Landing: shows “Browse Library” only for signed-in users; otherwise shows Sign In / Create Account CTAs.
  - `/sign-in`, `/create-account` Authentication pages.
  - `/library` Auth-guarded; redirects to sign-in if unauthenticated.
  - `/book/[id]` Book detail with translations and original source link.
  - `/managebooks` Admin-only management UI.
  - `/managebooks/addbook` Admin-only add-book page.
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

### Auth

- Login returns a JWT with claims `{ sub, username, email, isadmin }`.
- Frontend stores token in `localStorage` and includes `Authorization: Bearer <token>` for admin actions.
- Server validates JWT and enforces admin-only POST endpoints.

## Running the app

### Option A: Docker (recommended)

1. Create env files

```zsh
cp backend/.env.example backend/.env
cp litmt/.env.local.example litmt/.env.local
# Edit backend/.env and set a strong JWT_SECRET
```

2. Start all services

```zsh
docker compose up --build
```

3. Open

- Frontend: http://localhost:3001 (or 3000 if you remap)
- API: http://localhost:8080

### Using a Managed MongoDB (Production)

1. Provision a managed MongoDB (e.g., MongoDB Atlas)

- Create a cluster and a database user (username/password)
- Add IP access: allow your deploy platform’s egress IPs (or 0.0.0.0/0 for testing)
- Copy the connection string (SRV):
  `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/litmt?retryWrites=true&w=majority`

2. Set environment variables for the backend

- MONGO_URI: the Atlas SRV URI above
- MONGO_DB: litmt
- JWT_SECRET: a long random string
- CORS_ALLOW_ORIGINS: include your frontend URL, e.g., `https://your-frontend-domain`

3. Build production images

```zsh
docker compose -f docker-compose.prod.yml build
```

4. Run locally against managed Mongo (optional smoke test)

```zsh
export MONGO_URI="mongodb+srv://..."
export CORS_ALLOW_ORIGINS="http://localhost:3000,http://localhost:3001"
export NEXT_PUBLIC_BACKEND_URL="http://localhost:8080"
docker compose -f docker-compose.prod.yml up
```

5. Deploy

- Backend options: Render, Fly.io, Azure Container Apps, AWS ECS/Fargate, etc. Provide container image and set env vars above.
- Frontend options: Vercel (recommended for Next.js) or any container host using the frontend production image.
- Ensure CORS_ALLOW_ORIGINS contains your production frontend URL and NEXT_PUBLIC_BACKEND_URL points to your backend URL.

6. Seed data (optional)

- Run a one-off seed script or import using mongodump/mongorestore into Atlas.
- Example seed script is at `backend/scripts/seed.py` (adjust as needed and run once).

## Folder Structure (partial)

```
backend/
  main.py
  requirements.txt
  books/
    models.py
    routes.py
  users/
    models.py
    routes.py
    auth.py
litmt/
  package.json
  src/app/
    page.tsx                 # Landing
    library/page.tsx         # Library (auth-guarded)
    book/[id]/page.tsx       # Book detail
    managebooks/page.tsx     # Admin
    managebooks/addbook/...  # Admin add
    _components/Header.tsx   # Header with auth/admin links
```

## Accessibility and UX

- Header includes skip link, focus-visible rings, aria attributes, and keyboard support (Escape closes menus).
- Landing page CTAs adapt based on login state.
- Library route redirects unauthenticated users to sign-in.

## Known Limitations / Next Steps

- No dedicated `GET /api/books/{id}` endpoint yet; book detail fetches all then filters.
- Consider cookie-based auth and SSR/middleware for route protection.
- Add tests and CI.

## License

Research prototype – see repository terms or contact maintainers.
