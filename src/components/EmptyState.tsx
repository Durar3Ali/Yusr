import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onLoadSample: () => void;
}

export function EmptyState({ onLoadSample }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[500px] p-8">
      <div className="text-center space-y-6 max-w-md animate-fade-in">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <FileQuestion className="h-10 w-10 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">No text to display</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Paste text or upload a PDF in the input section to start reading with
            customized formatting.
          </p>
        </div>
        
        <Button onClick={onLoadSample} variant="outline" size="lg">
          Try Sample Text
        </Button>
      </div>
    </div>
  );
}
