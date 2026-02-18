# Quick Start Guide - Yusr Chatbot

## 🚀 Get Started in 3 Steps

### Step 1: Start the Backend

```bash
cd backend
python app.py
```

You should see:
```
Starting Yusr chatbot backend on port 5000...
CORS enabled for: ['http://localhost:5173']
```

### Step 2: Start the Frontend

In a new terminal:

```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Step 3: Use the Chatbot

1. **Open the app**: Go to `http://localhost:5173`

2. **Upload a document**:
   - Click "Read" in the navigation
   - Either paste text OR upload a PDF file
   - Wait for "PDF text extracted successfully" toast

3. **Start chatting**:
   - Click "Chat" in the navigation
   - Wait for "Chatbot ready!" message
   - Ask questions about your document!

## 🎤 Voice Features

### Voice Input (Speech-to-Text)
- Click the **microphone icon** 🎤
- Speak your question
- Click again to stop recording
- Your question appears in the text box

### Voice Output (Text-to-Speech)
- Click the **speaker icon** 🔊 on any assistant message
- The message will be read aloud
- Click again to stop

## ✅ Verify Everything Works

### Test Backend
```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{"status": "ok", "message": "Yusr chatbot backend is running"}
```

### Test Frontend
1. Open browser to `http://localhost:5173`
2. Should see Yusr landing page with no errors in console
3. Navigate to `/read` - should load without errors
4. Navigate to `/chat` - should show "No Document Loaded" message

## 🔧 Common Issues

### "Module not found" errors
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
npm install
```

### Backend won't start - Port already in use
```bash
# Find process using port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### CORS errors in browser console
- Make sure backend is running
- Check `.env.local` has correct `VITE_API_BASE_URL=http://localhost:5000`
- Check `backend/.env` has correct `CORS_ORIGINS=http://localhost:5173`

### "No Document Loaded" on Chat page
- This is expected! Upload a document on `/read` first
- Navigate to `/read` → Upload PDF or paste text → Navigate to `/chat`

## 📝 Environment Setup

Your `.env` files are already configured with your OpenAI API key!

### Backend `.env` ✅
```
OPENAI_API_KEY=sk-proj-...
FLASK_ENV=development
CORS_ORIGINS=http://localhost:5173
PORT=5000
```

### Frontend `.env.local` ✅
```
VITE_API_BASE_URL=http://localhost:5000
```

## 🎉 You're Ready!

Everything is set up and ready to use. Enjoy your AI-powered document chatbot!

For detailed documentation, see [CHATBOT_README.md](CHATBOT_README.md)
