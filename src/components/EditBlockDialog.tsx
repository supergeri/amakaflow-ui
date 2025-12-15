import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Block, RestType } from '../types/workout';

interface EditBlockDialogProps {
  open: boolean;
  block: Block | null;
  onSave: (updates: { label?: string; restType?: RestType; restSec?: number | null }) => void;
  onClose: () => void;
}

// Format duration in seconds to human-readable format
const formatDuration = (seconds: number): string => {
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainingSec = seconds % 60;
    return remainingSec > 0 ? `${minutes}m ${remainingSec}s` : `${minutes}m`;
  }
  return `${seconds}s`;
};

export function EditBlockDialog({ open, block, onSave, onClose }: EditBlockDialogProps) {
  const [label, setLabel] = useState('');
  const [restType, setRestType] = useState<RestType>('timed');
  const [restSec, setRestSec] = useState(0);

  // Initialize state when block changes
  useEffect(() => {
    if (block) {
      setLabel(block.label || '');
      // Get rest type and duration from first exercise (block-level or superset)
      const firstBlockExercise = block.exercises?.[0];
      const firstSupersetExercise = block.supersets?.[0]?.exercises?.[0];
      const firstExercise = firstBlockExercise || firstSupersetExercise;

      setRestType(firstExercise?.rest_type || block.rest_type || 'timed');
      setRestSec(firstExercise?.rest_sec ?? 0);
    }
  }, [block]);

  const handleSave = () => {
    onSave({
      label,
      restType,
      restSec: restType === 'button' ? null : restSec,
    });
    onClose();
  };

  if (!block) return null;

  // Count all exercises including those in supersets
  const blockExerciseCount = block.exercises?.filter(e => e != null).length || 0;
  const supersetExerciseCount = (block.supersets || []).reduce(
    (sum, ss) => sum + (ss.exercises?.length || 0),
    0
  );
  const exerciseCount = blockExerciseCount + supersetExerciseCount;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Block</DialogTitle>
          <DialogDescription>
            Changes to rest settings will apply to all {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} in this block
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Block Name */}
          <div className="space-y-2">
            <Label>Block Name</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Block name"
            />
          </div>

          {/* Rest After Exercise (applies to all) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Rest After Exercise</Label>
              <Select
                value={restType}
                onValueChange={(value: RestType) => setRestType(value)}
              >
                <SelectTrigger className="w-36 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timed">Timed</SelectItem>
                  <SelectItem value="button">Lap Button</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {restType === 'timed' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium">{formatDuration(restSec)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-8">0s</span>
                  <Slider
                    value={[restSec]}
                    onValueChange={(values) => setRestSec(values[0])}
                    min={0}
                    max={300}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right">5m</span>
                  <Input
                    type="number"
                    value={restSec}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setRestSec(Math.max(0, Math.min(600, val)));
                    }}
                    className="w-20 h-9 text-center"
                    min={0}
                    max={600}
                    placeholder="sec"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Will be applied to all exercises in this block
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                Press lap button when ready to continue to next exercise
              </p>
            )}
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
