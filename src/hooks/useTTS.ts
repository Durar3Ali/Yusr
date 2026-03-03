/**
 * Hook that handles the audio state
 */
import { useState, useRef, useEffect } from 'react';
import { synthesizeSpeech } from '@/lib/api/tts';
import { normalize } from '@/lib/textPipeline';
import { toast } from 'sonner';

export type TTSState = 'idle' | 'playing' | 'paused';

export interface UseTTSReturn {
  state: TTSState;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
}

/** Split text into chunks of max 4000 chars,
 * because OpenAI has a 4096-char limit
 */
function splitIntoChunks(text: string, maxLen = 4000): string[] {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    let splitAt = remaining.lastIndexOf(' ', maxLen); //so it doesn't cut a word in half
    if (splitAt <= 0) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

/**
 * Encapsulates TTS playback using the backend OpenAI TTS endpoint.
 * Handles chunking, sequential playback, pause/resume/stop, and resource cleanup.
 */
export function useTTS(text: string): UseTTSReturn {
  //Initializes the state & speech 
  const [state, setState] = useState<TTSState>('idle');
  const [speechRate, setSpeechRate] = useState(1.0);
  
  //Ref to the audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<string[]>([]);
  const currentObjectUrlRef = useRef<string | null>(null);
  
  /** 
   * update the stable ref whenever speechRate changes
  */
  const speechRateRef = useRef(speechRate);
  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
      }
    };
  }, []);
  

  /**
   * Play the next. Chunk after chunck
   */
  const playNextChunk = async () => {
    const chunk = chunksRef.current.shift();
    if (!chunk) {
      setState('idle');
      return;
    }

    try {
      const objectUrl = await synthesizeSpeech(chunk);
      currentObjectUrlRef.current = objectUrl;

      const audio = new Audio(objectUrl);
      audio.playbackRate = speechRateRef.current;
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(objectUrl);
        currentObjectUrlRef.current = null;
        audioRef.current = null;
        playNextChunk();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        currentObjectUrlRef.current = null;
        audioRef.current = null;
        toast.error('Text-to-speech error occurred');
        setState('idle');
      };

      await audio.play();
      setState('playing');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Text-to-speech error occurred');
      setState('idle');
    }
  };

  const play = async () => {
    if (!text.trim()) {
      toast.error('No text to read');
      return;
    }

    if (state === 'paused' && audioRef.current) {
      audioRef.current.playbackRate = speechRateRef.current;
      await audioRef.current.play();
      setState('playing');
      return;
    }

    const normalized = normalize(text);
    chunksRef.current = splitIntoChunks(normalized);
    await playNextChunk();
  };

  const pause = () => {
    if (audioRef.current && state === 'playing') {
      audioRef.current.pause();
      setState('paused');
    }
  };

  const stop = () => {
    chunksRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (currentObjectUrlRef.current) {
      URL.revokeObjectURL(currentObjectUrlRef.current);
      currentObjectUrlRef.current = null;
    }
    setState('idle');
  };

  return { state, speechRate, setSpeechRate, play, pause, stop };
}
