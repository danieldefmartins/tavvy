import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WIZARD_STEPS } from '@/types/placeForm';

interface WizardProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (step: number) => void;
}

export function WizardProgress({ 
  currentStep, 
  completedSteps, 
  onStepClick 
}: WizardProgressProps) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center min-w-max px-4 gap-1">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = onStepClick && (isCompleted || step.id <= currentStep);

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all",
                  isCurrent && "bg-primary text-primary-foreground",
                  isCompleted && !isCurrent && "bg-primary/20 text-primary",
                  !isCurrent && !isCompleted && "bg-muted text-muted-foreground",
                  isClickable && "cursor-pointer hover:opacity-80",
                  !isClickable && "cursor-default"
                )}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-current/20 text-[10px]">
                    {step.id}
                  </span>
                )}
                <span className="hidden sm:inline">{step.shortLabel}</span>
              </button>
              
              {index < WIZARD_STEPS.length - 1 && (
                <div className={cn(
                  "w-4 h-0.5 mx-1",
                  isCompleted ? "bg-primary/40" : "bg-muted"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
