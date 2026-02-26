import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Mic, Volume2, VolumeX, AlertCircle, Bot } from 'lucide-react';
import { useText } from '@/context/TextContext';
import { useAssistant } from '@/hooks/useAssistant';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useTTS } from '@/hooks/useTTS';

const PREDEFINED_PROMPTS = {
  summarize: 'Please provide a concise summary of this document.',
  explain: 'Please explain the main concepts and ideas in this document in simple terms.',
};

export function ChatBot() {
  const { originalText, pdfState } = useText();

  const pdfFile = pdfState?.file ?? null;
  const pdfMetadata = pdfState
    ? { name: pdfState.name, size: pdfState.size, url: pdfState.url }
    : null;

  const { messages, isLoading, isInitializing, assistantReady, sendMessage, scrollAreaRef } =
    useAssistant(originalText, pdfFile, pdfMetadata);

  const [inputText, setInputText] = useState('');
  const [activeMode, setActiveMode] = useState<'summarize' | 'explain' | null>(null);

  const lastMessageText = messages.length > 0 ? messages[messages.length - 1].content : '';
  const { state: ttsState, play: ttsPlay, stop: ttsStop } = useTTS(lastMessageText);

  // Voice input: pass the first 200 chars as a Whisper context hint.
  const contextPrompt = originalText ? originalText.slice(0, 200).trim() : undefined;
  const { isRecording, startRecording, stopRecording } = useVoiceInput(
    (transcript) => setInputText(transcript),
    contextPrompt
  );

  const handleSend = async (messageText?: string) => {
    const text = messageText ?? inputText.trim();
    if (!text) return;
    setInputText('');
    await sendMessage(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Empty state: no document loaded
  if (!originalText && !pdfState) {
    return (
      <div className="p-4 bg-card rounded-lg border">
        <BotHeader />
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
        <BotHeader />
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
      <div className="pb-3 border-b">
        <BotHeader />
      </div>

      {/* Mode Selection */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">Mode:</label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={activeMode === 'summarize' ? 'default' : 'outline'}
            className="w-full"
            disabled={isLoading || !assistantReady}
            onClick={() => {
              setActiveMode('summarize');
              handleSend(PREDEFINED_PROMPTS.summarize);
            }}
          >
            Summarize
          </Button>
          <Button
            variant={activeMode === 'explain' ? 'default' : 'outline'}
            className="w-full"
            disabled={isLoading || !assistantReady}
            onClick={() => {
              setActiveMode('explain');
              handleSend(PREDEFINED_PROMPTS.explain);
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
              disabled={isLoading || !assistantReady}
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
              onClick={() => handleSend()}
              disabled={isLoading || !inputText.trim() || !assistantReady}
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
              onClick={() => ttsState !== 'idle' ? ttsStop() : ttsPlay()}
              disabled={messages.length === 0}
            >
              {ttsState !== 'idle' ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
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
                      message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <p className="text-xs whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                    <span className="text-[10px] opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
            </div>
          </ScrollArea>
        </div>
      )}

      {!assistantReady && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          <span>Assistant not ready...</span>
        </div>
      )}
    </div>
  );
}

function BotHeader() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <h3 className="font-semibold">YusrBot</h3>
    </div>
  );
}
