import { useState } from 'react';
import { transcribeAudio } from '@/lib/api/chat';
import { toast } from 'sonner';

export interface UseVoiceInputReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

/**
 * Encapsulates microphone recording, Whisper transcription, and a browser
 * SpeechRecognition fallback. Calls `onTranscript` with the resulting text.
 *
 * @param onTranscript - Callback invoked with the transcribed string.
 * @param contextPrompt - Optional text to pass to Whisper as a context hint
 *   (e.g. the first 200 characters of the loaded document) to improve accuracy.
 */
export function useVoiceInput(
  onTranscript: (text: string) => void,
  contextPrompt?: string
): UseVoiceInputReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const transcribeWithWhisper = async (audioBlob: Blob, mimeType?: string) => {
    try {
      const response = await transcribeAudio(audioBlob, {
        mimeType,
        prompt: contextPrompt,
      });
      onTranscript(response.text);
      toast.success('Audio transcribed!');
    } catch (error) {
      console.error('Whisper transcription failed, trying browser fallback:', error);
      useBrowserSpeechRecognition();
    }
  };

  const useBrowserSpeechRecognition = () => {
    const SpeechRecognition =
      (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognition as any)();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      toast.success('Voice input captured!');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      toast.error('Failed to recognize speech');
    };

    recognition.start();
    toast.info('Listening... Speak now');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        await transcribeWithWhisper(audioBlob, mimeType || undefined);
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

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return { isRecording, startRecording, stopRecording };
}
