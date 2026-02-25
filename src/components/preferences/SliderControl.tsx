import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface SliderControlProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onValueChange: (value: number) => void;
}

export function SliderControl({
  id,
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onValueChange,
}: SliderControlProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-sm text-muted-foreground">{displayValue}</span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onValueChange(v)}
      />
    </div>
  );
}
