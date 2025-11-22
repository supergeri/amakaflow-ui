import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Youtube, Image, Sparkles, Plus, Trash2, Loader2, Upload, X, Eye, Sparkles as VisionIcon, XCircle } from 'lucide-react';
import { Source, SourceType, WorkoutStructure } from '../types/workout';
import { Textarea } from './ui/textarea';
import { WorkoutTemplates } from './WorkoutTemplates';
import { getImageProcessingMethod } from '../lib/preferences';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Info } from 'lucide-react';

interface AddSourcesProps {
  onGenerate: (sources: Source[]) => void;
  onLoadTemplate: (workout: WorkoutStructure) => void;
  loading: boolean;
  progress?: string | null;
  onCancel?: () => void;
}

export function AddSources({ onGenerate, onLoadTemplate, loading, progress, onCancel }: AddSourcesProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [activeTab, setActiveTab] = useState<SourceType>('image');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageMethod, setImageMethod] = useState<'ocr' | 'vision'>(getImageProcessingMethod());

  // Listen for preference changes
  useEffect(() => {
    const checkMethod = () => {
      setImageMethod(getImageProcessingMethod());
    };
    // Check on mount and when tab changes to image
    checkMethod();
    const interval = setInterval(checkMethod, 1000); // Check every second for preference changes
    return () => clearInterval(interval);
  }, [activeTab]);

  const addSource = () => {
    if (!currentInput.trim() && !uploadedImage) return;
    
    // For images: prefer URL if provided, otherwise handle file upload
    let content: string;
    if (activeTab === 'image') {
      if (currentInput.trim()) {
        // Use URL for image
        content = currentInput.trim();
        setCurrentInput('');
      } else if (uploadedImage) {
        // For file uploads, create a blob URL to store
        content = URL.createObjectURL(uploadedImage);
        setUploadedImage(null);
        setImagePreview(null);
      } else {
        return;
      }
    } else {
      // For other types, use currentInput or filename
      content = uploadedImage ? uploadedImage.name : currentInput;
      setCurrentInput('');
      setUploadedImage(null);
      setImagePreview(null);
    }
    
    const newSource: Source = {
      id: Date.now().toString(),
      type: activeTab,
      content,
      timestamp: new Date()
    };
    
    setSources([...sources, newSource]);
  };

  const handleTabChange = (newTab: SourceType) => {
    setActiveTab(newTab);
    setCurrentInput('');
    setUploadedImage(null);
    setImagePreview(null);
  };

  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const removeSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id));
  };

  const handleGenerate = () => {
    if (sources.length > 0) {
      onGenerate(sources);
    }
  };

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'ai-text': return <Sparkles className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="mb-2">Add Workout Sources</h2>
          <p className="text-muted-foreground">
            Transform workout content from YouTube videos, images, or AI text into structured blocks that sync with your watches
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Input Sources</CardTitle>
            <CardDescription>
              Add links or content from various platforms to build your workout
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="youtube">
                  <Youtube className="w-4 h-4 mr-2" />
                  YouTube
                </TabsTrigger>
                <TabsTrigger value="image">
                  <Image className="w-4 h-4 mr-2" />
                  Image
                </TabsTrigger>
                <TabsTrigger value="ai-text">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="youtube" className="space-y-4">
                {/* Show current processing method */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-600" />
                    <div>
                      <p className="text-sm font-medium">
                        Processing: Transcript + AI Exercise Extraction
                      </p>
                      <p className="text-xs text-muted-foreground">
                        OpenAI GPT-4o-mini or Claude 3.5 Sonnet
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-blue-600">AI-Powered</Badge>
                </div>

                <div className="space-y-2">
                  <Label>YouTube Video URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addSource()}
                    />
                    <Button onClick={addSource}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      <strong>Step 1:</strong> Transcripts extracted using <a href="https://www.youtube-transcript.io/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">youtube-transcript.io</a>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Step 2:</strong> Exercises extracted from transcript using AI (OpenAI GPT-4o-mini or Anthropic Claude)
                    </p>
                  </div>

                  <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                      <strong>Free Tier:</strong> 25 transcripts per month. See <span className="font-medium">Settings → General → YouTube Ingestion</span> for more info.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <TabsContent value="image" className="space-y-4">
                {/* Show current processing method */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    {imageMethod === 'vision' ? (
                      <VisionIcon className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">
                      Processing Method: {imageMethod === 'vision' ? 'AI Vision Model' : 'OCR'}
                    </span>
                  </div>
                  <Badge variant={imageMethod === 'vision' ? 'default' : 'secondary'} className={imageMethod === 'vision' ? 'bg-blue-600 hover:bg-blue-700' : ''}>
                    {imageMethod === 'vision' ? 'Premium' : 'Free'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Change processing method in <span className="font-medium">Settings → General</span>
                </p>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addSource()}
                    />
                    <Button onClick={addSource}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Or upload from file below
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Upload Image File</Label>
                  <div
                    className={`relative flex flex-col items-center justify-center w-full min-h-[200px] border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                      isDragging 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-muted/50 hover:bg-muted'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    {imagePreview ? (
                      <div className="relative w-full p-4">
                        <img
                          src={imagePreview}
                          alt="Uploaded workout"
                          className="max-h-[300px] mx-auto rounded-lg object-contain"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearImage();
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                        <div className="mt-3 text-center text-sm text-muted-foreground">
                          {uploadedImage?.name}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center p-8">
                        <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                        <div className="text-center">
                          <p className="mb-1">
                            Drag & drop an image here
                          </p>
                          <p className="text-sm text-muted-foreground">
                            or click to browse files
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Supports: JPG, PNG, GIF, WebP
                          </p>
                        </div>
                      </div>
                    )}
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                      }}
                    />
                  </div>
                  {uploadedImage && (
                    <Button onClick={addSource} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Image
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ai-text" className="space-y-4">
                <div className="space-y-2">
                  <Label>Workout Description</Label>
                  <Textarea
                    placeholder="Describe your workout: 5x 400m sprints, 3 sets of 10 push-ups..."
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={addSource} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Description
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {sources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Added Sources ({sources.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50"
                  >
                    <div className="mt-0.5">
                      {getSourceIcon(source.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-muted-foreground capitalize mb-1">
                        {source.type.replace('-', ' ')}
                      </div>
                      <div className="text-sm break-all">
                        {source.content}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSource(source.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={sources.length === 0 || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {progress || 'Generating Structure...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Structure
                </>
              )}
            </Button>
            {loading && onCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={onCancel}
                className="w-full"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
            {loading && progress && (
              <p className="text-xs text-muted-foreground text-center">{progress}</p>
            )}
          </div>
        </div>
      </div>

      {/* Right sidebar - Templates & History */}
      <div className="lg:col-span-1">
        <WorkoutTemplates
          onSelectTemplate={onLoadTemplate}
          onSelectHistory={onLoadTemplate}
        />
      </div>
    </div>
  );
}