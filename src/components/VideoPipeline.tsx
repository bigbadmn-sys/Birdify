import React, { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Video, Download, Loader2, Play, FileVideo, AlertCircle, Terminal, HelpCircle, HardDrive } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface VideoPipelineProps {
  imageUrl?: string;
  audioUrl?: string;
  birdName: string;
}

export default function VideoPipeline({ imageUrl, audioUrl, birdName }: VideoPipelineProps) {
  const [loaded, setLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const ffmpegRef = useRef(new FFmpeg());

  const loadFFmpeg = async () => {
    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      const ffmpeg = ffmpegRef.current;
      ffmpeg.on('log', ({ message }) => {
        setLog(prev => [...prev, message].slice(-5));
      });
      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setLoaded(true);
    } catch (err: any) {
      console.error("FFmpeg load error:", err);
      setError("Failed to load FFmpeg. Browsers often block this in previews due to security headers. Use the Shell Script delivery for Phase 1 production.");
    }
  };

  const generateVideo = async () => {
    if (!imageUrl || !audioUrl) return;
    setProcessing(true);
    setProgress(0);
    setError(null);
    setVideoUrl(null);

    try {
      const ffmpeg = ffmpegRef.current;
      
      // Clean filenames
      const imageFile = 'input_image.png';
      const audioFile = 'input_audio.wav';
      const outputFile = 'output.mp4';

      // Load files into memory
      await ffmpeg.writeFile(imageFile, await fetchFile(imageUrl));
      await ffmpeg.writeFile(audioFile, await fetchFile(audioUrl));

      // FFmpeg command optimized for Instagram
      // Square 1080x1080, H.264, AAC
      await ffmpeg.exec([
        '-loop', '1',
        '-i', imageFile,
        '-i', audioFile,
        '-c:v', 'libx264',
        '-tune', 'stillimage',
        '-preset', 'ultrafast', // Faster for browser preview
        '-c:a', 'aac',
        '-b:a', '128k',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080',
        '-shortest',
        outputFile
      ]);

      const data = await ffmpeg.readFile(outputFile);
      const url = URL.createObjectURL(new Blob([(data as any).buffer], { type: 'video/mp4' }));
      setVideoUrl(url);
    } catch (err: any) {
      console.error("FFmpeg process error:", err);
      setError(`Production Blocker encountered: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full bg-[#FAFAFA] border-2 border-ink/10 rounded-none overflow-hidden shadow-none">
      <CardHeader className="bg-ink text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Video className="w-4 h-4 text-accent" />
              <CardTitle className="text-xl font-serif tracking-tight">Instagram Pipeline Lab</CardTitle>
            </div>
            <CardDescription className="text-white/60 text-xs font-mono uppercase tracking-widest">
              Objective #1: Social Content Delivery Hub
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-white/10 text-white border-white/20 font-mono text-[10px]">
            {loaded ? "ENGINE ONLINE" : "READY TO BOOT"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 rounded-none bg-gray-100 p-1">
            <TabsTrigger value="generator" className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs uppercase tracking-widest font-bold">
              Production Generator
            </TabsTrigger>
            <TabsTrigger value="docs" className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs uppercase tracking-widest font-bold">
              Technical Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-6">
            {!loaded ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200">
                <HardDrive className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="font-serif text-lg mb-2">FFmpeg Production Engine</h3>
                <p className="text-xs text-gray-500 max-w-xs mb-6">
                  Initialize the video processing system in your browser. This requires high-performance memory allocation.
                </p>
                <Button onClick={loadFFmpeg} className="bg-ink hover:bg-accent text-white uppercase tracking-tighter text-xs font-bold rounded-none px-8">
                  Boot Pipeline Engine
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inputs Preview */}
                <div className="space-y-4">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Inputs Verification</div>
                  <div className="flex items-center gap-3 p-3 bg-white border border-gray-100">
                    <div className="w-12 h-12 bg-gray-100 overflow-hidden">
                      {imageUrl && <img src={imageUrl} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-[10px] font-bold">IMAGE_ASSET_SQUARE</div>
                      <div className="text-[9px] opacity-60 truncate">1080x1080 Birdify Illustration</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white border border-gray-100">
                    <div className="w-12 h-12 bg-gray-100 flex items-center justify-center">
                      <FileVideo className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-[10px] font-bold">AUDIO_VOICEOVER_AAC</div>
                      <div className="text-[9px] opacity-60 truncate">Field Guide Narration (Zephyr)</div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={generateVideo} 
                    disabled={processing || !imageUrl || !audioUrl}
                    className="w-full bg-accent hover:bg-ink text-white uppercase tracking-widest text-xs font-bold rounded-none py-6"
                  >
                    {processing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Video className="w-4 h-4 mr-2" />
                    )}
                    {processing ? "Simulating Pipeline..." : "Generate Instagram Render"}
                  </Button>

                  {processing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span>RENDERING PHASE</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1 bg-gray-200" />
                      <div className="text-[10px] font-mono opacity-50 bg-gray-100 p-2 overflow-hidden h-6">
                        {log[log.length - 1]}
                      </div>
                    </div>
                  )}
                </div>

                {/* Output Preview */}
                <div className="flex flex-col border-2 border-ink p-4 min-h-[300px] bg-white items-center justify-center relative">
                  <div className="absolute top-2 left-2 text-[8px] font-mono opacity-20 uppercase">Output Preview Area</div>
                  {videoUrl ? (
                    <div className="w-full space-y-4">
                      <video src={videoUrl} controls className="w-full aspect-square bg-black shadow-xl" />
                      <div className="flex gap-2">
                        <Button asChild variant="outline" className="flex-1 rounded-none border-ink/20 text-xs font-mono">
                          <a href={videoUrl} download={`${birdName.replace(/\s+/g, '_')}_social.mp4`}>
                            <Download className="w-3 h-3 mr-2" /> DOWNLOAD MP4
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <Play className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-[10px] uppercase font-bold text-gray-400">Waiting for Render Initiation</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="rounded-none border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs uppercase tracking-widest font-bold">Pipeline Error</AlertTitle>
                <AlertDescription className="text-[11px]">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="docs" className="space-y-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-xs font-bold uppercase tracking-widest">macOS / Linux Setup</AccordionTrigger>
                <AccordionContent>
                  <div className="bg-ink text-white p-4 font-mono text-[11px] space-y-2">
                    <p className="text-accent underline"># Step 1: Install ffmpeg</p>
                    <p>brew install ffmpeg <span className="opacity-40"># macOS</span></p>
                    <p>sudo apt install ffmpeg <span className="opacity-40"># Linux</span></p>
                    <p className="text-accent underline mt-4"># Step 2: Use Birdify script</p>
                    <p>chmod +x /scripts/birdify-video.sh</p>
                    <p>./birdify-video.sh illustration.png audio.mp3 post.mp4</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-xs font-bold uppercase tracking-widest">Instagram Optimization Specs</AccordionTrigger>
                <AccordionContent className="text-xs space-y-2 text-gray-600">
                  <p><strong>Aspect Ratio:</strong> 1:1 (Square)</p>
                  <p><strong>Resolution:</strong> 1080 x 1080 px</p>
                  <p><strong>Container:</strong> MP4 (H.264)</p>
                  <p><strong>Audio:</strong> AAC (44.1 kHz)</p>
                  <p><strong>Frame Rate:</strong> 30 FPS</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-xs font-bold uppercase tracking-widest">The Command Explained</AccordionTrigger>
                <AccordionContent>
                  <div className="bg-gray-100 p-4 font-mono text-[9px] text-gray-600 border border-gray-200">
                    ffmpeg -loop 1 -i IMAGE -i AUDIO <br/>
                    -c:v libx264 -tune stillimage <br/>
                    -c:a aac -b:a 128k <br/>
                    -pix_fmt yuv420p <br/>
                    -vf "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080" <br/>
                    -shortest output.mp4
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="bg-gray-50 border-t border-gray-100 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Terminal className="w-3 h-3 opacity-30" />
          <span className="text-[9px] font-mono opacity-40 uppercase tracking-widest">System Status: Stable</span>
        </div>
        <div className="flex gap-3">
          <HelpCircle className="w-3 h-3 text-gray-300 cursor-help hover:text-accent" />
        </div>
      </CardFooter>
    </Card>
  );
}
