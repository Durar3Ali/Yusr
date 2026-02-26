import { useState, useEffect, type ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = '••••••••',
  required,
  minLength,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Reset to hidden whenever the field is cleared
  useEffect(() => {
    if (value.length === 0) setShowPassword(false);
  }, [value]);

  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShowPassword((p) => !p)}
        disabled={value.length === 0}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded p-1 disabled:opacity-50 disabled:pointer-events-none"
        aria-label={
          value.length === 0
            ? 'Show password (enter text first)'
            : showPassword
            ? 'Hide password'
            : 'Show password'
        }
        tabIndex={0}
      >
        {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
    </div>
  );
}
