import type { Theme } from '@/types';
import { THEME_OPTIONS } from '@/lib/constants';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ThemeSelectProps {
  id?: string;
  value: Theme;
  onValueChange: (value: Theme) => void;
}

export function ThemeSelect({ id = 'theme', value, onValueChange }: ThemeSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Theme</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-50 bg-popover">
          {THEME_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
