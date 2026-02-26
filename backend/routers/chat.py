from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.openai_service import send_message

router = APIRouter()


class ChatRequest(BaseModel):
    thread_id: str
    assistant_id: str
    message: str


@router.post("/api/chat/message")
def chat_message(body: ChatRequest):
    if not body.thread_id or not body.assistant_id or not body.message:
        raise HTTPException(status_code=400, detail="thread_id, assistant_id, and message are required")
    response = send_message(body.thread_id, body.assistant_id, body.message)
    return {"response": response}
