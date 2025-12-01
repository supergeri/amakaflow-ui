import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Smartphone, Watch, Loader2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { WorkoutStructure } from '../types/workout';

interface FollowAlongSetupProps {
  workout: WorkoutStructure;
  userId: string;
  sourceUrl?: string;
}

export function FollowAlongSetup({ workout, userId, sourceUrl }: FollowAlongSetupProps) {
  const [enabled, setEnabled] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendTarget, setSendTarget] = useState<'ios' | 'watch' | 'both' | null>(null);

  const MAPPER_API_BASE_URL = import.meta.env.VITE_MAPPER_API_URL || 'http://localhost:8001';

  const handleSend = async (target: 'ios' | 'watch' | 'both') => {
    if (!workout || !userId) {
      toast.error('Workout data or user missing');
      return;
    }

    setIsSending(true);
    setSendTarget(target);

    try {
      const saveResponse = await fetch(`${MAPPER_API_BASE_URL}/follow-along/from-workout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          workout,
          sourceUrl: sourceUrl || '',
        }),
      });

      if (!saveResponse.ok) {
        const error = await saveResponse.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to create follow-along workout');
      }

      const { followAlongWorkoutId, success, message } = await saveResponse.json();
      
      if (!success) {
        throw new Error(message || 'Failed to create follow-along workout');
      }

      if (target === 'ios' || target === 'both') {
        const iosResponse = await fetch(
          `${MAPPER_API_BASE_URL}/follow-along/${followAlongWorkoutId}/push/ios-companion`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          }
        );
        
        if (!iosResponse.ok) {
          console.warn('Failed to send to iOS, continuing...');
        }
      }

      if (target === 'watch' || target === 'both') {
        const watchResponse = await fetch(
          `${MAPPER_API_BASE_URL}/follow-along/${followAlongWorkoutId}/push/apple-watch`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          }
        );
        
        if (!watchResponse.ok) {
          console.warn('Failed to send to Watch, continuing...');
        }
      }

      const targetName = target === 'ios' 
        ? 'iPhone' 
        : target === 'watch' 
        ? 'Apple Watch' 
        : 'iPhone & Apple Watch';

      toast.success(`Sent to ${targetName}!`, {
        description: 'Open the AmakaFlow app to start your follow-along workout',
      });

    } catch (error: any) {
      console.error('Failed to send follow-along:', error);
      toast.error(`Failed to send: ${error.message}`);
    } finally {
      setIsSending(false);
      setSendTarget(null);
    }
  };

  const exerciseCount = workout?.blocks?.reduce(
    (count, block) => count + (block.exercises?.length || 0),
    0
  ) || 0;

  return (
    <Card className={enabled ? 'border-primary ring-2 ring-primary/20' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Follow-Along Mode</CardTitle>
              <CardDescription>
                Send this workout to your phone for guided follow-along
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{enabled ? 'On' : 'Off'}</span>
            <Switch 
              checked={enabled} 
              onCheckedChange={setEnabled}
            />
          </div>
        </div>
      </CardHeader>

      {enabled && (
        <CardContent className="space-y-4 pt-0">
          <div className="p-3 bg-muted rounded-lg text-sm">
            <span className="font-medium">{exerciseCount} exercises</span>
            <span className="text-muted-foreground"> will be sent as follow-along steps</span>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Send to:</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => handleSend('ios')}
                disabled={isSending}
                className="flex-col h-auto py-3"
              >
                {isSending && sendTarget === 'ios' ? (
                  <Loader2 className="w-5 h-5 mb-1 animate-spin" />
                ) : (
                  <Smartphone className="w-5 h-5 mb-1" />
                )}
                <span className="text-xs">iPhone</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSend('watch')}
                disabled={isSending}
                className="flex-col h-auto py-3"
              >
                {isSending && sendTarget === 'watch' ? (
                  <Loader2 className="w-5 h-5 mb-1 animate-spin" />
                ) : (
                  <Watch className="w-5 h-5 mb-1" />
                )}
                <span className="text-xs">Apple Watch</span>
              </Button>
              <Button
                variant="default"
                onClick={() => handleSend('both')}
                disabled={isSending}
                className="flex-col h-auto py-3"
              >
                {isSending && sendTarget === 'both' ? (
                  <Loader2 className="w-5 h-5 mb-1 animate-spin" />
                ) : (
                  <div className="flex gap-1 mb-1">
                    <Smartphone className="w-4 h-4" />
                    <Watch className="w-4 h-4" />
                  </div>
                )}
                <span className="text-xs">Both</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Follow along on your phone—watch is optional
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}