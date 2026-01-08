import { useMemo } from 'react';
import { usePreferences } from '@/context/PreferencesContext';
import { normalize, tokenize, renderHtml } from '@/lib/textPipeline';
import { FontFamily } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { copy } from '@/lib/copy';
import { directionFor } from '@/lib/rtl';

interface ReaderProps {
  originalText: string;
  onTextChange?: (text: string) => void;
}

export function Reader({ originalText, onTextChange }: ReaderProps) {
  const { preferences } = usePreferences();

  const dir = useMemo(() => {
    return directionFor(originalText, preferences.langHint);
  }, [originalText, preferences.langHint]);

  const html = useMemo(() => {
    if (!originalText.trim()) {
      return '';
    }

    const normalized = normalize(originalText);
    const tokens = tokenize(normalized);
    const rendered = renderHtml(tokens, {
      groupSize: preferences.groupSize,
      lang: preferences.langHint,
      leadBold: preferences.leadBold,
    });

    return rendered;
  }, [originalText, preferences.groupSize, preferences.langHint, preferences.leadBold]);

  const handleLoadSample = () => {
    if (onTextChange) {
      onTextChange(copy.sampleText);
    }
  };

  if (!originalText.trim()) {
    return <EmptyState onLoadSample={handleLoadSample} />;
  }

  const readerStyle = {
    fontSize: `${preferences.fontSize}px`,
    lineHeight: preferences.lineSpacing,
    letterSpacing: `${preferences.letterSpacing}em`,
  } as const;

  const fontClassMap: Record<FontFamily, string> = {
    Lexend: 'font-lexend',
    'Comic Neue': 'font-comic-neue',
    'Atkinson Hyperlegible': 'font-atkinson',
    Arial: 'font-arial',
    Verdana: 'font-verdana',
    System: 'font-system',
  };
  const fontClass = fontClassMap[preferences.fontFamily];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div
        className={`reader ${fontClass}`}
        style={readerStyle}
        dir={dir}
        dangerouslySetInnerHTML={{ __html: html }}
        aria-live="polite"
        aria-label="Formatted reading text"
      />
    </div>
  );
}
