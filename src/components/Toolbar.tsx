import { useState } from 'react';
import { usePreferences } from '@/context/PreferencesContext';
import { useMe } from '@/hooks/useMe';
import { useTTS } from '@/hooks/useTTS';
import { upsertPreferences, preferencesToDbPayload } from '@/lib/api/preferences';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';
import { FontFamilySelect } from '@/components/preferences/FontFamilySelect';
import { LeadBoldRadioGroup } from '@/components/preferences/LeadBoldRadioGroup';
import { LangHintRadioGroup } from '@/components/preferences/LangHintRadioGroup';
import { SliderControl } from '@/components/preferences/SliderControl';
import { toast } from 'sonner';

interface ToolbarProps {
  originalText: string;
}

export function Toolbar({ originalText }: ToolbarProps) {
  const { preferences, setPreferences } = usePreferences();
  const { me } = useMe();
  const { state: ttsState, speechRate, setSpeechRate, play, pause, stop } = useTTS(originalText);
  const [saving, setSaving] = useState(false);

  const handleSavePreferences = async () => {
    if (!me) return;
    try {
      setSaving(true);
      await upsertPreferences(preferencesToDbPayload(preferences, me.id));
      toast.success('Preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 bg-card rounded-lg border h-fit sticky top-4">
      <h2 className="text-lg font-semibold">Reading Controls</h2>

      <FontFamilySelect
        id="toolbar-font-family"
        value={preferences.fontFamily}
        onValueChange={(value) => setPreferences({ fontFamily: value })}
      />

      <SliderControl
        id="toolbar-font-size"
        label="Font Size"
        value={preferences.fontSize}
        min={14}
        max={28}
        step={1}
        displayValue={`${preferences.fontSize}px`}
        onValueChange={(value) => setPreferences({ fontSize: value })}
      />

      <SliderControl
        id="toolbar-line-spacing"
        label="Line Spacing"
        value={preferences.lineSpacing}
        min={1.2}
        max={2.5}
        step={0.1}
        displayValue={preferences.lineSpacing.toFixed(1)}
        onValueChange={(value) => setPreferences({ lineSpacing: value })}
      />

      <SliderControl
        id="toolbar-letter-spacing"
        label="Letter Spacing"
        value={preferences.letterSpacing}
        min={0}
        max={0.15}
        step={0.01}
        displayValue={`${preferences.letterSpacing.toFixed(2)}em`}
        onValueChange={(value) => setPreferences({ letterSpacing: value })}
      />

      <LeadBoldRadioGroup
        idPrefix="toolbar-bold"
        value={preferences.leadBold}
        onValueChange={(value) => setPreferences({ leadBold: value })}
      />

      <SliderControl
        id="toolbar-group-size"
        label="Group Color Size"
        value={preferences.groupSize}
        min={2}
        max={7}
        step={1}
        displayValue={`${preferences.groupSize} words`}
        onValueChange={(value) => setPreferences({ groupSize: value })}
      />

      <LangHintRadioGroup
        idPrefix="toolbar-lang"
        value={preferences.langHint}
        onValueChange={(value) => setPreferences({ langHint: value })}
      />

      {me && (
        <Button onClick={handleSavePreferences} disabled={saving} className="w-full" size="sm">
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      )}

      <SliderControl
        id="toolbar-speech-rate"
        label="Speech Rate"
        value={speechRate}
        min={0.5}
        max={2.0}
        step={0.1}
        displayValue={`${speechRate.toFixed(1)}x`}
        onValueChange={setSpeechRate}
      />

      <div className="space-y-2">
        <Label>Read Aloud</Label>
        <div className="flex gap-2">
          <Button
            onClick={play}
            disabled={ttsState === 'playing'}
            size="sm"
            className="flex-1"
            aria-label="Play text-to-speech"
          >
            <Play className="h-4 w-4 mr-1" />
            {ttsState === 'paused' ? 'Resume' : 'Play'}
          </Button>
          <Button
            onClick={pause}
            disabled={ttsState !== 'playing'}
            size="sm"
            variant="outline"
            aria-label="Pause text-to-speech"
          >
            <Pause className="h-4 w-4" />
          </Button>
          <Button
            onClick={stop}
            disabled={ttsState === 'idle'}
            size="sm"
            variant="outline"
            aria-label="Stop text-to-speech"
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Uses AI synthesis for higher quality audio.
        </p>
      </div>
    </div>
  );
}
