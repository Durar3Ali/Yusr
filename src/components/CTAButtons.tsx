import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface CTAButtonsProps {
  primaryText: string;
  primaryHref: string;
  secondaryText?: string;
  secondaryHref?: string;
  className?: string;
}

export function CTAButtons({
  primaryText,
  primaryHref,
  secondaryText,
  secondaryHref,
  className = '',
}: CTAButtonsProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
      <Button asChild size="lg" className="group">
        <Link to={primaryHref}>
          {primaryText}
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </Button>
      {secondaryText && secondaryHref && (
        <Button asChild variant="outline" size="lg">
          <Link to={secondaryHref}>{secondaryText}</Link>
        </Button>
      )}
    </div>
  );
}
