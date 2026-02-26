import os
import tempfile
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from services.openai_service import transcribe_audio

router = APIRouter()

_ALLOWED_AUDIO_EXTENSIONS = {"webm", "wav", "mp3", "ogg", "mp4", "m4a"}


def _extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


@router.post("/api/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
    prompt: Optional[str] = Form(None),
):
    ext = _extension(audio.filename or "")
    if ext not in _ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid audio file format")

    body = await audio.read()
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}")
    try:
        tmp.write(body)
        tmp.flush()
        audio_path = tmp.name
    finally:
        tmp.close()

    try:
        text = transcribe_audio(audio_path, language=language or None, prompt=prompt or None)
    finally:
        if os.path.exists(audio_path):
            try:
                os.unlink(audio_path)
            except OSError:
                pass

    return {"text": text}
