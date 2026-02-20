"""
Flask backend for Yusr chatbot with OpenAI Assistants API.
Provides endpoints for assistant management, chat, and speech-to-text.
"""
import os
import tempfile
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

from services.openai_service import (
    create_assistant_with_file,
    send_message,
    delete_assistant,
    transcribe_audio,
    synthesize_speech,
)

# Load environment variables - override=True ensures .env values take precedence
# over any system/user-level Windows environment variables
load_dotenv(override=True)

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
CORS(app, origins=cors_origins)

# Configuration
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'webm', 'wav', 'mp3', 'ogg'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size


def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "ok", "message": "Yusr chatbot backend is running"})


@app.route('/api/assistant/create', methods=['POST'])
def create_assistant():
    """
    Create a new OpenAI assistant with uploaded document.
    
    Accepts:
    - FormData with 'pdf' file
    - FormData with 'text' field (plain text)
    - JSON with 'text' field
    
    Returns:
        {
            "assistant_id": "...",
            "thread_id": "...",
            "vector_store_id": "...",
            "file_id": "..."
        }
    """
    try:
        text_content = None
        pdf_file_path = None
        file_name = "document"
        
        # Check for file upload (PDF)
        if 'pdf' in request.files:
            file = request.files['pdf']
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_name = filename.rsplit('.', 1)[0]  # Remove extension
                pdf_file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(pdf_file_path)
        
        # Check for text content
        elif 'text' in request.form:
            text_content = request.form['text']
            if 'file_name' in request.form:
                file_name = request.form['file_name']
        
        elif request.is_json:
            data = request.get_json()
            text_content = data.get('text')
            file_name = data.get('file_name', 'document')
        
        else:
            return jsonify({"error": "No text or PDF file provided"}), 400
        
        # Validate that we have content
        if not text_content and not pdf_file_path:
            return jsonify({"error": "Either text or PDF file must be provided"}), 400
        
        # Create assistant with file
        result = create_assistant_with_file(
            text_content=text_content,
            pdf_file_path=pdf_file_path,
            file_name=file_name
        )
        
        # Clean up uploaded PDF file
        if pdf_file_path and os.path.exists(pdf_file_path):
            try:
                os.unlink(pdf_file_path)
            except Exception as e:
                print(f"Error cleaning up file: {str(e)}")
        
        return jsonify(result), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/chat/message', methods=['POST'])
def chat_message():
    """
    Send a message to the assistant and get a response.
    
    Request body:
        {
            "thread_id": "...",
            "assistant_id": "...",
            "message": "..."
        }
    
    Returns:
        {
            "response": "..."
        }
    """
    try:
        data = request.get_json()
        
        thread_id = data.get('thread_id')
        assistant_id = data.get('assistant_id')
        message = data.get('message')
        
        if not all([thread_id, assistant_id, message]):
            return jsonify({"error": "thread_id, assistant_id, and message are required"}), 400
        
        # Send message and get response
        response = send_message(thread_id, assistant_id, message)
        
        return jsonify({"response": response}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/assistant/<assistant_id>', methods=['DELETE'])
def delete_assistant_endpoint(assistant_id):
    """
    Delete an assistant and its associated resources.
    
    Query params (optional):
        - vector_store_id
        - file_id
    """
    try:
        vector_store_id = request.args.get('vector_store_id')
        file_id = request.args.get('file_id')
        
        delete_assistant(assistant_id, vector_store_id, file_id)
        
        return jsonify({"message": "Assistant deleted successfully"}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/transcribe', methods=['POST'])
def transcribe():
    """
    Transcribe audio using OpenAI gpt-4o-mini-transcribe API.
    
    Accepts:
        FormData with:
          - 'audio' file  (webm, wav, mp3, ogg)
          - 'language'    optional BCP-47 code, e.g. "en" or "ar" (omit for auto-detect)
          - 'prompt'      optional context string to improve accuracy
    
    Returns:
        {
            "text": "..."
        }
    """
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files['audio']
        
        if audio_file.filename == '':
            return jsonify({"error": "No audio file selected"}), 400
        
        if not allowed_file(audio_file.filename):
            return jsonify({"error": "Invalid audio file format"}), 400
        
        language = request.form.get('language') or None
        prompt = request.form.get('prompt') or None

        # Save audio file temporarily
        filename = secure_filename(audio_file.filename)
        audio_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        audio_file.save(audio_path)
        
        try:
            # Transcribe audio
            text = transcribe_audio(audio_path, language=language, prompt=prompt)
            return jsonify({"text": text}), 200
        
        finally:
            # Clean up audio file
            if os.path.exists(audio_path):
                try:
                    os.unlink(audio_path)
                except Exception as e:
                    print(f"Error cleaning up audio file: {str(e)}")
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    """
    Convert text to speech using OpenAI TTS.

    Request body:
        {
            "text": "...",
            "voice": "alloy"  (optional, default: alloy)
        }

    Returns:
        MP3 audio stream (audio/mpeg)
    """
    try:
        data = request.get_json()
        text = (data.get('text') or '').strip()
        voice = data.get('voice', 'alloy')

        if not text:
            return jsonify({"error": "text is required"}), 400

        audio_bytes = synthesize_speech(text, voice)
        return Response(audio_bytes, mimetype='audio/mpeg')

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error."""
    return jsonify({"error": "File too large. Maximum size is 50MB"}), 413


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print(f"Starting Yusr chatbot backend on port {port}...")
    print(f"CORS enabled for: {cors_origins}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
