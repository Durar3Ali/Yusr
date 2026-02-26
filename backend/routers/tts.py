from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from services.openai_service import synthesize_speech

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    voice: str = "alloy"


@router.post("/api/tts")
def text_to_speech(req: TTSRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    audio_bytes = synthesize_speech(req.text, req.voice)
    return Response(content=audio_bytes, media_type="audio/mpeg")
