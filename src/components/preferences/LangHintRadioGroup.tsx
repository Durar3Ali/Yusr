import type { LanguageHint } from '@/types';
import { LANG_HINT_OPTIONS } from '@/lib/constants';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface LangHintRadioGroupProps {
  idPrefix?: string;
  value: LanguageHint;
  onValueChange: (value: LanguageHint) => void;
}

export function LangHintRadioGroup({
  idPrefix = 'lang-hint',
  value,
  onValueChange,
}: LangHintRadioGroupProps) {
  return (
    <div className="space-y-2">
      <Label>Language Hint</Label>
      <RadioGroup value={value} onValueChange={onValueChange}>
        {LANG_HINT_OPTIONS.map(opt => (
          <div key={opt.value} className="flex items-center space-x-2">
            <RadioGroupItem value={opt.value} id={`${idPrefix}-${opt.value}`} />
            <Label htmlFor={`${idPrefix}-${opt.value}`} className="font-normal cursor-pointer">
              {opt.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
