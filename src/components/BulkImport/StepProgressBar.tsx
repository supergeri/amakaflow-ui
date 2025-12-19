/**
 * StepProgressBar Component
 *
 * Visual progress indicator for the bulk import workflow.
 * Matches the Create Workout stepper style exactly.
 */

import { Check, ChevronRight } from 'lucide-react';
import { useBulkImport } from '../../context/BulkImportContext';
import { BulkImportStep } from '../../types/bulk-import';
import { cn } from '../ui/utils';

interface StepProgressBarProps {
  className?: string;
}

const stepConfig: Record<BulkImportStep, { label: string }> = {
  detect: { label: 'Add Sources' },
  map: { label: 'Map Columns' },
  match: { label: 'Match Exercises' },
  preview: { label: 'Preview' },
  import: { label: 'Import' },
};

export function StepProgressBar({ className }: StepProgressBarProps) {
  const { state, goToStep } = useBulkImport();
  const currentIndex = state.activeSteps.indexOf(state.step);

  const handleStepClick = (step: BulkImportStep, index: number) => {
    if (index < currentIndex) {
      goToStep(step);
    }
  };

  return (
    <div className={cn('w-full flex items-center justify-center flex-wrap gap-y-2', className)}>
      {state.activeSteps.map((step, index) => {
        const isActive = step === state.step;
        const isCompleted = index < currentIndex;
        const isPending = index > currentIndex;
        const isClickable = index < currentIndex;
        const config = stepConfig[step];

        return (
          <div key={step} className="flex items-center">
            {/* Step button with circle and label */}
            <button
              onClick={() => handleStepClick(step, index)}
              disabled={!isClickable}
              className={cn(
                'flex items-center gap-2 transition-all',
                isClickable && 'cursor-pointer hover:opacity-80',
                !isClickable && 'cursor-default'
              )}
            >
              {/* Circle with number */}
              <span
                className={cn(
                  'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold',
                  isActive && 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900',
                  isCompleted && 'bg-emerald-500 text-white',
                  isPending && 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400'
                )}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                ) : (
                  index + 1
                )}
              </span>

              {/* Label */}
              <span
                className={cn(
                  'text-sm font-medium',
                  isActive && 'text-zinc-900 dark:text-zinc-100',
                  isCompleted && 'text-emerald-600 dark:text-emerald-500',
                  isPending && 'text-zinc-400 dark:text-zinc-500'
                )}
              >
                {config.label}
              </span>
            </button>

            {/* Chevron */}
            {index < state.activeSteps.length - 1 && (
              <ChevronRight
                className={cn(
                  'w-4 h-4 mx-3 flex-shrink-0',
                  index < currentIndex ? 'text-emerald-500' : 'text-zinc-300 dark:text-zinc-600'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StepProgressBar;
