import { useMemo } from 'react';
import { usePreferences } from '@/context/PreferencesContext';
import { normalize, tokenize, renderHtml } from '@/lib/textPipeline';
import { directionFor } from '@/lib/rtl';
import { FontFamily } from '@/types';
import { EmptyState } from '@/components/EmptyState';
import { copy } from '@/lib/copy';

interface ReaderProps {
  originalText: string;
  onTextChange?: (text: string) => void;
}

export function Reader({ originalText, onTextChange }: ReaderProps) {
  const { preferences } = usePreferences();

  const { html, direction } = useMemo(() => {
    if (!originalText.trim()) {
      return { html: '', direction: 'ltr' as const };
    }

    const normalized = normalize(originalText);
    const tokens = tokenize(normalized);
    const rendered = renderHtml(tokens, {
      groupSize: preferences.groupSize,
      lang: preferences.langHint,
      leadBold: preferences.leadBold,
    });
    const dir = directionFor(normalized, preferences.langHint);

    return { html: rendered, direction: dir };
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
    direction,
  } as const;

  // Map font family to CSS class
  const fontClassMap: Record<FontFamily, string> = {
    'Lexend': 'font-lexend',
    'Comic Neue': 'font-comic-neue',
    'Atkinson Hyperlegible': 'font-atkinson',
    'Arial': 'font-arial',
    'Verdana': 'font-verdana',
    'System': 'font-system',
  };
  const fontClass = fontClassMap[preferences.fontFamily];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div
        className={`reader ${fontClass}`}
        style={readerStyle}
        dir={direction}
        dangerouslySetInnerHTML={{ __html: html }}
        aria-live="polite"
        aria-label="Formatted reading text"
      />
    </div>
  );
}
