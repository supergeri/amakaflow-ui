/**
 * StepProgressBar Component
 *
 * Visual progress indicator for the bulk import workflow.
 * Shows all steps with current position, clickable navigation back,
 * and adapts to skipped steps.
 */

import { CheckCircle, Circle, ChevronRight } from 'lucide-react';
import { useBulkImport } from '../../context/BulkImportContext';
import { BulkImportStep } from '../../types/bulk-import';
import { cn } from '../ui/utils';

interface StepProgressBarProps {
  className?: string;
}

const stepConfig: Record<BulkImportStep, { label: string; shortLabel: string }> = {
  detect: { label: 'Detect', shortLabel: 'Detect' },
  map: { label: 'Map Columns', shortLabel: 'Map' },
  match: { label: 'Match Exercises', shortLabel: 'Match' },
  preview: { label: 'Preview', shortLabel: 'Preview' },
  import: { label: 'Import', shortLabel: 'Import' },
};

export function StepProgressBar({ className }: StepProgressBarProps) {
  const { state, goToStep } = useBulkImport();
  const currentIndex = state.activeSteps.indexOf(state.step);

  const handleStepClick = (step: BulkImportStep, index: number) => {
    // Only allow clicking on completed steps (going back)
    if (index < currentIndex) {
      goToStep(step);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop View */}
      <div className="hidden sm:flex items-center justify-center">
        {state.activeSteps.map((step, index) => {
          const isActive = step === state.step;
          const isCompleted = index < currentIndex;
          const isClickable = index < currentIndex;
          const config = stepConfig[step];

          return (
            <div key={step} className="flex items-center">
              {/* Step Indicator */}
              <button
                onClick={() => handleStepClick(step, index)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                  isClickable && 'cursor-pointer hover:bg-white/5',
                  !isClickable && !isActive && 'cursor-default',
                  isActive && 'cursor-default'
                )}
              >
                {/* Circle/Checkmark */}
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all',
                    isActive && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                    isCompleted && 'bg-emerald-500/20 text-emerald-400',
                    !isActive && !isCompleted && 'bg-white/5 text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-sm font-medium transition-colors',
                    isActive && 'text-primary',
                    isCompleted && 'text-emerald-400',
                    !isActive && !isCompleted && 'text-muted-foreground'
                  )}
                >
                  {config.label}
                </span>
              </button>

              {/* Connector */}
              {index < state.activeSteps.length - 1 && (
                <ChevronRight
                  className={cn(
                    'w-5 h-5 mx-1 flex-shrink-0',
                    index < currentIndex ? 'text-emerald-400/50' : 'text-muted-foreground/30'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile View - Compact */}
      <div className="flex sm:hidden items-center justify-between px-2">
        {state.activeSteps.map((step, index) => {
          const isActive = step === state.step;
          const isCompleted = index < currentIndex;
          const isClickable = index < currentIndex;
          const config = stepConfig[step];

          return (
            <div key={step} className="flex flex-col items-center flex-1">
              <button
                onClick={() => handleStepClick(step, index)}
                disabled={!isClickable}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 px-1 rounded transition-all',
                  isClickable && 'cursor-pointer active:scale-95'
                )}
              >
                {/* Circle/Checkmark */}
                <div
                  className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-all',
                    isActive && 'bg-primary text-primary-foreground',
                    isCompleted && 'bg-emerald-500/20 text-emerald-400',
                    !isActive && !isCompleted && 'bg-white/5 text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Short Label */}
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors text-center',
                    isActive && 'text-primary',
                    isCompleted && 'text-emerald-400',
                    !isActive && !isCompleted && 'text-muted-foreground/60'
                  )}
                >
                  {config.shortLabel}
                </span>
              </button>

              {/* Progress line under the step */}
              {index < state.activeSteps.length - 1 && (
                <div
                  className={cn(
                    'absolute h-0.5 w-full top-[22px] left-1/2',
                    index < currentIndex ? 'bg-emerald-500/30' : 'bg-white/5'
                  )}
                  style={{ display: 'none' }} // Hidden for now, using flex gap instead
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar under steps */}
      <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500 ease-out"
          style={{
            width: `${((currentIndex + 1) / state.activeSteps.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

export default StepProgressBar;
