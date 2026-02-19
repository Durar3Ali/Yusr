import { useState, useEffect, useRef } from 'react';
import { usePreferences } from '@/context/PreferencesContext';
import { useMe } from '@/hooks/useMe';
import { upsertPreferences } from '@/lib/api/preferences';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Play, Pause, Square } from 'lucide-react';
import { FontFamily, LeadBoldStrength, LanguageHint } from '@/types';
import { normalize } from '@/lib/textPipeline';
import { toast } from 'sonner';

interface ToolbarProps {
  originalText: string;
}

type TTSState = 'idle' | 'playing' | 'paused';

export function Toolbar({ originalText }: ToolbarProps) {
  const { preferences, setPreferences } = usePreferences();
  const { me } = useMe();
  const [ttsState, setTtsState] = useState<TTSState>('idle');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [saving, setSaving] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handleSavePreferences = async () => {
    if (!me) return;
    try {
      setSaving(true);
      await upsertPreferences({
        user_id: me.id,
        theme: preferences.theme,
        font_family: preferences.fontFamily,
        font_size: preferences.fontSize,
        line_spacing: preferences.lineSpacing,
        letter_spacing: preferences.letterSpacing,
        lead_bold: preferences.leadBold,
        group_size: preferences.groupSize,
        lang_hint: preferences.langHint,
      });
      toast.success('Preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (!originalText.trim()) {
      toast.error('No text to read');
      return;
    }

    if (ttsState === 'paused') {
      window.speechSynthesis.resume();
      setTtsState('playing');
      return;
    }

    // Create new utterance
    const normalized = normalize(originalText);
    const utterance = new SpeechSynthesisUtterance(normalized);
    
    // Set language based on hint
    if (preferences.langHint === 'ar') {
      utterance.lang = 'ar-SA';
    } else if (preferences.langHint === 'en') {
      utterance.lang = 'en-US';
    } else {
      utterance.lang = 'en-US'; // default
    }
    
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setTtsState('idle');
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error('TTS error:', event);
      toast.error('Text-to-speech error occurred');
      setTtsState('idle');
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setTtsState('playing');
  };

  const handlePause = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setTtsState('paused');
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setTtsState('idle');
    utteranceRef.current = null;
  };

  return (
    <div className="space-y-6 p-4 bg-card rounded-lg border h-fit sticky top-4">
      <h2 className="text-lg font-semibold">Reading Controls</h2>

      {/* Font Family */}
      <div className="space-y-2">
        <Label htmlFor="font-family">Font</Label>
        <Select
          value={preferences.fontFamily}
          onValueChange={(value: FontFamily) => setPreferences({ fontFamily: value })}
        >
          <SelectTrigger id="font-family" className="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-50 bg-popover">
            <SelectItem value="Lexend">Lexend</SelectItem>
            <SelectItem value="Comic Neue">Comic Neue</SelectItem>
            <SelectItem value="Atkinson Hyperlegible">Atkinson Hyperlegible</SelectItem>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Verdana">Verdana</SelectItem>
            <SelectItem value="System">System Default</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          All fonts optimized for dyslexia-friendly reading
        </p>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="font-size">Font Size</Label>
          <span className="text-sm text-muted-foreground">{preferences.fontSize}px</span>
        </div>
        <Slider
          id="font-size"
          min={14}
          max={28}
          step={1}
          value={[preferences.fontSize]}
          onValueChange={([value]) => setPreferences({ fontSize: value })}
        />
      </div>

      {/* Line Spacing */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="line-spacing">Line Spacing</Label>
          <span className="text-sm text-muted-foreground">{preferences.lineSpacing.toFixed(1)}</span>
        </div>
        <Slider
          id="line-spacing"
          min={1.2}
          max={2.5}
          step={0.1}
          value={[preferences.lineSpacing]}
          onValueChange={([value]) => setPreferences({ lineSpacing: value })}
        />
      </div>

      {/* Letter Spacing */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="letter-spacing">Letter Spacing</Label>
          <span className="text-sm text-muted-foreground">{preferences.letterSpacing.toFixed(2)}em</span>
        </div>
        <Slider
          id="letter-spacing"
          min={0}
          max={0.15}
          step={0.01}
          value={[preferences.letterSpacing]}
          onValueChange={([value]) => setPreferences({ letterSpacing: value })}
        />
      </div>

      {/* Lead Bold */}
      <div className="space-y-2">
        <Label>Lead Bold Strength</Label>
        <RadioGroup
          value={preferences.leadBold}
          onValueChange={(value: LeadBoldStrength) => setPreferences({ leadBold: value })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="off" id="bold-off" />
            <Label htmlFor="bold-off" className="font-normal cursor-pointer">Off</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="short" id="bold-short" />
            <Label htmlFor="bold-short" className="font-normal cursor-pointer">Short</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="medium" id="bold-medium" />
            <Label htmlFor="bold-medium" className="font-normal cursor-pointer">Medium</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="strong" id="bold-strong" />
            <Label htmlFor="bold-strong" className="font-normal cursor-pointer">Strong</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Group Size */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="group-size">Group Color Size</Label>
          <span className="text-sm text-muted-foreground">{preferences.groupSize} words</span>
        </div>
        <Slider
          id="group-size"
          min={2}
          max={7}
          step={1}
          value={[preferences.groupSize]}
          onValueChange={([value]) => setPreferences({ groupSize: value })}
        />
      </div>

      {/* Language Hint */}
      <div className="space-y-2">
        <Label>Language Hint</Label>
        <RadioGroup
          value={preferences.langHint}
          onValueChange={(value: LanguageHint) => setPreferences({ langHint: value })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="auto" id="lang-auto" />
            <Label htmlFor="lang-auto" className="font-normal cursor-pointer">Auto-detect</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="en" id="lang-en" />
            <Label htmlFor="lang-en" className="font-normal cursor-pointer">English</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ar" id="lang-ar" />
            <Label htmlFor="lang-ar" className="font-normal cursor-pointer">Arabic</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Save Preferences */}
      {me && (
        <Button onClick={handleSavePreferences} disabled={saving} className="w-full" size="sm">
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      )}

      {/* Speech Rate */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="speech-rate">Speech Rate</Label>
          <span className="text-sm text-muted-foreground">{speechRate.toFixed(1)}x</span>
        </div>
        <Slider
          id="speech-rate"
          min={0.5}
          max={2.0}
          step={0.1}
          value={[speechRate]}
          onValueChange={([value]) => setSpeechRate(value)}
        />
      </div>

      {/* TTS Controls */}
      <div className="space-y-2">
        <Label>Read Aloud</Label>
        <div className="flex gap-2">
          <Button
            onClick={handlePlay}
            disabled={ttsState === 'playing'}
            size="sm"
            className="flex-1"
            aria-label="Play text-to-speech"
          >
            <Play className="h-4 w-4 mr-1" />
            {ttsState === 'paused' ? 'Resume' : 'Play'}
          </Button>
          <Button
            onClick={handlePause}
            disabled={ttsState !== 'playing'}
            size="sm"
            variant="outline"
            aria-label="Pause text-to-speech"
          >
            <Pause className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleStop}
            disabled={ttsState === 'idle'}
            size="sm"
            variant="outline"
            aria-label="Stop text-to-speech"
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Uses Web Speech API. Browser support may vary.
        </p>
      </div>
    </div>
  );
}
