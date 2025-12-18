/**
 * BulkImport Component
 *
 * Main container for the bulk import workflow.
 * Wraps children with BulkImportProvider for state management.
 *
 * This is a placeholder component - UI will be implemented in AMA-105.
 */

import { BulkImportProvider, useBulkImport } from '../../context/BulkImportContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, ArrowRight, Upload, Link, Image, FileSpreadsheet, CheckCircle } from 'lucide-react';

interface BulkImportProps {
  userId: string;
  onBack?: () => void;
}

/**
 * Step indicator showing current progress
 */
function BulkImportStepper() {
  const { state } = useBulkImport();

  const stepLabels: Record<string, string> = {
    detect: 'Detect',
    map: 'Map Columns',
    match: 'Match Exercises',
    preview: 'Preview',
    import: 'Import',
  };

  const currentIndex = state.activeSteps.indexOf(state.step);

  return (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {state.activeSteps.map((step, index) => {
        const isActive = step === state.step;
        const isCompleted = index < currentIndex;

        return (
          <div key={step} className="flex items-center">
            <div
              className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${isActive ? 'bg-primary text-primary-foreground' : ''}
                ${isCompleted ? 'bg-primary/20 text-primary' : ''}
                ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
              `}
            >
              {isCompleted ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={`ml-2 text-sm ${isActive ? 'font-medium' : 'text-muted-foreground'}`}
            >
              {stepLabels[step]}
            </span>
            {index < state.activeSteps.length - 1 && (
              <ArrowRight className="w-4 h-4 mx-4 text-muted-foreground" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Placeholder content showing current state
 * UI components will be implemented in AMA-105
 */
function BulkImportContent({ userId, onBack }: BulkImportProps) {
  const { state, goNext, goBack, canGoNext, canGoBack, setInputType, reset } = useBulkImport();

  const inputTypeIcons = {
    file: FileSpreadsheet,
    urls: Link,
    images: Image,
  };

  const InputIcon = inputTypeIcons[state.inputType];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Bulk Import</h1>
            <p className="text-muted-foreground">
              Import multiple workouts at once
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          Start Over
        </Button>
      </div>

      {/* Stepper */}
      <BulkImportStepper />

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <InputIcon className="w-5 h-5" />
            <span>Step: {state.step}</span>
          </CardTitle>
          <CardDescription>
            {state.step === 'detect' && 'Select files, URLs, or images to import'}
            {state.step === 'map' && 'Map columns to workout fields'}
            {state.step === 'match' && 'Match exercises to Garmin database'}
            {state.step === 'preview' && 'Review workouts before importing'}
            {state.step === 'import' && 'Import workouts to your device'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Placeholder - actual UI will be in AMA-105 */}
          <div className="space-y-4">
            {/* Input Type Selection (detect step) */}
            {state.step === 'detect' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={state.inputType === 'file' ? 'default' : 'outline'}
                    className="h-24 flex-col"
                    onClick={() => setInputType('file')}
                  >
                    <FileSpreadsheet className="w-8 h-8 mb-2" />
                    <span>File</span>
                    <span className="text-xs text-muted-foreground">Excel, CSV, JSON</span>
                  </Button>
                  <Button
                    variant={state.inputType === 'urls' ? 'default' : 'outline'}
                    className="h-24 flex-col"
                    onClick={() => setInputType('urls')}
                  >
                    <Link className="w-8 h-8 mb-2" />
                    <span>URLs</span>
                    <span className="text-xs text-muted-foreground">YouTube, TikTok</span>
                  </Button>
                  <Button
                    variant={state.inputType === 'images' ? 'default' : 'outline'}
                    className="h-24 flex-col"
                    onClick={() => setInputType('images')}
                  >
                    <Image className="w-8 h-8 mb-2" />
                    <span>Images</span>
                    <span className="text-xs text-muted-foreground">OCR scan</span>
                  </Button>
                </div>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Drag and drop {state.inputType === 'file' ? 'files' : state.inputType === 'urls' ? 'or paste URLs' : 'images'} here
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    (UI coming in AMA-105)
                  </p>
                </div>
              </div>
            )}

            {/* Other steps show placeholder */}
            {state.step !== 'detect' && (
              <div className="text-center py-8 text-muted-foreground">
                <p>UI for &apos;{state.step}&apos; step coming in AMA-105</p>
                {state.jobId && (
                  <p className="text-xs mt-2">Job ID: {state.jobId}</p>
                )}
              </div>
            )}

            {/* Debug info */}
            <div className="mt-8 p-4 bg-muted rounded-lg text-xs font-mono">
              <p className="font-semibold mb-2">Debug State:</p>
              <p>Step: {state.step}</p>
              <p>Input Type: {state.inputType}</p>
              <p>Active Steps: {state.activeSteps.join(' -> ')}</p>
              <p>Job ID: {state.jobId || 'none'}</p>
              <p>Detected Items: {state.detected.items.length}</p>
              <p>Selected: {state.detected.selectedIds.length}</p>
              <p>Loading: {state.loading ? 'yes' : 'no'}</p>
              <p>Error: {state.error || 'none'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={!canGoBack()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={goNext}
          disabled={!canGoNext()}
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Main BulkImport component with provider
 */
export function BulkImport({ userId, onBack }: BulkImportProps) {
  return (
    <BulkImportProvider>
      <BulkImportContent userId={userId} onBack={onBack} />
    </BulkImportProvider>
  );
}

export default BulkImport;
