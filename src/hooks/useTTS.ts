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

/** Split text into chunks of at most maxLen characters, breaking at word boundaries. */
function splitIntoChunks(text: string, maxLen = 4000): string[] {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    let splitAt = remaining.lastIndexOf(' ', maxLen);
    if (splitAt <= 0) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

/**
 * Encapsulates text-to-speech playback.
 * Handles chunking, sequential playback, pause/resume/stop, and resource cleanup.
 *
 * @param text - The text to synthesize and play.
 * @param synthesize - Optional synthesize function; defaults to the OpenAI TTS backend.
 *   Pass a custom implementation to swap the TTS provider without changing this hook.
 */
export function useTTS(
  text: string,
  synthesize: (text: string) => Promise<string> = synthesizeSpeech
): UseTTSReturn {
  const [state, setState] = useState<TTSState>('idle');
  const [speechRate, setSpeechRate] = useState(1.0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<string[]>([]);
  const currentObjectUrlRef = useRef<string | null>(null);
  // Stable ref so the async playback chain always reads the latest rate without restarting.
  const speechRateRef = useRef(speechRate);
  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  // Cleanup on unmount
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

  const playNextChunk = async () => {
    const chunk = chunksRef.current.shift();
    if (!chunk) {
      setState('idle');
      return;
    }

    try {
      const objectUrl = await synthesize(chunk);
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
