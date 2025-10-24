from dotenv import load_dotenv
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import motor.motor_asyncio
import os

from books.routes import router as books_router
from users.routes import router as users_router


load_dotenv()

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.environ.get("MONGO_DB", "litmt")
_cors_env = os.environ.get("CORS_ALLOW_ORIGINS")
if _cors_env:
    ALLOW_ORIGINS = [o.strip() for o in _cors_env.split(",") if o.strip()]
else:
    ALLOW_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]



@asynccontextmanager
async def lifespan(app: FastAPI):
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
    app.state.mongo_client = client
    app.state.db = client[MONGO_DB]
    print("MongoDB connected")
    try:
        yield
    finally:
        print("shutting down")
        client.close()


app = FastAPI(lifespan=lifespan)

# Allow frontend dev server to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books_router, prefix="/api")
app.include_router(users_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}


