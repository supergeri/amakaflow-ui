import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Repeat, Timer, Dumbbell, Eye, Loader2, Copy, Check } from 'lucide-react';
import { WorkoutStructure, ValidationResponse } from '../types/workout';
import { applyValidationMappings } from '../lib/workout-utils';
import { toast } from 'sonner';

interface FitPreviewModalProps {
  workout: WorkoutStructure;
  validation?: ValidationResponse | null;
  trigger?: React.ReactNode;
  useLapButton?: boolean;
}

// Backend preview step format
interface BackendPreviewStep {
  type: 'exercise' | 'rest' | 'repeat';
  display_name: string;
  original_name?: string;
  category_id?: number;
  category_name?: string;
  duration_type?: string;
  duration_display?: string;
  reps?: number | string;
  sets?: number;
  rest_seconds?: number;
  repeat_count?: number;
}

export function FitPreviewModal({ workout, validation, trigger, useLapButton = false }: FitPreviewModalProps) {
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<BackendPreviewStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyDebugJson = async () => {
    const mappedWorkout = applyValidationMappings(workout, validation);
    const debugData = {
      original_workout: workout,
      mapped_workout: mappedWorkout,
      validation: validation,
      preview_steps: steps,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
      setCopied(true);
      toast.success('Debug JSON copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy debug JSON');
    }
  };

  // Fetch preview steps from backend when modal opens
  useEffect(() => {
    if (!open || !workout) return;

    const fetchPreviewSteps = async () => {
      setLoading(true);
      setError(null);

      try {
        const MAPPER_API_BASE_URL = import.meta.env.VITE_MAPPER_API_URL || 'http://localhost:8001';
        // Apply validation mappings to use user-confirmed Garmin names
        const mappedWorkout = applyValidationMappings(workout, validation);
        const res = await fetch(`${MAPPER_API_BASE_URL}/map/preview-steps?use_lap_button=${useLapButton}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blocks_json: mappedWorkout }),
        });

        if (!res.ok) {
          throw new Error('Failed to fetch preview');
        }

        const data = await res.json();
        setSteps(data.steps || []);
      } catch (err) {
        console.error('Failed to fetch preview steps:', err);
        setError('Failed to load preview');
        // Fallback to empty
        setSteps([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPreviewSteps();
  }, [open, workout, validation, useLapButton]);

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Eye className="w-4 h-4 mr-2" />
      Preview on Watch
    </Button>
  );

  // Filter to only exercise steps for counting
  const exerciseSteps = steps.filter(s => s.type === 'exercise');
  const totalSets = exerciseSteps.reduce((sum, s) => sum + (s.sets || 1), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Garmin Watch Preview</DialogTitle>
          <DialogDescription>
            How this workout will appear on your Garmin watch
          </DialogDescription>
        </DialogHeader>

        {/* Watch-like display */}
        <div style={{ backgroundColor: '#1a1a1a', borderRadius: '24px', padding: '20px' }}>
          <div style={{ border: '2px solid #333', borderRadius: '16px', padding: '16px', backgroundColor: '#000' }}>
            {/* Workout title */}
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #333' }}>
              {workout?.title || 'Workout'}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', color: '#666', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#60a5fa' }} />
                <span>Loading preview...</span>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', color: '#ef4444', padding: '32px 0' }}>
                {error}
              </div>
            ) : exerciseSteps.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', padding: '32px 0' }}>
                No exercises found
              </div>
            ) : (
              <div style={{ maxHeight: '256px', overflowY: 'auto' }}>
                {exerciseSteps.map((step, idx) => (
                  <div key={idx} style={{
                    borderLeft: '3px solid #3b82f6',
                    paddingLeft: '12px',
                    marginBottom: '12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '0 8px 8px 0',
                    padding: '8px 8px 8px 12px'
                  }}>
                    {/* Exercise name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Dumbbell style={{ width: '14px', height: '14px', color: '#60a5fa' }} />
                      <span style={{ color: '#93c5fd', fontSize: '14px', fontWeight: 500 }}>{step.display_name}</span>
                    </div>

                    {/* Details row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', marginLeft: '22px', fontSize: '12px' }}>
                      {/* Duration display from backend */}
                      {step.duration_display && (
                        <span style={{
                          backgroundColor: step.duration_type === 'distance' ? '#059669' :
                                         step.duration_type === 'time' ? '#7c3aed' :
                                         step.duration_type === 'lap_button' ? '#f59e0b' : '#1d4ed8',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px'
                        }}>
                          {step.duration_display}
                        </span>
                      )}

                      {/* Sets - only if > 1 */}
                      {step.sets && step.sets > 1 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4ade80', fontWeight: 500 }}>
                          <Repeat style={{ width: '12px', height: '12px' }} />
                          {step.sets}x
                        </span>
                      )}

                      {/* Category badge */}
                      {step.category_name && (
                        <span style={{
                          backgroundColor: '#374151',
                          color: '#9ca3af',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px'
                        }}>
                          {step.category_name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#666', marginTop: '16px', paddingTop: '8px', borderTop: '1px solid #333' }}>
              {exerciseSteps.length} exercise{exerciseSteps.length !== 1 ? 's' : ''}
              {totalSets > exerciseSteps.length && ` \u2022 ${totalSets} total sets`}
            </div>
          </div>
        </div>

        {/* Legend and Debug */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Dumbbell className="w-3 h-3 text-blue-500" />
              <span>Exercise</span>
            </div>
            <div className="flex items-center gap-1">
              <Repeat className="w-3 h-3 text-green-500" />
              <span>Sets</span>
            </div>
            <div className="flex items-center gap-1">
              <Timer className="w-3 h-3 text-gray-500" />
              <span>Rest</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyDebugJson}
            title="Copy debug JSON (workout + validation + preview)"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FitPreviewModal;
