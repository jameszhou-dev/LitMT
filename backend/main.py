from dotenv import load_dotenv
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import motor.motor_asyncio
import os

from books.routes import router as books_router


load_dotenv()

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.environ.get("MONGO_DB", "litmt")

print(f"🔌 MongoDB Connection: {MONGO_URI}")
print(f"📚 Database: {MONGO_DB}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting FastAPI server...")
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
    app.state.mongo_client = client
    app.state.db = client[MONGO_DB]
    print("✅ MongoDB connected successfully!")
    try:
        yield
    finally:
        print("🛑 Closing MongoDB connection...")
        client.close()


app = FastAPI(lifespan=lifespan)

# Allow frontend dev server to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books_router, prefix="/api")


