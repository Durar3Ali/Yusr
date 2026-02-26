"""
Single FastAPI entry point for the Readwell-Aid backend.
All domain routes are registered via their own router modules.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv(override=True)

from routers import health, tts, assistant, chat, transcribe, pdf

app = FastAPI(title="Readwell-Aid API")

_cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(tts.router)
app.include_router(assistant.router)
app.include_router(chat.router)
app.include_router(transcribe.router)
app.include_router(pdf.router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
