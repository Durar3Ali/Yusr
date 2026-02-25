import type { LeadBoldStrength } from '@/types';
import { LEAD_BOLD_OPTIONS } from '@/lib/constants';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface LeadBoldRadioGroupProps {
  idPrefix?: string;
  value: LeadBoldStrength;
  onValueChange: (value: LeadBoldStrength) => void;
}

export function LeadBoldRadioGroup({
  idPrefix = 'lead-bold',
  value,
  onValueChange,
}: LeadBoldRadioGroupProps) {
  return (
    <div className="space-y-2">
      <Label>Lead Bold Strength</Label>
      <RadioGroup value={value} onValueChange={onValueChange}>
        {LEAD_BOLD_OPTIONS.map(opt => (
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
