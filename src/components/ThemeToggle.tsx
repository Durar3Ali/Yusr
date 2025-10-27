import { usePreferences } from '@/context/PreferencesContext';
import { Theme } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Palette } from 'lucide-react';

export function ThemeToggle() {
  const { preferences, setPreferences } = usePreferences();

  const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light-yellow', label: 'Light Yellow', icon: Sun },
    { value: 'light-blue', label: 'Light Blue', icon: Sun },
    { value: 'sepia', label: 'Sepia', icon: Palette },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Change theme">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 bg-card">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => setPreferences({ theme: theme.value })}
            className={preferences.theme === theme.value ? 'bg-accent' : ''}
          >
            <theme.icon className="mr-2 h-4 w-4" />
            {theme.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
