import { createContext, useContext, useState, ReactNode } from 'react';

export interface PdfState {
  file: File;
  name: string;
  size: number;
  url?: string;
}

interface TextContextValue {
  originalText: string;
  setOriginalText: (text: string) => void;
  pdfState: PdfState | null;
  setPdfState: (state: PdfState | null) => void;
  clearDocument: () => void;
}

const TextContext = createContext<TextContextValue | undefined>(undefined);

export function TextProvider({ children }: { children: ReactNode }) {
  const [originalText, setOriginalText] = useState('');
  const [pdfState, setPdfState] = useState<PdfState | null>(null);

  const clearDocument = () => {
    setOriginalText('');
    setPdfState(null);
  };

  return (
    <TextContext.Provider
      value={{
        originalText,
        setOriginalText,
        pdfState,
        setPdfState,
        clearDocument,
      }}
    >
      {children}
    </TextContext.Provider>
  );
}

export function useText() {
  const context = useContext(TextContext);
  if (context === undefined) {
    throw new Error('useText must be used within a TextProvider');
  }
  return context;
}
