# Yusr Chatbot Backend

Python Flask backend for the Yusr reading app chatbot with OpenAI Assistants API integration.

## Features

- **Ephemeral RAG**: Creates temporary assistants with uploaded documents as knowledge base
- **OpenAI Assistants API**: Automatic chunking, embeddings, and retrieval
- **File Search**: Works with both plain text and PDF files
- **Speech-to-Text**: Whisper API integration for voice input
- **CORS Enabled**: Ready for frontend integration

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

The `.env` file is already configured with your OpenAI API key. You can modify other settings if needed:

```
OPENAI_API_KEY=your_key_here
FLASK_ENV=development
CORS_ORIGINS=http://localhost:5173
PORT=5000
```

### 3. Run the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /api/health
```

### Create Assistant
```
POST /api/assistant/create
Content-Type: multipart/form-data

FormData:
  - pdf: File (optional)
  - text: String (optional)
  - file_name: String (optional)

Response: {
  "assistant_id": "...",
  "thread_id": "...",
  "vector_store_id": "...",
  "file_id": "..."
}
```

### Send Chat Message
```
POST /api/chat/message
Content-Type: application/json

Body: {
  "thread_id": "...",
  "assistant_id": "...",
  "message": "..."
}

Response: {
  "response": "..."
}
```

### Transcribe Audio (STT)
```
POST /api/transcribe
Content-Type: multipart/form-data

FormData:
  - audio: File (webm, wav, mp3, ogg)

Response: {
  "text": "..."
}
```

### Delete Assistant
```
DELETE /api/assistant/:assistant_id?vector_store_id=...&file_id=...

Response: {
  "message": "Assistant deleted successfully"
}
```

## Architecture

- **Flask**: Web framework
- **OpenAI Python SDK**: Assistants API integration
- **Flask-CORS**: Cross-origin request handling
- **python-dotenv**: Environment variable management

## Notes

- Maximum file size: 50MB
- Supported audio formats: webm, wav, mp3, ogg
- Temporary files are automatically cleaned up after processing
- Assistant resources should be deleted when no longer needed to avoid OpenAI storage costs
