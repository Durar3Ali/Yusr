# Yusr AI Chatbot Feature

## Overview

The Yusr app now includes an AI-powered chatbot that uses **Ephemeral RAG (Retrieval-Augmented Generation)** to answer questions about documents. The chatbot leverages OpenAI's Assistants API with File Search for automatic knowledge base management.

## Features

✅ **Ephemeral RAG** - Documents become temporary knowledge bases  
✅ **PDF & Text Support** - Works with both plain text and PDF files  
✅ **Voice Input (STT)** - OpenAI Whisper API with browser fallback  
✅ **Voice Output (TTS)** - Browser Web Speech API for reading responses  
✅ **Auto-sync** - Automatically uses text from the Reader page  
✅ **Modern UI** - Clean chat interface with message history  

## Architecture

```
User uploads text/PDF on /read page
         ↓
TextContext stores the document
         ↓
User navigates to /chat page
         ↓
ChatBot automatically creates OpenAI Assistant
         ↓
Assistant uses File Search for document Q&A
         ↓
User chats via text or voice
```

## Getting Started

### 1. Start the Backend

```bash
cd backend
python app.py
```

The Flask server will start on `http://localhost:5000`

### 2. Start the Frontend

```bash
npm run dev
```

The React app will start on `http://localhost:5173`

### 3. Use the Chatbot

1. **Upload a document** on the `/read` page:
   - Paste text into the textarea, OR
   - Upload a PDF file

2. **Navigate to `/chat`** page:
   - Click "Chat" in the navigation menu

3. **Start chatting**:
   - Type questions in the input box
   - Click the microphone icon for voice input
   - Click the speaker icon on responses for text-to-speech

## How It Works

### Ephemeral RAG Flow

1. **Document Upload**: User uploads/pastes document on Reader page
2. **Context Storage**: Document is stored in React Context (shared state)
3. **Assistant Creation**: When user opens Chat page, a new OpenAI Assistant is created
4. **File Upload**: Document is sent to OpenAI (PDF file or text as `.txt`)
5. **Automatic Processing**: OpenAI handles:
   - Chunking the document
   - Creating embeddings
   - Storing in vector database
   - Retrieval during chat
6. **Chat**: User asks questions, assistant retrieves relevant chunks and answers
7. **Cleanup**: When text changes or user leaves, assistant is deleted (ephemeral)

### OpenAI Assistants API

We use the **File Search** tool which handles the entire RAG pipeline:

```python
assistant = client.beta.assistants.create(
    name="Yusr Document Assistant",
    instructions="Answer questions about the document",
    model="gpt-4o-mini",
    tools=[{"type": "file_search"}]
)
```

No need for:
- ❌ ChromaDB or Pinecone
- ❌ Manual chunking
- ❌ Embedding generation
- ❌ Vector storage management

OpenAI does it all! 🎉

## API Endpoints

### Backend (Python Flask)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/assistant/create` | POST | Create assistant with document |
| `/api/chat/message` | POST | Send chat message |
| `/api/transcribe` | POST | Transcribe audio (Whisper) |
| `/api/assistant/:id` | DELETE | Delete assistant |

### Frontend API Client

Located in `src/lib/api/chat.ts`:

```typescript
createAssistant({ text, pdfFile, fileName })
sendChatMessage(threadId, assistantId, message)
transcribeAudio(audioBlob)
deleteAssistant(assistantId, vectorStoreId, fileId)
```

## Voice Features

### Speech-to-Text (STT)

**Primary**: OpenAI Whisper API
- High accuracy
- Multiple languages supported
- Handles accents well

**Fallback**: Browser Web Speech API
- Free
- Works offline
- Used if Whisper API fails

**Usage**: Click microphone button to record, click again to stop and transcribe.

### Text-to-Speech (TTS)

**Provider**: Browser Web Speech API
- Free and instant
- No API calls
- Works offline

**Usage**: Click speaker icon on any assistant message to hear it read aloud.

## File Structure

### Backend (Python)
```
backend/
├── app.py                      # Flask API server
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (API keys)
├── services/
│   └── openai_service.py      # OpenAI Assistants logic
└── README.md                   # Backend documentation
```

### Frontend (React)
```
src/
├── pages/
│   ├── Read.tsx               # Document upload page
│   └── Chat.tsx               # Chatbot page
├── components/
│   ├── ChatBot.tsx            # Main chatbot component
│   └── TextUploader.tsx       # Updated with PDF context storage
├── context/
│   └── TextContext.tsx        # Shared document state
├── lib/api/
│   └── chat.ts                # Chat API client
└── App.tsx                    # Updated with TextProvider & /chat route
```

## Environment Variables

### Backend (`.env`)
```
OPENAI_API_KEY=sk-proj-...
FLASK_ENV=development
CORS_ORIGINS=http://localhost:5173
PORT=5000
```

### Frontend (`.env.local`)
```
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Technologies Used

### Backend
- **Flask** - Web framework
- **OpenAI Python SDK** - Assistants API
- **Flask-CORS** - Cross-origin requests
- **python-dotenv** - Environment management

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **React Context** - State management

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (should be 3.8+)
- Install dependencies: `pip install -r requirements.txt`
- Verify `.env` file exists with valid `OPENAI_API_KEY`

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check `.env.local` has correct `VITE_API_BASE_URL`
- Check CORS settings in `backend/app.py`

### Chatbot says "No Document Loaded"
- Upload a document on `/read` page first
- Make sure text is not empty
- Check browser console for errors

### Voice input not working
- Check microphone permissions in browser
- Try the browser fallback (it will auto-switch if Whisper fails)
- Check backend logs for Whisper API errors

### Assistant initialization fails
- Check OpenAI API key is valid
- Verify you have API credits
- Check backend logs for detailed error messages

## Future Enhancements

Potential improvements for the chatbot:

- [ ] Streaming responses for better UX
- [ ] Conversation history persistence
- [ ] Multi-document support
- [ ] Suggested questions/prompts
- [ ] Export chat transcripts
- [ ] Language detection and multi-language support
- [ ] Mobile-responsive voice controls
- [ ] Rate limiting and usage tracking
- [ ] Custom assistant instructions per user

## Cost Considerations

### OpenAI API Costs

- **File Search**: ~$0.10 per GB per day of storage
- **GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Whisper**: ~$0.006 per minute of audio

**Cost Optimization**:
- Assistants are deleted when text changes (ephemeral)
- Uses GPT-4o-mini (cheapest, still high quality)
- TTS uses browser API (free)

## Security Notes

- ⚠️ **Never commit `.env` files** to version control
- ✅ `.env` is already in `.gitignore`
- ✅ API keys stored securely on backend only
- ✅ CORS configured for specific origins
- ✅ File size limits enforced (50MB max)

## Support

For issues or questions:
1. Check backend logs: Look at terminal running `python app.py`
2. Check frontend console: Open browser DevTools
3. Verify environment variables are set correctly
4. Review OpenAI API dashboard for usage/errors

---

**Built with ❤️ for the Yusr reading app**
