"""
OpenAI Assistants API service for ephemeral RAG chatbot.
Handles assistant creation, file upload, and chat interactions.
"""
import os
import tempfile
from typing import Optional, Dict, Any
from openai import OpenAI
from dotenv import load_dotenv

# Force .env to override any stale Windows environment variables
load_dotenv(override=True)

# #region agent log
import json
def log_debug(location, message, data):
    try:
        with open(r'c:\Users\Arian\Desktop\readwell-aid\.cursor\debug.log', 'a', encoding='utf-8') as f:
            f.write(json.dumps({"timestamp": __import__("time").time() * 1000, "location": location, "message": message, "data": data}) + '\n')
    except: pass
# #endregion

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# #region agent log
log_debug("openai_service.py:11", "OpenAI client initialized", {
    "api_key_exists": bool(os.getenv("OPENAI_API_KEY")),
    "api_key_length": len(os.getenv("OPENAI_API_KEY", "")),
    "has_beta": hasattr(client, 'beta'),
    "has_vector_stores": hasattr(client.beta, 'vector_stores') if hasattr(client, 'beta') else False,
    "openai_version": __import__("openai").__version__
})
# #endregion


def create_assistant_with_file(
    text_content: Optional[str] = None,
    pdf_file_path: Optional[str] = None,
    file_name: str = "document"
) -> Dict[str, str]:
    """
    Create an OpenAI assistant with file search enabled.
    
    Args:
        text_content: Plain text content to use as knowledge base
        pdf_file_path: Path to PDF file to upload
        file_name: Name for the file (used for text content)
    
    Returns:
        Dict with assistant_id and thread_id
    """
    try:
        # #region agent log
        log_debug("openai_service.py:30", "Starting assistant creation", {
            "has_text": bool(text_content),
            "has_pdf": bool(pdf_file_path),
            "file_name": file_name,
            "pdf_exists": os.path.exists(pdf_file_path) if pdf_file_path else False
        })
        # #endregion
        
        # Step 1: Create assistant with file_search tool
        assistant = client.beta.assistants.create(
            name="Yusr Document Assistant",
            instructions="""You are a helpful reading assistant for the Yusr app. 
            Your role is to help users understand and discuss the document they are reading.
            Answer questions accurately based on the provided document content.
            Be concise, friendly, and educational in your responses.""",
            model="gpt-4o-mini",  # Fast and cost-effective
            tools=[{"type": "file_search"}],
        )
        
        # #region agent log
        log_debug("openai_service.py:40", "Assistant created", {
            "assistant_id": assistant.id,
            "assistant_model": assistant.model
        })
        # #endregion
        
        # Step 2: Upload file to OpenAI
        file_id = None
        
        if pdf_file_path and os.path.exists(pdf_file_path):
            # Upload PDF file directly
            with open(pdf_file_path, "rb") as f:
                file = client.files.create(
                    file=f,
                    purpose="assistants"
                )
                file_id = file.id
        
        elif text_content:
            # Create temporary text file for plain text content
            with tempfile.NamedTemporaryFile(
                mode='w',
                suffix='.txt',
                delete=False,
                encoding='utf-8'
            ) as temp_file:
                temp_file.write(text_content)
                temp_path = temp_file.name
            
            try:
                with open(temp_path, "rb") as f:
                    file = client.files.create(
                        file=f,
                        purpose="assistants"
                    )
                    file_id = file.id
            finally:
                # Clean up temp file
                os.unlink(temp_path)
        
        else:
            raise ValueError("Either text_content or pdf_file_path must be provided")
        
        # #region agent log
        log_debug("openai_service.py:77", "File uploaded to OpenAI", {
            "file_id": file_id,
            "file_id_exists": bool(file_id)
        })
        # #endregion
        
        # Step 3: Create vector store and attach file
        # #region agent log
        log_debug("openai_service.py:79", "About to create vector store", {
            "client_type": str(type(client)),
            "has_beta": hasattr(client, 'beta'),
            "has_vector_stores_beta": hasattr(client.beta, 'vector_stores') if hasattr(client, 'beta') else False,
            "has_vector_stores_client": hasattr(client, 'vector_stores'),
            "client_attributes": [attr for attr in dir(client) if not attr.startswith('_')][:20]
        })
        # #endregion
        
        vector_store = client.vector_stores.create(
            name=f"Yusr Document - {file_name}"
        )
        
        client.vector_stores.files.create(
            vector_store_id=vector_store.id,
            file_id=file_id
        )
        
        # Step 4: Update assistant with vector store
        client.beta.assistants.update(
            assistant_id=assistant.id,
            tool_resources={"file_search": {"vector_store_ids": [vector_store.id]}}
        )
        
        # Step 5: Create a thread for conversation
        thread = client.beta.threads.create()
        
        return {
            "assistant_id": assistant.id,
            "thread_id": thread.id,
            "vector_store_id": vector_store.id,
            "file_id": file_id
        }
    
    except Exception as e:
        print(f"Error creating assistant: {str(e)}")
        raise


def send_message(thread_id: str, assistant_id: str, message: str) -> str:
    """
    Send a message to the assistant and get a response.
    
    Args:
        thread_id: OpenAI thread ID
        assistant_id: OpenAI assistant ID
        message: User's message
    
    Returns:
        Assistant's response text
    """
    try:
        # Add user message to thread
        client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=message
        )
        
        # Run the assistant
        run = client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=assistant_id
        )
        
        # Wait for completion (polling)
        import time
        while run.status in ["queued", "in_progress"]:
            time.sleep(0.5)
            run = client.beta.threads.runs.retrieve(
                thread_id=thread_id,
                run_id=run.id
            )
        
        if run.status != "completed":
            # Get detailed error information
            error_details = {
                "status": run.status,
                "last_error": getattr(run, 'last_error', None)
            }
            print(f"Run failed with details: {error_details}")
            raise Exception(f"Run failed with status: {run.status}. Error: {getattr(run, 'last_error', 'No details')}")
        
        # Get the assistant's response
        messages = client.beta.threads.messages.list(
            thread_id=thread_id,
            order="desc",
            limit=1
        )
        
        if messages.data:
            response_message = messages.data[0]
            # Extract text content from the message
            if response_message.content:
                for content_block in response_message.content:
                    if content_block.type == "text":
                        return content_block.text.value
        
        return "I couldn't generate a response. Please try again."
    
    except Exception as e:
        import traceback
        print(f"Error sending message: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        raise


def delete_assistant(assistant_id: str, vector_store_id: Optional[str] = None, file_id: Optional[str] = None):
    """
    Clean up assistant and associated resources.
    
    Args:
        assistant_id: OpenAI assistant ID to delete
        vector_store_id: Optional vector store ID to delete
        file_id: Optional file ID to delete
    """
    try:
        # Delete assistant
        client.beta.assistants.delete(assistant_id)
        
        # Delete vector store if provided
        if vector_store_id:
            try:
                client.vector_stores.delete(vector_store_id)
            except Exception as e:
                print(f"Error deleting vector store: {str(e)}")
        
        # Delete file if provided
        if file_id:
            try:
                client.files.delete(file_id)
            except Exception as e:
                print(f"Error deleting file: {str(e)}")
        
        print(f"Successfully deleted assistant {assistant_id}")
    
    except Exception as e:
        print(f"Error deleting assistant: {str(e)}")
        raise


def transcribe_audio(
    audio_file_path: str,
    language: Optional[str] = None,
    prompt: Optional[str] = None
) -> str:
    """
    Transcribe audio using OpenAI gpt-4o-mini-transcribe API.
    
    Args:
        audio_file_path: Path to audio file
        language: BCP-47 language code (e.g. "en", "ar"). If omitted, auto-detected.
        prompt: Optional context string to improve accuracy (e.g. document excerpt or key terms)
    
    Returns:
        Transcribed text
    """
    try:
        kwargs: Dict[str, Any] = {
            "model": "gpt-4o-mini-transcribe",
            "file": None,  # set below after opening the file
        }
        if language:
            kwargs["language"] = language
        if prompt:
            kwargs["prompt"] = prompt

        with open(audio_file_path, "rb") as audio_file:
            kwargs["file"] = audio_file
            transcript = client.audio.transcriptions.create(**kwargs)
        return transcript.text
    
    except Exception as e:
        print(f"Error transcribing audio: {str(e)}")
        raise


def synthesize_speech(text: str, voice: str = 'alloy') -> bytes:
    """
    Convert text to speech using OpenAI TTS.

    Args:
        text: The text to synthesize (max 4096 characters).
        voice: One of alloy, echo, fable, onyx, nova, shimmer.

    Returns:
        MP3 audio as bytes.
    """
    try:
        response = client.audio.speech.create(
            model='tts-1',
            voice=voice,
            input=text,
        )
        return response.content
    except Exception as e:
        print(f"Error synthesizing speech: {str(e)}")
        raise
