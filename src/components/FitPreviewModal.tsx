import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Repeat, Timer, Dumbbell, Eye } from 'lucide-react';
import { WorkoutStructure } from '../types/workout';

interface FitPreviewModalProps {
  workout: WorkoutStructure;
  trigger?: React.ReactNode;
}

interface PreviewStep {
  name: string;
  reps?: number | string;
  distance?: string;
  duration?: number;
  restDuration?: number;
  sets?: number;
  type?: string;
}

function getGarminDisplayName(name: string): string {
  if (!name) return 'Unknown';
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('trap bar')) return 'Trap Bar Deadlift';
  if (nameLower.includes('push') && nameLower.includes('up')) return 'Push Up';
  if (nameLower.includes('incline') && nameLower.includes('bench')) return 'Incline Bench Press';
  if (nameLower.includes('bench') || nameLower.includes('chest press')) return 'Bench Press';
  if (nameLower.includes('split squat') || nameLower.includes('bulgarian')) return 'Bulgarian Split Squat';
  if (nameLower.includes('squat')) return 'Squat';
  if (nameLower.includes('deadlift')) return 'Deadlift';
  if (nameLower.includes('burpee')) return 'Burpee';
  if (nameLower.includes('lunge')) return 'Lunge';
  if (nameLower.includes('curl')) return 'Curl';
  if (nameLower.includes('crunch')) return 'Crunch';
  if (nameLower.includes('plank')) return 'Plank';
  if (nameLower.includes('row')) return 'Row';
  if (nameLower.includes('pull') && nameLower.includes('down')) return 'Lat Pulldown';
  if (nameLower.includes('pull') && nameLower.includes('up')) return 'Pull Up';
  if (nameLower.includes('dip')) return 'Dip';
  if (nameLower.includes('run')) return 'Run';
  if (nameLower.includes('ski')) return 'Ski Erg';
  
  return name;
}

function blocksToPreviewSteps(workout: WorkoutStructure): PreviewStep[] {
  const steps: PreviewStep[] = [];
  
  if (!workout?.blocks) return steps;
  
  for (const block of workout.blocks) {
    const restBetween = block.rest_between_sec;
    const allExercises: any[] = [];
    
    if (block.supersets && Array.isArray(block.supersets)) {
      for (const superset of block.supersets) {
        if (superset.exercises && Array.isArray(superset.exercises)) {
          allExercises.push(...superset.exercises);
        }
      }
    }
    
    if (block.exercises && Array.isArray(block.exercises)) {
      allExercises.push(...block.exercises);
    }
    
    for (const exercise of allExercises) {
      const name = exercise.name || exercise.exercise_name || 'Unknown';
      
      // Get reps - could be number, string like "1000m", or undefined
      const repsValue = exercise.reps || exercise.rep_count;
      let reps: number | string | undefined;
      let distance: string | undefined;
      
      if (repsValue) {
        // Check if it's a distance (contains 'm' for meters)
        if (typeof repsValue === 'string' && repsValue.includes('m')) {
          distance = repsValue;
        } else {
          reps = repsValue;
        }
      }
      
      // Get sets - only if explicitly defined and > 1
      const setsValue = exercise.sets || exercise.set_count;
      const sets = setsValue && setsValue > 1 ? setsValue : undefined;
      
      // Get duration if available
      const duration = exercise.duration_sec || exercise.duration;
      
      steps.push({
        name: getGarminDisplayName(name),
        reps,
        distance,
        duration,
        sets,
        restDuration: restBetween,
        type: exercise.type,
      });
    }
  }
  
  return steps;
}

export function FitPreviewModal({ workout, trigger }: FitPreviewModalProps) {
  const [open, setOpen] = useState(false);
  const steps = blocksToPreviewSteps(workout);
  
  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Eye className="w-4 h-4 mr-2" />
      Preview on Watch
    </Button>
  );
  
  // Calculate total sets
  const totalSets = steps.reduce((sum, s) => sum + (s.sets || 1), 0);
  
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
            
            {steps.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#666', padding: '32px 0' }}>
                No exercises found
              </div>
            ) : (
              <div style={{ maxHeight: '256px', overflowY: 'auto' }}>
                {steps.map((step, idx) => (
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
                      <span style={{ color: '#93c5fd', fontSize: '14px', fontWeight: 500 }}>{step.name}</span>
                    </div>
                    
                    {/* Details row - only show what's actually defined */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', marginLeft: '22px', fontSize: '12px' }}>
                      {/* Distance */}
                      {step.distance && (
                        <span style={{ 
                          backgroundColor: '#059669', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          fontSize: '11px'
                        }}>
                          {step.distance}
                        </span>
                      )}
                      
                      {/* Reps - only if defined */}
                      {step.reps && !step.distance && (
                        <span style={{ 
                          backgroundColor: '#1d4ed8', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          fontSize: '11px'
                        }}>
                          {step.reps} reps
                        </span>
                      )}
                      
                      {/* Duration */}
                      {step.duration && (
                        <span style={{ 
                          backgroundColor: '#7c3aed', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          fontSize: '11px'
                        }}>
                          {step.duration}s
                        </span>
                      )}
                      
                      {/* Sets - only if > 1 */}
                      {step.sets && step.sets > 1 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4ade80', fontWeight: 500 }}>
                          <Repeat style={{ width: '12px', height: '12px' }} />
                          {step.sets}x
                        </span>
                      )}
                      
                      {/* Rest - only if defined */}
                      {step.restDuration && step.restDuration > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#666' }}>
                          <Timer style={{ width: '12px', height: '12px' }} />
                          {step.restDuration}s
                        </span>
                      )}
                      
                      {/* Type badge */}
                      {step.type && (
                        <span style={{ 
                          backgroundColor: '#374151', 
                          color: '#9ca3af', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          fontSize: '10px'
                        }}>
                          {step.type}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#666', marginTop: '16px', paddingTop: '8px', borderTop: '1px solid #333' }}>
              {steps.length} exercise{steps.length !== 1 ? 's' : ''}
              {totalSets > steps.length && ` • ${totalSets} total sets`}
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 text-xs text-muted-foreground pt-2">
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
      </DialogContent>
    </Dialog>
  );
}

export default FitPreviewModal;
