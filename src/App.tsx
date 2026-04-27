/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bird, Volume2, Sparkles, Loader2, Play, CircleAlert, Bug, Terminal, Copy, Check, X, Video, ChevronRight, Share2 } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import VideoPipeline from './components/VideoPipeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Initialize Gemini API
const getApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'undefined') {
    console.error("GEMINI_API_KEY is missing from environment variables.");
    return null;
  }
  return key;
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

interface BirdData {
  name: string;
  description: string;
  genus: string;
  expression: string;
  habitat: string;
  vocalSignature: string;
  imageUrl?: string;
  audioUrl?: string;
}

interface TraceEvent {
  timestamp: number;
  step: string;
  status: 'success' | 'error' | 'info';
  details?: any;
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("discovery");
  const [error, setError] = useState<string | null>(null);
  const [traceLogs, setTraceLogs] = useState<TraceEvent[]>([]);
  const [showDebugger, setShowDebugger] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bird, setBird] = useState<BirdData>({
    name: "Wozzlebibble Whifflebop",
    description: "A bird so committed to rest that it has transformed idleness into an art form. Noted for its impressive snack consumption and the baffling confidence with which it irritates its partner, this species represents the pinnacle of professional leisure.",
    genus: "Absurdicus Phoneticus",
    expression: "Smug / Pretentious",
    habitat: "Unemployment / Sofa",
    vocalSignature: "Gemini / Zephyr"
  });

  const addTrace = useCallback((step: string, status: 'success' | 'error' | 'info', details?: any) => {
    const event: TraceEvent = { timestamp: Date.now(), step, status, details };
    setTraceLogs(prev => [...prev, event].slice(-50)); // Keep last 50
    console.log(`[TRACE] ${step}:`, status, details || '');
  }, []);

  const generateBirdify = async () => {
    if (!ai) {
      setError("Gemini API key is missing. Please set GEMINI_API_KEY in your settings.");
      return;
    }
    setLoading(true);
    setError(null);
    addTrace("Pipeline Started", "info");
    
    try {
      // 1. Generate Name and Description (Text)
      addTrace("Step 1: Text Generation (Gemini 3 Flash)", "info");
      const textResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are an absurdist comedian creating ridiculous bird species names and field guides. 
          Your style is: David Attenborough meets Monty Python (70% authoritative documentary gravity, 30% absolute nonsense).

          BIRD NAMING RULES:
          - Use pure phonetic absurdism. Names are funny because of how they SOUND.
          - No descriptive names (e.g., NO "The Lazy Owl").
          - No puns (e.g., NO "Owl-ways Tired").
          - Correct Tone Examples: "Wozzlebibble Whifflebop", "Dibblybibbleddobblebodger", "Flibblebodge Squabbering".
          
          FIELD GUIDE DESCRIPTION RULES:
          - 2-3 sentences maximum.
          - Serious documentary delivery of completely absurd facts.
          - Structure: 
            1. Introduce bird with one key absurd trait.
            2. Specific behavior referencing the human personality.
            3. Final punchline or observation.
          - Example: "The Wozzlebibble Whifflebop: A bird so committed to rest that it has transformed idleness into an art form. Noted for its impressive snack consumption and the baffling confidence with which it irritates its partner, this species represents the pinnacle of professional leisure. Behaviorists remain baffled by its refusal to acknowledge its own unemployment."
          
          Return the data in a strict JSON format matching the schema.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "The absurdist phonetic name" },
              description: { type: "string", description: "The Attenborough-style absurd field guide entry" },
              genus: { type: "string", description: "A fake latin-ish genus name (e.g. Absurdicus Phoneticus)" },
              habitat: { type: "string", description: "The bird's ridiculous nesting location" },
              expression: { type: "string", description: "The personality/expression displayed" }
            },
            required: ["name", "description", "genus", "habitat", "expression"]
          }
        },
        contents: "Generate a bird caricature for a random subject. Pick an expression from: [Smug/Pretentious, Bewildered/Confused, Mischievous/Cunning, Exhausted/Defeated, Energetic/Chaotic]."
      });

      let generatedText;
      try {
        const textValue = textResponse.text;
        if (!textValue) throw new Error("Empty text response from Gemini");
        generatedText = JSON.parse(textValue);
      } catch (parseErr: any) {
        addTrace("Step 1 Parse Failure", "error", { text: textResponse.text, error: parseErr.message });
        throw new Error(`Failed to parse bird specimen data: ${parseErr.message}`);
      }
      
      addTrace("Step 1 Complete", "success", generatedText);

      // 2. Generate Caricature (Image)
      addTrace("Step 2: Image Generation (Gemini 2.5 Flash Image)", "info", { name: generatedText.name });
      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `Professional wildlife illustration of a caricature bird: ${generatedText.name}. 
              Features: ${generatedText.expression} expression, highly realistic feathers, human-like eyes with tiny spectacles, 
              dignified pose, brown/white/grey color palette. No human bodies, just bird anatomy with human features.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        },
      });

      let imageUrl = '';
      const candidate = imageResponse.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }
      
      if (!imageUrl) {
        addTrace("Step 2 Failure", "error", { response: imageResponse });
        throw new Error("The specimen illustration was lost in the field (No image data returned).");
      }
      addTrace("Step 2 Complete", "success", { urlLength: imageUrl.length });

      // 3. Generate Voiceover (TTS)
      addTrace("Step 3: TTS Generation (Gemini 3.1 TTS)", "info");
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Announce formally: ${generatedText.name}. ${generatedText.description}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Zephyr'
              }
            },
          },
        },
      });

      const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      let audioUrl = '';
      if (base64Audio) {
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
        audioUrl = URL.createObjectURL(blob);
      }
      
      if (!audioUrl) addTrace("Step 3 Warning: Audio URL not generated", "info");
      else addTrace("Step 3 Complete", "success");

      setBird({
        ...generatedText,
        imageUrl,
        audioUrl,
        vocalSignature: "Gemini / Zephyr"
      });
      
      addTrace("Pipeline Finished", "success");

    } catch (err: any) {
      addTrace("Pipeline Fatal Error", "error", { 
        message: err.message, 
        stack: err.stack,
        birdState: bird 
      });
      setError(`The robots are currently confused: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyLogs = () => {
    const logText = JSON.stringify(traceLogs, null, 2);
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-ink font-sans selection:bg-accent/20 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 flex flex-col gap-8">
        {/* Header */}
        <header className="flex justify-between items-end border-b-2 border-ink pb-4 mb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <div className="font-serif font-black text-4xl lg:text-5xl tracking-tighter uppercase leading-none">
                Birdify
              </div>
              <Badge variant="outline" className="border-ink text-ink font-mono text-[10px] rounded-none">CHIEF_ASSISTANT_V1</Badge>
            </div>
            <div className="text-[10px] uppercase tracking-widest font-bold mt-2 opacity-60">
              Objective #1: Social Content Strategy & Automation
            </div>
          </div>
          <div className="hidden md:block text-right text-[10px] uppercase tracking-[2px] leading-tight font-black opacity-80">
            Project Owner: Robert<br />
            Deadline: Wednesday EOD
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabsList className="bg-white border-2 border-ink overflow-hidden h-auto p-1 rounded-none">
              <TabsTrigger 
                value="discovery" 
                className="rounded-none px-6 py-2 data-[state=active]:bg-ink data-[state=active]:text-white text-xs uppercase tracking-widest font-black transition-all"
              >
                Discovery Lab
              </TabsTrigger>
              <TabsTrigger 
                value="pipeline" 
                className="rounded-none px-6 py-2 data-[state=active]:bg-ink data-[state=active]:text-white text-xs uppercase tracking-widest font-black transition-all flex items-center gap-2"
              >
                <Video className="w-3 h-3" />
                Production Pipe
              </TabsTrigger>
            </TabsList>

            {activeTab === 'discovery' && (
              <button 
                onClick={generateBirdify}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-accent text-white px-8 py-3 rounded-none font-black text-xs uppercase tracking-widest hover:bg-ink transition-all disabled:opacity-50 group shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                )}
                {loading ? "Discovering Specimen..." : "Generate Fragment #001"}
              </button>
            )}
          </div>

          <TabsContent value="discovery" className="space-y-10 animate-in fade-in duration-500">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 p-4 flex items-center gap-3 text-red-700 text-xs font-mono">
                <CircleAlert className="w-4 h-4" />
                <div className="flex-1">
                  <p className="font-bold uppercase tracking-tight">System Interrupt</p>
                  <p className="opacity-80 break-all">{error}</p>
                </div>
              </div>
            )}

            <main className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-16 items-start">
              {/* Specimen Viewer */}
              <section className="relative bg-white border-2 border-ink p-6 shadow-[12px_12px_0px_rgba(74,93,78,0.1)] flex flex-col group overflow-hidden">
                <div className="relative aspect-square bg-[#F0EDE9] flex items-center justify-center overflow-hidden mb-6 border border-border/50">
                  <div className="absolute top-5 right-5 bg-ink text-bg px-3 py-1 text-[10px] font-bold uppercase tracking-widest z-10">
                    RAW_ASSET
                  </div>
                  
                  {bird.imageUrl ? (
                    <img 
                      src={bird.imageUrl} 
                      alt={bird.name}
                      className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center gap-4 opacity-20">
                      <Bird className="w-40 h-40" strokeWidth={1} />
                      <p className="text-[10px] uppercase tracking-[4px] font-black italic">Buffer Empty</p>
                    </div>
                  )}
                </div>
                
                <div className="border-t-2 border-ink/10 pt-4 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 font-black mb-1">Methodology</div>
                    <div className="text-[11px] text-gray-600 italic font-serif">
                      G2.5_Flash_Image_Synthesis
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowDebugger(!showDebugger)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Bug className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              </section>

              {/* Content Pane */}
              <section className="flex flex-col">
                <div className="font-serif italic text-base lg:text-xl text-accent mb-4 flex items-center gap-4">
                  Genus: {bird.genus}
                  <div className="h-px bg-accent/20 flex-1" />
                </div>
                <h1 className="font-serif text-5xl md:text-6xl lg:text-8xl font-black leading-[0.85] mb-10 tracking-tighter break-words text-ink">
                  {bird.name}
                </h1>
                
                <p className="font-serif text-xl lg:text-3xl leading-snug mb-12 text-ink/80 border-l-8 border-accent pl-8 py-4 bg-accent/5">
                  {bird.description}
                </p>

                <div className="grid grid-cols-2 gap-x-8 gap-y-10 py-10 border-y-2 border-ink/10">
                  <TraitItem label="Expression" value={bird.expression} />
                  <TraitItem label="Habitat" value={bird.habitat} />
                  <TraitItem label="Voice Card" value={bird.vocalSignature} />
                  <TraitItem label="Class" value="Absurdist Avian" />
                </div>

                <div className="mt-12 flex flex-wrap gap-4">
                  {bird.audioUrl && (
                    <button 
                      onClick={() => {
                        const audio = new Audio(bird.audioUrl);
                        audio.play();
                      }}
                      className="flex items-center gap-4 bg-white border-2 border-ink p-4 pr-10 hover:bg-gray-50 transition-all active:translate-y-[2px]"
                    >
                      <div className="bg-ink p-3 rounded-full flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-current" />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] uppercase tracking-[3px] font-black opacity-30 mb-0.5">Audio Sample</div>
                        <div className="text-xs font-black font-serif italic text-accent flex items-center gap-2">
                          Hear Specimen <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </button>
                  )}

                  <button 
                    onClick={() => setActiveTab('pipeline')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-white border-2 border-ink px-8 py-4 font-black text-xs uppercase tracking-widest hover:border-accent transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Send to Pipeline
                  </button>
                </div>
              </section>
            </main>
          </TabsContent>

          <TabsContent value="pipeline" className="animate-in slide-in-from-right-5 duration-500">
            <VideoPipeline 
              imageUrl={bird.imageUrl} 
              audioUrl={bird.audioUrl} 
              birdName={bird.name} 
            />
          </TabsContent>
        </Tabs>

        {/* Footer KPI Grid */}
        <footer className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-t-4 border-ink">
          <KPIItem label="Pipeline State" value="Unblocked" />
          <KPIItem label="Content Buffer" value="7/14" />
          <KPIItem label="Tech Edge" value="ffmpeg" />
          <KPIItem label="Income Target" value="Active" />
        </footer>
      </div>

      {/* Hidden Debugger Console */}
      {showDebugger && (
        <div className="fixed bottom-4 right-4 w-[400px] h-[500px] bg-ink text-white shadow-2xl z-50 flex flex-col font-mono text-[10px] border border-white/20 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <Terminal className="w-3 h-3" />
              <span>TRACE REPORT CONSOLE</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={copyLogs} className="p-1.5 hover:bg-white/10 rounded" title="Copy to Clipboard">
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <button onClick={() => setShowDebugger(false)} className="p-1.5 hover:bg-red-500 rounded">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {traceLogs.length === 0 && <div className="opacity-30 italic">No events recorded yet...</div>}
            {traceLogs.map((log, i) => (
              <div key={i} className={`p-2 border-l-2 ${
                log.status === 'error' ? 'bg-red-950/30 border-red-500' : 
                log.status === 'success' ? 'bg-green-950/30 border-green-500' : 
                'bg-blue-950/30 border-blue-500'
              }`}>
                <div className="flex justify-between opacity-50 text-[8px] mb-1">
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span>{log.status.toUpperCase()}</span>
                </div>
                <div className="font-bold mb-1">{log.step}</div>
                {log.details && (
                  <pre className="mt-2 bg-black/40 p-2 rounded whitespace-pre-wrap break-all opacity-80 text-[9px]">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-white/10 text-[8px] opacity-40 text-center uppercase tracking-widest">
            Phase 1 Unblocked (Tuesday Render)
          </div>
        </div>
      )}
    </div>
  );
}

function TraitItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[4px] text-gray-400 font-black">{label}</span>
      <span className="text-base font-black tracking-tighter text-ink uppercase">{value}</span>
    </div>
  );
}

function KPIItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-serif text-3xl font-black tracking-tighter truncate text-ink">{value}</span>
      <span className="text-[10px] uppercase tracking-[2px] font-bold mt-1 opacity-40 text-ink">{label}</span>
    </div>
  );
}
