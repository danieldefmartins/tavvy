import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ActionCardProps {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}

export function ActionCard({
  to,
  icon: Icon,
  title,
  description,
  variant = 'secondary',
  disabled = false,
  className,
}: ActionCardProps) {
  const content = (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-5 transition-all duration-200',
        'border',
        variant === 'primary'
          ? 'gradient-hero border-primary/20 text-primary-foreground shadow-glow'
          : 'bg-card border-border text-foreground hover:shadow-card',
        !disabled && 'hover:-translate-y-0.5 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
            variant === 'primary'
              ? 'bg-primary-foreground/20'
              : 'bg-primary/10'
          )}
        >
          <Icon
            className={cn(
              'w-6 h-6',
              variant === 'primary' ? 'text-primary-foreground' : 'text-primary'
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'font-display font-semibold text-lg mb-1',
              variant === 'primary' ? 'text-primary-foreground' : 'text-foreground'
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              'text-sm',
              variant === 'primary'
                ? 'text-primary-foreground/80'
                : 'text-muted-foreground'
            )}
          >
            {description}
          </p>
        </div>
      </div>

      {disabled && (
        <div className="absolute top-2 right-2 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
          Coming soon
        </div>
      )}
    </div>
  );

  if (disabled) {
    return content;
  }

  return <Link to={to}>{content}</Link>;
}
