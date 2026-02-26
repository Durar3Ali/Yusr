import { useState, useEffect, useRef } from 'react';
import { createAssistant, sendChatMessage, deleteAssistant } from '@/lib/api/chat';
import { toast } from 'sonner';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PdfMetadata {
  name: string;
  size: number;
  url?: string;
}

export interface UseAssistantReturn {
  messages: Message[];
  isLoading: boolean;
  isInitializing: boolean;
  assistantReady: boolean;
  sendMessage: (text: string) => Promise<void>;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
}

/**
 * Manages the full lifecycle of an OpenAI assistant session tied to a document.
 * Handles creation, deletion, debounced re-initialization on document change,
 * message sending, and scroll-to-bottom behavior.
 */
export function useAssistant(
  originalText: string,
  pdfFile: File | null,
  pdfMetadata: PdfMetadata | null
): UseAssistantReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [vectorStoreId, setVectorStoreId] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const chatbotReadyNotified = useRef(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Keep a stable ref to the current assistant IDs so the cleanup closure
  // inside the effect always reads the latest values.
  const assistantIdsRef = useRef({ assistantId, threadId, vectorStoreId, fileId });
  useEffect(() => {
    assistantIdsRef.current = { assistantId, threadId, vectorStoreId, fileId };
  }, [assistantId, threadId, vectorStoreId, fileId]);

  // Auto-scroll to bottom when new messages arrive, scoped to the ScrollArea viewport.
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  // Initialize or re-initialize assistant when the document changes.
  useEffect(() => {
    const initializeAssistant = async () => {
      if (!originalText && !pdfFile) {
        setMessages([]);
        setAssistantId(null);
        setThreadId(null);
        setVectorStoreId(null);
        setFileId(null);
        chatbotReadyNotified.current = false;
        return;
      }

      chatbotReadyNotified.current = false;
      setIsInitializing(true);

      try {
        const { assistantId: prevId, vectorStoreId: prevVs, fileId: prevFi } =
          assistantIdsRef.current;

        if (prevId) {
          await deleteAssistant(prevId, prevVs || undefined, prevFi || undefined).catch(
            console.error
          );
        }

        const response = await createAssistant({
          text: pdfFile ? undefined : originalText,
          pdfFile: pdfFile || undefined,
          fileName: pdfMetadata?.name || 'document',
        });

        setAssistantId(response.assistant_id);
        setThreadId(response.thread_id);
        setVectorStoreId(response.vector_store_id);
        setFileId(response.file_id);

        setMessages([
          {
            role: 'assistant',
            content: `Hello! I'm ready to answer questions about your document${
              pdfMetadata ? `: "${pdfMetadata.name}"` : ''
            }. What would you like to know?`,
            timestamp: new Date(),
          },
        ]);

        if (!chatbotReadyNotified.current) {
          toast.success('Chatbot ready! Ask me anything about your document.');
          chatbotReadyNotified.current = true;
        }
      } catch (error) {
        console.error('Failed to initialize assistant:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to initialize chatbot');
      } finally {
        setIsInitializing(false);
      }
    };

    // Debounce initialization by 800 ms so rapid text changes don't thrash the API.
    const timer = setTimeout(initializeAssistant, 800);

    return () => {
      clearTimeout(timer);
      const { assistantId: id, vectorStoreId: vs, fileId: fi } = assistantIdsRef.current;
      if (id && vs && fi) {
        deleteAssistant(id, vs, fi).catch(console.error);
      }
    };
  }, [originalText, pdfFile]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = async (text: string) => {
    if (!text || !assistantId || !threadId) return;

    const userMessage: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(threadId, assistantId, text);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.response, timestamp: new Date() },
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
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

  return {
    messages,
    isLoading,
    isInitializing,
    assistantReady: Boolean(assistantId),
    sendMessage,
    scrollAreaRef,
  };
}
