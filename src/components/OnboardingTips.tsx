import { useState, useEffect } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';

const ONBOARDING_KEY = 'yusr-onboarding-dismissed';

export function OnboardingTips() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(ONBOARDING_KEY);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 space-y-3">
          <h3 className="font-semibold text-lg">{copy.onboarding.title}</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            {copy.onboarding.steps.map((step, index) => (
              <li key={index} className="flex gap-2">
                <span className="font-semibold text-foreground">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="flex-shrink-0"
          aria-label="Dismiss tips"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
