import os
import re
import fitz
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
_openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Arabic combining diacritical marks (harakat, shadda, tanwin, etc.).
# These are sometimes output by PyMuPDF as isolated tokens with a space
# before them when the PDF stores the glyph at an offset from its base letter.
_COMBINING_RE = re.compile(
    r" +([\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]+)"
)

app = FastAPI(title="Readwell PDF Extraction")

_cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _extract_page_text(page: fitz.Page) -> str:
    # get_text("text") lets PyMuPDF apply its full Unicode/Bidi pipeline,
    # which correctly handles Arabic ligatures and RTL reordering.
    # sort=True orders spans top-to-bottom so multi-column pages read correctly.
    raw = page.get_text("text", sort=True)
    lines: list[str] = []
    for line in raw.splitlines():
        # Re-attach any Arabic combining diacritical mark that was emitted as
        # a separate token with a preceding space (a known PyMuPDF / PDF
        # encoding artefact for certain Arabic fonts).
        line = _COMBINING_RE.sub(r"\1", line).strip()
        if line:
            lines.append(line)
    return "\n".join(lines)


class TTSRequest(BaseModel):
    text: str
    voice: str = 'alloy'


@app.post("/api/tts")
async def text_to_speech(req: TTSRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    audio = _openai_client.audio.speech.create(
        model='tts-1',
        voice=req.voice,
        input=req.text,
    )
    return Response(content=audio.content, media_type='audio/mpeg')


@app.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    if file.content_type and "pdf" not in file.content_type.lower():
        raise HTTPException(status_code=400, detail="File must be a PDF")
    try:
        body = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")
    try:
        doc = fitz.open(stream=body, filetype="pdf")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted PDF: {e}")
    try:
        parts: list[str] = []
        for page in doc:
            parts.append(_extract_page_text(page))
        text = "\n\n".join(parts).strip()
        return {"text": text}
    finally:
        doc.close()
