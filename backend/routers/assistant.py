import os
import tempfile
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
from services.openai_service import (
    create_assistant_with_file,
    delete_assistant as svc_delete_assistant,
)

router = APIRouter()

_ALLOWED_DOC_EXTENSIONS = {"pdf", "txt"}


def _extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


@router.post("/api/assistant/create", status_code=201)
async def create_assistant(
    pdf: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    file_name: Optional[str] = Form("document"),
):
    text_content = None
    pdf_file_path = None
    name = file_name or "document"

    if pdf is not None:
        ext = _extension(pdf.filename or "")
        if ext not in _ALLOWED_DOC_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Only PDF or TXT files are accepted")
        body = await pdf.read()
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}")
        try:
            tmp.write(body)
            tmp.flush()
            pdf_file_path = tmp.name
        finally:
            tmp.close()
        name = (pdf.filename or "document").rsplit(".", 1)[0]
    elif text:
        text_content = text
    else:
        raise HTTPException(status_code=400, detail="Either text or a PDF file must be provided")

    try:
        result = create_assistant_with_file(
            text_content=text_content,
            pdf_file_path=pdf_file_path,
            file_name=name,
        )
    finally:
        if pdf_file_path and os.path.exists(pdf_file_path):
            try:
                os.unlink(pdf_file_path)
            except OSError:
                pass

    return result


@router.delete("/api/assistant/{assistant_id}")
def delete_assistant(
    assistant_id: str,
    vector_store_id: Optional[str] = None,
    file_id: Optional[str] = None,
):
    svc_delete_assistant(assistant_id, vector_store_id, file_id)
    return {"message": "Assistant deleted successfully"}
