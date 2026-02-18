import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Send, Mic, Volume2, VolumeX, AlertCircle, FileText } from 'lucide-react';
import { useText } from '@/context/TextContext';
import { createAssistant, sendChatMessage, deleteAssistant, transcribeAudio } from '@/lib/api/chat';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const PREDEFINED_PROMPTS = {
  summarize: 'Please provide a concise summary of this document.',
  explain: 'Please explain the main concepts and ideas in this document in simple terms.',
};

export function ChatBot() {
  const { originalText, pdfFile, pdfMetadata } = useText();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [vectorStoreId, setVectorStoreId] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [activeMode, setActiveMode] = useState<'summarize' | 'explain' | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize assistant when component mounts or text changes
  useEffect(() => {
    const initializeAssistant = async () => {
      if (!originalText && !pdfFile) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/c1be8d64-becc-43b3-8ad9-6ff78b23520f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatBot.tsx:43',message:'No document to chat about',data:{hasOriginalText:!!originalText,hasPdfFile:!!pdfFile},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
        // #endregion
        return; // No document to chat about
      }

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/c1be8d64-becc-43b3-8ad9-6ff78b23520f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatBot.tsx:47',message:'Starting initialization',data:{hasOriginalText:!!originalText,hasPdfFile:!!pdfFile,pdfFileName:pdfMetadata?.name},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      
      setIsInitializing(true);

      try {
        // Delete old assistant if exists
        if (assistantId) {
          await deleteAssistant(assistantId, vectorStoreId || undefined, fileId || undefined).catch(console.error);
        }

        // Create new assistant with document
        const response = await createAssistant({
          text: pdfFile ? undefined : originalText,
          pdfFile: pdfFile || undefined,
          fileName: pdfMetadata?.name || 'document',
        });

        setAssistantId(response.assistant_id);
        setThreadId(response.thread_id);
        setVectorStoreId(response.vector_store_id);
        setFileId(response.file_id);

        // Add welcome message
        setMessages([
          {
            role: 'assistant',
            content: `Hello! I'm ready to answer questions about your document${pdfMetadata ? `: "${pdfMetadata.name}"` : ''}. What would you like to know?`,
            timestamp: new Date(),
          },
        ]);

        toast.success('Chatbot ready! Ask me anything about your document.');
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/c1be8d64-becc-43b3-8ad9-6ff78b23520f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatBot.tsx:76',message:'Initialization successful',data:{assistantId:response.assistant_id,threadId:response.thread_id},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
        // #endregion
      } catch (error) {
        console.error('Failed to initialize assistant:', error);
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/c1be8d64-becc-43b3-8ad9-6ff78b23520f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatBot.tsx:78',message:'Initialization failed',data:{error:error instanceof Error ? error.message : String(error),errorType:error?.constructor?.name},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
        // #endregion
        
        toast.error(error instanceof Error ? error.message : 'Failed to initialize chatbot');
      } finally {
        setIsInitializing(false);
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/c1be8d64-becc-43b3-8ad9-6ff78b23520f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ChatBot.tsx:81',message:'Initialization complete (finally block)',data:{isInitializing:false,hasAssistantId:!!assistantId},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
        // #endregion
      }
    };

    initializeAssistant();

    // Cleanup on unmount
    return () => {
      if (assistantId && vectorStoreId && fileId) {
        deleteAssistant(assistantId, vectorStoreId, fileId).catch(console.error);
      }
    };
  }, [originalText, pdfFile]); // Re-initialize when text/PDF changes

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    
    if (!textToSend || !assistantId || !threadId) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(threadId, assistantId, textToSend);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Speech-to-Text: Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick the best supported MIME type in priority order
      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
      ];
      const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        // Build a short prompt from the first ~200 chars of the document to help Whisper
        const docPrompt = originalText ? originalText.slice(0, 200).trim() : undefined;
        await transcribeWithWhisper(audioBlob, mimeType || undefined, docPrompt);

        // Release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.info('Recording... Click again to stop');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone. Please check permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Transcribe with OpenAI Whisper (with browser fallback)
  const transcribeWithWhisper = async (audioBlob: Blob, mimeType?: string, prompt?: string) => {
    try {
      const response = await transcribeAudio(audioBlob, { mimeType, prompt });
      setInputText(response.text);
      toast.success('Audio transcribed!');
    } catch (error) {
      console.error('Whisper transcription failed, trying browser fallback:', error);
      // Fallback to browser speech recognition
      useBrowserSpeechRecognition();
    }
  };

  // Browser Speech Recognition (fallback)
  const useBrowserSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      toast.success('Voice input captured!');
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      toast.error('Failed to recognize speech');
    };

    recognition.start();
    toast.info('Listening... Speak now');
  };

  // Text-to-Speech: Speak message
  const speakMessage = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast.error('Failed to speak text');
    };

    window.speechSynthesis.speak(utterance);
  };

  // Empty state: No document loaded
  if (!originalText && !pdfFile) {
    return (
      <div className="p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold">YusrBot</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-6">
          Upload or paste a document above to start chatting
        </p>
      </div>
    );
  }

  // Initializing state
  if (isInitializing) {
    return (
      <div className="p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold">YusrBot</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            Preparing your document...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold">YusrBot</h3>
      </div>

      {/* Mode Selection - Similar to image */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          Mode:
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={activeMode === 'summarize' ? 'default' : 'outline'}
            className="w-full"
            disabled={isLoading || !assistantId}
            onClick={() => {
              setActiveMode('summarize');
              handleSendMessage(PREDEFINED_PROMPTS.summarize);
            }}
          >
            Summarize
          </Button>
          <Button
            variant={activeMode === 'explain' ? 'default' : 'outline'}
            className="w-full"
            disabled={isLoading || !assistantId}
            onClick={() => {
              setActiveMode('explain');
              handleSendMessage(PREDEFINED_PROMPTS.explain);
            }}
          >
            Explain
          </Button>
        </div>
      </div>

      {/* Instruction Input */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          Instruction:
        </label>
        <div className="space-y-2">
          <div className="relative">
            <Input
              placeholder="Enter your instruction..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || !assistantId}
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              className={`absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 ${
                isRecording ? 'text-destructive' : ''
              }`}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputText.trim() || !assistantId}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => messages.length > 0 && speakMessage(messages[messages.length - 1].content)}
              disabled={messages.length === 0}
            >
              {isSpeaking ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area - Compact version */}
      {messages.length > 0 && (
        <div className="border-t pt-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Conversation:
          </label>
          <ScrollArea className="h-[300px] pr-4" ref={scrollAreaRef}>
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-lg p-2.5 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-xs whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <span className="text-[10px] opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg p-2.5 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>
      )}

      {!assistantId && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          <span>Assistant not ready...</span>
        </div>
      )}
    </div>
  );
}
