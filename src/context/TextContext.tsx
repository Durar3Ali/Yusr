import { createContext, useContext, useState, ReactNode } from 'react';

interface TextContextValue {
  originalText: string;
  setOriginalText: (text: string) => void;
  pdfFile: File | null;
  setPdfFile: (file: File | null) => void;
  pdfMetadata: { name: string; size: number; url?: string } | null;
  setPdfMetadata: (metadata: { name: string; size: number; url?: string } | null) => void;
  clearDocument: () => void;
}

const TextContext = createContext<TextContextValue | undefined>(undefined);

export function TextProvider({ children }: { children: ReactNode }) {
  const [originalText, setOriginalText] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfMetadata, setPdfMetadata] = useState<{ name: string; size: number; url?: string } | null>(null);

  const clearDocument = () => {
    setOriginalText('');
    setPdfFile(null);
    setPdfMetadata(null);
  };

  return (
    <TextContext.Provider
      value={{
        originalText,
        setOriginalText,
        pdfFile,
        setPdfFile,
        pdfMetadata,
        setPdfMetadata,
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
