import re
from fastapi import APIRouter, HTTPException, UploadFile, File
import fitz

router = APIRouter()

# Arabic combining diacritical marks emitted as isolated tokens by some PDF fonts.
_COMBINING_RE = re.compile(
    r" +([\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]+)"
)


def _extract_page_text(page: fitz.Page) -> str:
    raw = page.get_text("text", sort=True)
    lines: list[str] = []
    for line in raw.splitlines():
        line = _COMBINING_RE.sub(r"\1", line).strip()
        if line:
            lines.append(line)
    return "\n".join(lines)


@router.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    if file.content_type and "pdf" not in file.content_type.lower():
        raise HTTPException(status_code=400, detail="File must be a PDF")
    try:
        body = await file.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {exc}") from exc
    try:
        doc = fitz.open(stream=body, filetype="pdf")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted PDF: {exc}") from exc
    try:
        parts: list[str] = []
        for page in doc:
            parts.append(_extract_page_text(page))
        return {"text": "\n\n".join(parts).strip()}
    finally:
        doc.close()
