import re
from fastapi import APIRouter, HTTPException, UploadFile, File
import fitz
from PIL import Image
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

router = APIRouter()

_RTL_RE = re.compile(
    r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]"
)
# Characters that are purely Arabic combining diacritical marks (harakat, shadda,
# tanwin …). They have no reliable visual x-position of their own; attach them
# to the nearest regular character instead (mirrors pdfjs COMBINING_ONLY logic).
_COMBINING_ONLY_RE = re.compile(
    r"^[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]+$"
)
_Y_TOLERANCE = 4  # PDF units — same as pdfjs-dist failover


def _ocr_page(page: fitz.Page) -> str:
    # Render at 2x resolution for better OCR accuracy (~150 DPI → ~300 DPI).
    mat = fitz.Matrix(2, 2)
    pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    # ara+eng covers Arabic and Latin scripts; Tesseract handles line ordering.
    return pytesseract.image_to_string(img, lang="ara+eng").strip()


def _extract_page_text(page: fitz.Page) -> str:
    # Use rawdict (character-level) instead of dict (span-level).
    #
    # Each character comes with its own bbox, so char["bbox"][0] is the exact
    # visual left-edge of that individual glyph — a reliable, unambiguous x
    # value for sorting.  For Arabic RTL text the rightmost glyph (first in
    # reading order) always has the highest bbox[0], so sorting characters
    # descending by bbox[0] inside an RTL line reproduces the correct Arabic
    # reading order regardless of how the PDF content-stream ordered the glyphs.
    #
    # span["origin"][0] (span-level) is ambiguous for RTL spans — it may sit at
    # the LEFT edge in PyMuPDF's mapping even though pdfjs puts transform[4] at
    # the RIGHT edge, which caused the repeated "احمد → مداح" inversion.
    page_rawdict = page.get_text("rawdict", sort=False)

    # (x, y, char) — x = char's visual left edge, y = char's baseline origin
    raw_chars: list[tuple[float, float, str]] = []
    for block in page_rawdict.get("blocks", []):
        if block.get("type") != 0:  # skip image blocks
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                for ch in span.get("chars", []):
                    c: str = ch.get("c", "")
                    if not c:
                        continue
                    bbox   = ch["bbox"]     # [x0, y0, x1, y1] of this glyph
                    origin = ch["origin"]   # (x, y) baseline origin
                    raw_chars.append((bbox[0], origin[1], c))

    if not raw_chars:
        return ""

    # --- Group characters into visual lines by y with tolerance ---------------
    line_map: dict[float, list[tuple[float, str]]] = {}   # y_bucket → [(x, char)]
    bucket_keys: list[float] = []

    def _bucket(y: float) -> float:
        for k in bucket_keys:
            if abs(k - y) <= _Y_TOLERANCE:
                return k
        bucket_keys.append(y)
        return y

    for x, y, c in raw_chars:
        key = _bucket(y)
        if key not in line_map:
            line_map[key] = []
        line_map[key].append((x, c))

    # Sort lines top-to-bottom (ascending y in PyMuPDF device space).
    sorted_lines = sorted(line_map.items(), key=lambda kv: kv[0])

    # --- Per line: RTL/LTR → split combining → sort → attach → join -----------
    lines: list[str] = []
    for _, line_chars in sorted_lines:
        line_str = "".join(c for _, c in line_chars)
        is_rtl   = bool(_RTL_RE.search(line_str))

        regular   = [(x, c) for x, c in line_chars if not _COMBINING_ONLY_RE.match(c)]
        combining = [(x, c) for x, c in line_chars if     _COMBINING_ONLY_RE.match(c)]

        # Sort by character's visual left-edge x:
        #   RTL  → descending (rightmost glyph first = first in Arabic reading order)
        #   LTR  → ascending  (leftmost glyph first)
        regular.sort(key=lambda item: -item[0] if is_rtl else item[0])

        # Attach each combining mark to the nearest regular character by x distance
        # (mirrors pdfjs: min(|it.x − mark.x|, |it.x + it.width − mark.x|)).
        for cx, ct in combining:
            if not regular:
                regular.append((cx, ct))
                continue
            nearest_idx = min(range(len(regular)), key=lambda j: abs(regular[j][0] - cx))
            rx, rc = regular[nearest_idx]
            regular[nearest_idx] = (rx, rc + ct)

        # Join with "" — explicit space characters in the PDF handle word spacing.
        text_line = "".join(c for _, c in regular).strip()
        if text_line:
            lines.append(text_line)

    result = "\n".join(lines)
    result = re.sub(r"[^\S\n]+", " ", result)   # collapse spaces/tabs within lines
    result = re.sub(r"\n{3,}", "\n\n", result)   # 3+ newlines → paragraph break
    return result.strip()


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
            text = _extract_page_text(page)
            if len(text) < 10:
                text = _ocr_page(page)
            parts.append(text)
        return {"text": "\n\n".join(parts).strip()}
    finally:
        doc.close()
