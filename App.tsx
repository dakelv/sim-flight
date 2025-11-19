import React, { useState, useEffect, useRef } from 'react';
import { startScenario, processAction, generateScenarioImage } from './services/geminiService';
import { GameStatus, SimulationState, DialogueLine, Speaker } from './types';
import { Button } from './components/Button';
import WeatherDisplay from './components/WeatherDisplay';

// Initial weather to show before the AI loads the real dynamic weather
const INITIAL_WEATHER = {
  metar: "CYQT 122100Z 34015G25KT 2SM -FZDZ BR OVC008 M02/M04 A2985",
  taf: "CYTZ 122038Z 1221/1318 24010KT P6SM OVC020 TEMPO 1221/1300 4SM -SN"
};

export default function App() {
  const [gameState, setGameState] = useState<GameStatus>(GameStatus.START);
  const [dialogue, setDialogue] = useState<DialogueLine[]>([]);
  const [visualUrl, setVisualUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [feedback, setFeedback] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // DIRECT ACCESS: Trust the build replacement
  const hasApiKey = !!import.meta.env.VITE_API_KEY;

  // Auto-scroll dialogue
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [dialogue]);

  const handleStart = async () => {
    setGameState(GameStatus.LOADING);
    try {
      const state = await startScenario();
      updateState(state);
      
      if (state.visualDescription) {
        generateImage(state.visualDescription);
      }
    } catch (e) {
      console.error(e);
      setGameState(GameStatus.START); 
    }
  };

  const handleAction = async (action: string) => {
    if (loading) return;
    setLoading(true);

    const userLine: DialogueLine = {
      speaker: Speaker.PILOT,
      text: action,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    
    // Fix: Explicitly type 'prev' to avoid implicit any error
    setDialogue((prev: DialogueLine[]) => [...prev, userLine]);

    try {
      const state = await processAction(action, dialogue);
      updateState(state);
      
      if (state.visualDescription) {
        generateImage(state.visualDescription);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateState = (state: SimulationState) => {
    // Fix: Explicitly type 'prev' to avoid implicit any error
    setDialogue((prev: DialogueLine[]) => [...prev, ...state.dialogue]);
    setGameState(state.status);
    if (state.feedback) setFeedback(state.feedback);
  };

  const generateImage = async (prompt: string) => {
    const url = await generateScenarioImage(prompt);
    if (url && url.length > 100) { // Basic check to ensure valid data uri
        setVisualUrl(url);
    }
  };

  const renderStatusOverlay = () => {
    if (gameState === GameStatus.CRASHED) {
      return (
        <div className="absolute inset-0 bg-red-950/95 z-50 flex flex-col items-center justify-center p-8 text-center animate-pulse">
          <div className="border-4 border-red-600 p-8 bg-black">
            <h1 className="text-6xl font-black text-red-600 mb-4 tracking-tighter">FATAL ERROR</h1>
            <div className="text-2xl text-red-100 font-mono max-w-2xl mb-8">{feedback}</div>
            <Button onClick={() => window.location.reload()} variant="danger" className="w-full">SYSTEM RESET</Button>
          </div>
        </div>
      );
    }
    if (gameState === GameStatus.SUCCESS) {
      return (
        <div className="absolute inset-0 bg-emerald-950/95 z-50 flex flex-col items-center justify-center p-8 text-center">
          <div className="border-4 border-emerald-600 p-8 bg-black">
            <h1 className="text-6xl font-black text-emerald-500 mb-4 tracking-tighter">DECISION VERIFIED</h1>
            <div className="text-2xl text-emerald-100 font-mono max-w-2xl mb-8">{feedback}</div>
            <Button onClick={() => window.location.reload()} variant="primary" className="w-full">NEW SIMULATION</Button>
          </div>
        </div>
      );
    }
    if (gameState === GameStatus.FAILED) {
        return (
          <div className="absolute inset-0 bg-amber-950/95 z-50 flex flex-col items-center justify-center p-8 text-center">
            <div className="border-4 border-amber-600 p-8 bg-black">
              <h1 className="text-5xl font-black text-amber-500 mb-4 tracking-tighter">SIMULATION FAILED</h1>
              <div className="text-xl text-amber-100 font-mono max-w-2xl mb-8">{feedback}</div>
              <Button onClick={() => window.location.reload()} variant="warning" className="w-full">RETRY</Button>
            </div>
          </div>
        );
      }
    return null;
  };

  if (gameState === GameStatus.START) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 relative overflow-hidden">
        <div className="scanline absolute inset-0 z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1474302770737-173ee21bab63?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="text-center z-20 max-w-2xl p-12 border-4 border-slate-800 bg-black/90 backdrop-blur-xl shadow-2xl">
          <h1 className="text-5xl font-black text-slate-100 mb-2 tracking-tighter">GO / NO-GO</h1>
          <h2 className="text-2xl text-red-500 font-mono mb-8 tracking-widest">THE PRESSURE COOKER</h2>
          <p className="text-slate-400 mb-8 text-base leading-relaxed font-mono text-left border-l-2 border-slate-700 pl-4">
            &gt; ROLE: PILOT IN COMMAND (KING AIR 350)<br/>
            &gt; LOCATION: CYQT (THUNDER BAY)<br/>
            &gt; CONDITION: FREEZING DRIZZLE / LATE DEPARTURE<br/>
            &gt; STATUS: VIP ON BOARD / MASTER WARNING FLICKER<br/>
          </p>
          
          {!hasApiKey ? (
             <div className="p-4 border border-red-500 bg-red-900/20 text-red-400 text-xs mb-4 font-mono">
               [SYSTEM ERROR]: VITE_API_KEY MISSING IN .ENV
             </div>
          ) : (
            <Button onClick={handleStart} variant="primary" className="w-full py-6 text-xl tracking-widest">ENTER COCKPIT</Button>
          )}
        </div>
      </div>
    );
  }

  if (gameState === GameStatus.LOADING) {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-black font-mono text-green-500">
            <div className="animate-pulse text-xl">INITIALIZING AVIONICS...</div>
            <div className="mt-4 text-xs text-green-800">LOADING TERRAIN DATABASE</div>
            <div className="text-xs text-green-800">CONNECTING TO ACARS</div>
        </div>
    )
  }

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col overflow-hidden relative font-sans">
      {renderStatusOverlay()}
      
      {/* Header / MCP */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-20 shadow-lg">
        <div className="flex items-center gap-6">
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Flight</span>
                <span className="font-mono font-bold text-slate-200 text-lg">AC-404</span>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Type</span>
                <span className="font-mono text-amber-500 text-lg">BE-350</span>
            </div>
        </div>
        
        {/* Annunciator Panel Simulation */}
        <div className="flex items-center gap-3">
            <div className={`px-4 py-1 text-[10px] font-black tracking-widest rounded border ${loading ? 'bg-blue-900/40 border-blue-500 text-blue-400 animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-700'}`}>
                {loading ? 'PROCESSING' : 'READY'}
            </div>
            <div className="px-4 py-1 bg-red-950/30 border border-red-900 text-red-900 font-black text-[10px] tracking-widest rounded opacity-50">
                FIRE L
            </div>
            <div className="px-4 py-1 bg-red-950/30 border border-red-900 text-red-900 font-black text-[10px] tracking-widest rounded opacity-50">
                FIRE R
            </div>
            <div className="px-4 py-1 bg-amber-950 border border-amber-600 text-amber-500 font-black text-[10px] tracking-widest rounded shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse">
                MASTER WARN
            </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Visual Viewport */}
        <main className="flex-1 relative bg-black flex flex-col">
          <div className="scanline absolute inset-0 z-10 pointer-events-none opacity-20"></div>
          
          <div className="flex-1 relative overflow-hidden bg-slate-900 flex items-center justify-center">
             {visualUrl ? (
                <img 
                    src={visualUrl} 
                    alt="Cockpit View" 
                    className="w-full h-full object-cover opacity-90 transition-opacity duration-1000"
                />
             ) : (
                 <div className="text-slate-700 font-mono text-sm animate-pulse">
                    [NO VISUAL DATA]
                 </div>
             )}
             
             {/* HUD / Overlay Data */}
             <div className="absolute top-4 left-4 z-20 max-w-sm">
                 <WeatherDisplay weather={INITIAL_WEATHER} />
             </div>
          </div>
        </main>

        {/* Side Panel: Comms & Controls */}
        <aside className="w-[400px] bg-slate-925 border-l border-slate-800 flex flex-col shadow-2xl z-30">
          
          {/* Dialogue Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-slate-900" ref={scrollRef}>
            {dialogue.map((line, idx) => (
              <div key={idx} className={`flex flex-col ${line.speaker === Speaker.PILOT ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[10px] text-slate-600 font-mono">{line.timestamp}</span>
                    <span className={`text-xs font-bold uppercase tracking-wide ${
                        line.speaker === Speaker.VIP ? 'text-red-500' : 
                        line.speaker === Speaker.DISPATCHER ? 'text-cyan-500' :
                        line.speaker === Speaker.COPILOT ? 'text-amber-500' :
                        line.speaker === Speaker.PILOT ? 'text-emerald-500' : 'text-slate-400'
                    }`}>{line.speaker}</span>
                </div>
                <div className={`p-3 text-sm max-w-[95%] leading-relaxed border-l-2 ${
                    line.speaker === Speaker.PILOT 
                    ? 'bg-slate-800/50 border-emerald-600 text-slate-200 rounded-r-sm' 
                    : 'bg-black/20 border-slate-700 text-slate-300 rounded-r-sm'
                }`}>
                  {line.text}
                </div>
              </div>
            ))}
            {loading && (
                <div className="flex gap-2 pl-2 items-center">
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-5 bg-slate-950 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-3 mb-4">
                <Button onClick={() => handleAction("Inspect the Wings for Ice")} disabled={loading} className="text-xs">
                   👁️ CHECK WINGS
                </Button>
                <Button onClick={() => handleAction("Investigate Master Warning")} disabled={loading} className="text-xs">
                   ⚠️ CHECK WARNING
                </Button>
                <Button onClick={() => handleAction("Speak to VIP Passenger")} disabled={loading} className="text-xs">
                   🗣️ TALK TO VIP
                </Button>
                <Button onClick={() => handleAction("Call Dispatch/De-icing")} disabled={loading} className="text-xs">
                   ❄️ REQUEST DE-ICE
                </Button>
            </div>
            
            <div className="mb-4 flex gap-2 bg-slate-900 p-1 border border-slate-700 rounded">
                <input 
                    type="text" 
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !loading && customInput && handleAction(customInput)}
                    placeholder="Radio check or manual command..."
                    className="flex-1 bg-transparent text-slate-200 text-sm px-2 py-1 focus:outline-none font-mono"
                    disabled={loading}
                />
                <button 
                    onClick={() => { if(customInput) { handleAction(customInput); setCustomInput(''); }}} 
                    disabled={loading || !customInput}
                    className="px-3 py-1 bg-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-700 disabled:opacity-50"
                >
                    SEND
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <Button variant="danger" onClick={() => handleAction("INITIATE TAKEOFF")} disabled={loading}>
                    🛫 TAKEOFF (GO)
                </Button>
                <Button variant="warning" onClick={() => handleAction("CANCEL FLIGHT (NO-GO)")} disabled={loading}>
                    🛑 CANCEL (NO-GO)
                </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}