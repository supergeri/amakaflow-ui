import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { AddSources } from './components/AddSources';
import { StructureWorkout } from './components/StructureWorkout';
import { ValidateMap } from './components/ValidateMap';
import { PublishExport } from './components/PublishExport';
import { UserNav } from './components/UserNav';
import { SettingsPanel } from './components/SettingsPanel';
import { UsageLimitBanner } from './components/UsageLimitBanner';
import { WorkoutHelp } from './components/WorkoutHelp';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Dumbbell, ChevronRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { User } from './types/auth';
import { Source, WorkoutStructure, ValidationResponse, ExportFormats } from './types/workout';
import { DeviceId } from './lib/devices';
import { generateWorkoutStructure, validateWorkout, processWorkflow } from './lib/mock-api';

type Step = 'sources' | 'structure' | 'validate' | 'export';

// Main App Component
export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Workout state
  const [currentStep, setCurrentStep] = useState<Step>('sources');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [workout, setWorkout] = useState<WorkoutStructure | null>(null);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [exports, setExports] = useState<ExportFormats | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DeviceId>('garmin');

  const steps: Array<{ id: Step; label: string; number: number }> = [
    { id: 'sources', label: 'Add Sources', number: 1 },
    { id: 'structure', label: 'Structure Workout', number: 2 },
    { id: 'validate', label: 'Validate & Map', number: 3 },
    { id: 'export', label: 'Publish & Export', number: 4 }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleStartNew = () => {
    setSources([]);
    setWorkout(null);
    setValidation(null);
    setExports(null);
    setCurrentStep('sources');
  };

  // Auth handlers
  const handleLogin = (email: string, password: string) => {
    // Mock login - in production this would call an API
    const newUser: User = {
      id: '1',
      email,
      name: email.split('@')[0],
      subscription: 'free',
      workoutsThisWeek: 0,
      selectedDevices: ['garmin'],
      billingDate: undefined
    };
    setUser(newUser);
    toast.success(`Welcome back, ${newUser.name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    handleStartNew();
    toast.success('Logged out successfully');
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...updates });
  };

  const handleOpenUpgrade = () => {
    setIsSettingsOpen(true);
    // Auto-navigate to billing tab - we'll set this in SettingsPanel
  };

  // Check if user can export (usage limits)
  const canExport = !user || user.subscription !== 'free' || user.workoutsThisWeek < 1;

  // Track workout export
  const incrementWorkoutCount = () => {
    if (user && user.subscription === 'free') {
      handleUpdateUser({ workoutsThisWeek: user.workoutsThisWeek + 1 });
    }
  };

  // Workflow handlers
  const handleGenerateStructure = async (newSources: Source[]) => {
    setLoading(true);
    try {
      const sourcesData = newSources.map(s => ({ type: s.type, content: s.content }));
      const structure = await generateWorkoutStructure(sourcesData);
      setWorkout(structure);
      setSources(newSources);
      setCurrentStep('structure');
      toast.success('Workout structure generated successfully!');
    } catch (error) {
      toast.error('Failed to generate workout structure');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTemplate = (template: WorkoutStructure) => {
    setWorkout(template);
    setSources([]);
    setCurrentStep('structure');
    toast.success(`Loaded template: ${template.title}`);
  };

  const handleAutoMap = async () => {
    if (!workout) return;
    setLoading(true);
    try {
      const exportFormats = await processWorkflow(workout, true);
      setExports(exportFormats);
      setCurrentStep('export');
      toast.success('Workout auto-mapped and ready to export!');
    } catch (error) {
      toast.error('Failed to auto-map workout');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!workout) return;
    setLoading(true);
    try {
      const validationResult = await validateWorkout(workout);
      setValidation(validationResult);
      setCurrentStep('validate');
      if (validationResult.can_proceed) {
        toast.success('All exercises validated successfully!');
      } else {
        toast.warning('Some exercises need review');
      }
    } catch (error) {
      toast.error('Failed to validate workout');
    } finally {
      setLoading(false);
    }
  };

  const handleReValidate = async () => {
    if (!workout) return;
    setLoading(true);
    try {
      const validationResult = await validateWorkout(workout);
      setValidation(validationResult);
      toast.success('Re-validation complete');
    } catch (error) {
      toast.error('Failed to re-validate workout');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (device: DeviceId) => {
    if (!workout) return;
    setLoading(true);
    setSelectedDevice(device);
    try {
      const exportFormats = await processWorkflow(workout, true);
      setExports(exportFormats);
      setCurrentStep('export');
      toast.success(`Workout processed for ${device === 'garmin' ? 'Garmin' : device === 'apple' ? 'Apple Watch' : 'Zwift'}!`);
    } catch (error) {
      toast.error('Failed to process workout');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const canGoBack = currentStepIndex > 0;

  // Show login page if not authenticated
  if (!user) {
    return (
      <>
        <Toaster position="top-center" />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />
      
      {/* User Navigation Bar */}
      <UserNav 
        user={user}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
      />

      {/* Settings Panel */}
      <SettingsPanel
        user={user}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateUser={handleUpdateUser}
      />
      
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl">AmakaFlow</h1>
                <p className="text-sm text-muted-foreground">
                  Workout Ingest → Mapping → Export
                </p>
              </div>
            </div>
            <WorkoutHelp />
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                      currentStep === step.id
                        ? 'bg-primary text-primary-foreground'
                        : currentStepIndex > idx
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step.number}
                  </div>
                  <div>
                    <div
                      className={`text-sm ${
                        currentStep === step.id
                          ? ''
                          : currentStepIndex > idx
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </div>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Usage Limit Banner for Free Users */}
        {user.subscription === 'free' && user.workoutsThisWeek > 0 && (
          <div className="mb-6">
            <UsageLimitBanner user={user} onUpgrade={handleOpenUpgrade} />
          </div>
        )}

        {canGoBack && (
          <Button
            variant="ghost"
            onClick={goBack}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        {currentStep === 'sources' && (
          <AddSources 
            onGenerate={handleGenerateStructure} 
            onLoadTemplate={handleLoadTemplate}
            loading={loading} 
          />
        )}

        {currentStep === 'structure' && workout && (
          <StructureWorkout
            workout={workout}
            onWorkoutChange={setWorkout}
            onAutoMap={handleAutoMap}
            onValidate={handleValidate}
            loading={loading}
            selectedDevice={selectedDevice}
            onDeviceChange={setSelectedDevice}
            userSelectedDevices={user.selectedDevices}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {currentStep === 'validate' && validation && (
          <ValidateMap
            validation={validation}
            onReValidate={handleReValidate}
            onProcess={handleProcess}
            loading={loading}
            selectedDevice={selectedDevice}
          />
        )}

        {currentStep === 'export' && exports && (
          <PublishExport
            exports={exports}
            validation={validation || undefined}
            sources={sources.map(s => `${s.type}:${s.content}`)}
            onStartNew={handleStartNew}
            selectedDevice={selectedDevice}
          />
        )}
      </div>

      {/* Footer Stats */}
      {workout && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  {workout.title}
                </Badge>
                <span className="text-muted-foreground">
                  {workout.blocks.length} block(s)
                </span>
                <span className="text-muted-foreground">
                  {workout.blocks.reduce((sum, block) => 
                    sum + block.supersets.reduce((s, ss) => s + ss.exercises.length, 0), 0
                  )} exercise(s)
                </span>
              </div>
              {validation && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-green-600">
                    ✓ {validation.validated_exercises.length} validated
                  </span>
                  <span className="text-orange-600">
                    ⚠ {validation.needs_review.length} review
                  </span>
                  <span className="text-red-600">
                    ✗ {validation.unmapped_exercises.length} unmapped
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
