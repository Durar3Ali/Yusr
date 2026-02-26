"""
OpenAI service layer.
Handles assistant creation, file upload, chat, transcription, and TTS.
"""
import os
import tempfile
from typing import Optional, Dict, Any
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def create_assistant_with_file(
    text_content: Optional[str] = None,
    pdf_file_path: Optional[str] = None,
    file_name: str = "document",
) -> Dict[str, str]:
    """
    Create an OpenAI assistant with file search enabled.

    Args:
        text_content: Plain text to use as the knowledge base.
        pdf_file_path: Path to a PDF file to upload.
        file_name: Display name for the file.

    Returns:
        Dict with assistant_id, thread_id, vector_store_id, and file_id.
    """
    assistant = client.beta.assistants.create(
        name="Yusr Document Assistant",
        instructions=(
            "You are a helpful reading assistant for the Yusr app. "
            "Your role is to help users understand and discuss the document they are reading. "
            "Answer questions accurately based on the provided document content. "
            "Be concise, friendly, and educational in your responses."
        ),
        model="gpt-4o-mini",
        tools=[{"type": "file_search"}],
    )

    file_id: Optional[str] = None

    if pdf_file_path and os.path.exists(pdf_file_path):
        with open(pdf_file_path, "rb") as f:
            uploaded = client.files.create(file=f, purpose="assistants")
            file_id = uploaded.id
    elif text_content:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".txt", delete=False, encoding="utf-8"
        ) as tmp:
            tmp.write(text_content)
            tmp_path = tmp.name
        try:
            with open(tmp_path, "rb") as f:
                uploaded = client.files.create(file=f, purpose="assistants")
                file_id = uploaded.id
        finally:
            os.unlink(tmp_path)
    else:
        raise ValueError("Either text_content or pdf_file_path must be provided")

    vector_store = client.vector_stores.create(name=f"Yusr Document - {file_name}")
    client.vector_stores.files.create(vector_store_id=vector_store.id, file_id=file_id)
    client.beta.assistants.update(
        assistant_id=assistant.id,
        tool_resources={"file_search": {"vector_store_ids": [vector_store.id]}},
    )

    thread = client.beta.threads.create()

    return {
        "assistant_id": assistant.id,
        "thread_id": thread.id,
        "vector_store_id": vector_store.id,
        "file_id": file_id,
    }


def send_message(thread_id: str, assistant_id: str, message: str) -> str:
    """
    Send a user message to an existing thread and return the assistant's reply.
    """
    import time

    client.beta.threads.messages.create(
        thread_id=thread_id, role="user", content=message
    )

    run = client.beta.threads.runs.create(
        thread_id=thread_id, assistant_id=assistant_id
    )

    while run.status in ("queued", "in_progress"):
        time.sleep(0.5)
        run = client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run.id)

    if run.status != "completed":
        last_error = getattr(run, "last_error", "No details")
        raise RuntimeError(f"Run failed with status: {run.status}. Error: {last_error}")

    messages = client.beta.threads.messages.list(
        thread_id=thread_id, order="desc", limit=1
    )

    if messages.data:
        for block in messages.data[0].content:
            if block.type == "text":
                return block.text.value

    return "I couldn't generate a response. Please try again."


def delete_assistant(
    assistant_id: str,
    vector_store_id: Optional[str] = None,
    file_id: Optional[str] = None,
) -> None:
    """
    Delete an assistant and its associated vector store and file.
    """
    client.beta.assistants.delete(assistant_id)

    if vector_store_id:
        try:
            client.vector_stores.delete(vector_store_id)
        except Exception as exc:
            print(f"Error deleting vector store: {exc}")

    if file_id:
        try:
            client.files.delete(file_id)
        except Exception as exc:
            print(f"Error deleting file: {exc}")


def transcribe_audio(
    audio_file_path: str,
    language: Optional[str] = None,
    prompt: Optional[str] = None,
) -> str:
    """
    Transcribe audio using the OpenAI transcription API.

    Args:
        audio_file_path: Path to the audio file.
        language: BCP-47 language code; omit for auto-detection.
        prompt: Optional context string to improve accuracy.

    Returns:
        Transcribed text.
    """
    kwargs: Dict[str, Any] = {"model": "gpt-4o-mini-transcribe"}
    if language:
        kwargs["language"] = language
    if prompt:
        kwargs["prompt"] = prompt

    with open(audio_file_path, "rb") as f:
        kwargs["file"] = f
        transcript = client.audio.transcriptions.create(**kwargs)
    return transcript.text


def synthesize_speech(text: str, voice: str = "alloy") -> bytes:
    """
    Convert text to speech using OpenAI TTS.

    Args:
        text: Text to synthesize (max 4096 characters).
        voice: One of alloy, echo, fable, onyx, nova, shimmer.

    Returns:
        MP3 audio as bytes.
    """
    response = client.audio.speech.create(model="tts-1", voice=voice, input=text)
    return response.content
