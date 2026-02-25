import type { FontFamily } from '@/types';
import { FONT_OPTIONS } from '@/lib/constants';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FontFamilySelectProps {
  id?: string;
  value: FontFamily;
  onValueChange: (value: FontFamily) => void;
}

export function FontFamilySelect({ id = 'font-family', value, onValueChange }: FontFamilySelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Font</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-50 bg-popover">
          {FONT_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        All fonts optimized for dyslexia-friendly reading
      </p>
    </div>
  );
}
