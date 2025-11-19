import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { HelpCircle, Zap, Target, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';

export function WorkoutHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="w-4 h-4 mr-2" />
          Help & Tips
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>AmakaFlow Guide</DialogTitle>
          <DialogDescription>
            Learn how to create, validate, and export workouts efficiently
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[65vh] pr-4">
          <Tabs defaultValue="workflow" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="tips">Quick Tips</TabsTrigger>
              <TabsTrigger value="formats">Export Formats</TabsTrigger>
            </TabsList>

            <TabsContent value="workflow" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                      1
                    </div>
                    Add Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Start by adding workout sources from multiple platforms:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Instagram</strong>: Paste post URLs with workout descriptions</li>
                    <li><strong>YouTube</strong>: Add video links with workout content</li>
                    <li><strong>Images</strong>: Link to workout images with exercise lists</li>
                    <li><strong>AI Text</strong>: Describe your workout in natural language</li>
                  </ul>
                  <Badge variant="outline" className="mt-2">Or load a template/history item</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                      2
                    </div>
                    Structure Workout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Edit and organize your workout structure:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Drag & Drop</strong>: Reorder exercises within supersets</li>
                    <li><strong>Edit</strong>: Modify exercise names, reps, distance, duration, weight</li>
                    <li><strong>Add/Remove</strong>: Insert new exercises or delete unwanted ones</li>
                  </ul>
                  <div className="flex gap-2 mt-2">
                    <Badge>Auto-Map: Quick export</Badge>
                    <Badge variant="outline">Validate: Review first</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                      3
                    </div>
                    Validate & Map
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Review exercise mappings by confidence level:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><Badge className="bg-green-500">🟢 ≥90%</Badge> Validated - Ready to go</li>
                    <li><Badge className="bg-orange-500">🟠 70-89%</Badge> Needs Review - Check suggestions</li>
                    <li><Badge variant="destructive">🔴 &lt;70%</Badge> Unmapped - Must fix</li>
                  </ul>
                  <p className="mt-2">Use AI suggestions or create custom mappings for unmapped exercises.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                      4
                    </div>
                    Publish & Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Download or sync your workout to devices:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Garmin (YAML)</strong>: For Garmin watches (Fenix, Forerunner)</li>
                    <li><strong>Apple (PLIST)</strong>: For Apple Watch and Fitness app</li>
                    <li><strong>Zwift (ZWO)</strong>: For Zwift cycling/running workouts</li>
                  </ul>
                  <p className="mt-2">Copy, download, or send directly to your device.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tips" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Pro Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-primary" />
                      <div>
                        <strong>≤3 clicks to export:</strong> Use Auto-Map from Step 2 to skip validation and export immediately
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-primary" />
                      <div>
                        <strong>Combine sources:</strong> Mix Instagram posts, YouTube videos, and AI text in one workout
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-primary" />
                      <div>
                        <strong>Templates save time:</strong> Use pre-built templates for common workout types (Hyrox, 5x5, HIIT)
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-primary" />
                      <div>
                        <strong>History tracking:</strong> Recently created workouts are saved in history for quick access
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-primary" />
                      <div>
                        <strong>Drag to reorder:</strong> Click and drag the grip icon to reorder exercises
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-primary" />
                      <div>
                        <strong>Quick suggestions:</strong> In validation, click the AI suggestion cards for instant mapping
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    Success Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl mb-1">≤3</div>
                      <div className="text-xs text-muted-foreground">Clicks to export</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl mb-1">≥90%</div>
                      <div className="text-xs text-muted-foreground">Auto-map success</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl mb-1">≤10%</div>
                      <div className="text-xs text-muted-foreground">Manual review</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl mb-1">&lt;10s</div>
                      <div className="text-xs text-muted-foreground">Sync time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="formats" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Garmin (YAML)</CardTitle>
                  <CardDescription>For Garmin Connect compatible devices</CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>Compatible Devices:</strong></p>
                  <ul className="list-disc pl-5">
                    <li>Fenix series (6, 7, 8)</li>
                    <li>Forerunner series (245, 255, 265, 955, 965)</li>
                    <li>Epix series</li>
                  </ul>
                  <p className="pt-2"><strong>How to use:</strong> Upload YAML file to Garmin Connect or sync directly</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Apple (PLIST)</CardTitle>
                  <CardDescription>For Apple Watch and Fitness app</CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>Compatible Devices:</strong></p>
                  <ul className="list-disc pl-5">
                    <li>Apple Watch Series 4 and later</li>
                    <li>Apple Watch SE, Ultra</li>
                    <li>iPhone with Fitness app</li>
                  </ul>
                  <p className="pt-2"><strong>How to use:</strong> Import PLIST file through Apple Fitness or sync via iCloud</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Zwift (ZWO)</CardTitle>
                  <CardDescription>For Zwift indoor training platform</CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>Compatible Activities:</strong></p>
                  <ul className="list-disc pl-5">
                    <li>Indoor cycling workouts</li>
                    <li>Running workouts (treadmill)</li>
                    <li>Structured training plans</li>
                  </ul>
                  <p className="pt-2"><strong>How to use:</strong> Place ZWO file in Zwift Workouts folder or upload through Zwift Companion app</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}