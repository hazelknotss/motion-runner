import React, { useState, useRef } from 'react';
import { GameCanvas, GameCanvasHandle } from './components/GameCanvas';
import { TMController } from './components/TMController';
import { GameAction } from './types';
import { 
  Gamepad2, 
  HelpCircle, 
  Sparkles, 
  Award, 
  RotateCcw, 
  Globe, 
  Layers, 
  Wrench,
  Camera,
  ExternalLink,
  ChevronDown,
  BookOpen
} from 'lucide-react';

export default function App() {
  const gameRef = useRef<GameCanvasHandle | null>(null);
  const [activeAction, setActiveAction] = useState<GameAction>('neutral');
  const [controlSource, setControlSource] = useState<'keyboard' | 'teachable'>('keyboard');
  const [showInstructions, setShowInstructions] = useState(true);
  
  // High scores tracking
  const [gameScore, setGameScore] = useState(0);
  const [gameCoins, setGameCoins] = useState(0);
  const [persistentHighScore, setPersistentHighScore] = useState<number>(
    parseInt(localStorage.getItem('tm_dino_highscore') || '0', 10)
  );

  // Catch dynamic triggers from Teachable Machine
  const handleActionTriggered = (action: GameAction) => {
    setActiveAction(action);
  };

  const handleControlSourceChanged = (source: 'keyboard' | 'teachable') => {
    setControlSource(source);
  };

  const resetLocalHighScore = () => {
    if (confirm('Are you sure you want to reset your local Highscore achievements?')) {
      localStorage.removeItem('tm_dino_highscore');
      setPersistentHighScore(0);
      if (gameRef.current) {
        gameRef.current.resetGame();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#2D2D2D] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-900 font-sans" id="app-viewport">
      {/* 8-Bit Styled Top Navbar */}
      <header className="bg-[#FF4D4D] border-b-8 border-black py-5 px-6 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic flex items-center gap-1.5 leading-none">
                8-Bit Motion Runner
                <span className="text-[10px] px-2 py-0.5 bg-black text-[#00FF41] border-2 border-white font-bold uppercase tracking-wider font-mono">
                  TM_v1.0
                </span>
              </h1>
              <span className="text-xs text-white font-bold font-mono uppercase tracking-wider">Guided by Machine-Learning Neural Nets</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Quick score tracker */}
            <div className="flex items-center gap-2 bg-black text-[#00FF41] px-4 py-2 border-2 border-white font-mono text-lg shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
              <Award className="w-5 h-5 text-amber-400" />
              <span>HI-SCORE:</span>
              <span className="font-extrabold text-amber-300">
                {String(persistentHighScore).padStart(6, '0')}
              </span>
            </div>

            <button 
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FFCC00] text-black border-4 border-black font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all duration-100 cursor-pointer"
              id="instruction-toggle-btn"
            >
              <BookOpen className="w-4 h-4" />
              <span>{showInstructions ? 'Hide Guide' : 'Connect Model'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* Step-by-step Teachable Machine Connection Guide */}
        {showInstructions && (
          <div className="bg-[#FFCC00] text-black border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative animate-fade-in" id="tutorial-card">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-white text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-xl font-mono text-black mb-3 uppercase tracking-tighter italic flex items-center justify-between">
                  <span>How to Train &amp; Connect Your Motion Sensor Model</span>
                  <button 
                    onClick={() => setShowInstructions(false)}
                    className="text-xs text-white bg-black hover:bg-slate-800 cursor-pointer font-black border-2 border-white py-1 px-3 transition-colors uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)]"
                  >
                    Dismiss
                  </button>
                </h3>
                
                <p className="text-xs font-bold uppercase tracking-tight text-black/80 max-w-3xl mb-5 leading-relaxed">
                  This game is explicitly engineered to interface seamlessly with trained model weights generated from Google&apos;s free Teachable Machine platform. Record physical gestures (like raising hands for JUMP, ducking split seconds for CROUCH) and paste your link!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
                  <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] leading-relaxed">
                    <div className="flex items-center gap-2 mb-2 text-black font-black uppercase font-mono">
                      <span className="w-6 h-6 bg-[#FF4D4D] text-white border-2 border-black flex items-center justify-center font-black rounded-none">1</span>
                      <span>RECORD SENSORS</span>
                    </div>
                    <p className="text-slate-700 text-xs font-bold leading-normal">
                      Open <a href="https://teachablemachine.withgoogle.com/train/image" target="_blank" rel="noopener noreferrer" className="text-red-600 font-extrabold underline inline-flex items-center gap-0.5 hover:text-red-500">Teachable Machine Image Modeler <ExternalLink className="w-2.5 h-2.5" /></a>. Define 3 classes: <code className="bg-slate-100 p-0.5 border border-slate-300">Jump</code>, <code className="bg-slate-100 p-0.5 border border-slate-300">Crouch</code>, and <code className="bg-slate-100 p-0.5 border border-slate-300">Idle</code>. Record 150+ frames.
                    </p>
                  </div>

                  <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] leading-relaxed">
                    <div className="flex items-center gap-2 mb-2 text-black font-black uppercase font-mono">
                      <span className="w-6 h-6 bg-[#00D1FF] text-white border-2 border-black flex items-center justify-center font-black rounded-none">2</span>
                      <span>EXPORT &amp; SHARE</span>
                    </div>
                    <p className="text-slate-700 text-xs font-bold leading-normal">
                      Hold positions steady and click <b>&ldquo;Train Model&rdquo;</b>. When compilation finishes, hit <b>&ldquo;Export Model&rdquo;</b>, choose the <b>&ldquo;Upload (shareable link)&rdquo;</b> button, and click <b>Update my cloud model link</b>.
                    </p>
                  </div>

                  <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] leading-relaxed">
                    <div className="flex items-center gap-2 mb-2 text-black font-black uppercase font-mono">
                      <span className="w-6 h-6 bg-[#00A86B] text-white border-2 border-black flex items-center justify-center font-black rounded-none">3</span>
                      <span>SYNC PLAYING</span>
                    </div>
                    <p className="text-slate-700 text-xs font-bold leading-normal">
                      Copy that generated link (e.g. starting with <code>https://teachablemachine.withgoogle.com/...</code>) and paste it into the <b>Motion Controller input field below</b>, hit <b>&ldquo;Import&rdquo;</b>, and run the game!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Dual Module Dashboard (Gameplay column + Controls column) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Gameplay Screen (Left Col, spans 7 on large layouts) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="bg-white text-black border-4 border-black p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-4 select-none">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-red-500 animate-pulse" />
                  <h2 className="font-extrabold text-lg font-mono tracking-tighter uppercase text-black">Arcade Gameplay Screen</h2>
                </div>
                {/* Score counters status */}
                <div className="flex items-center gap-1.5 bg-black text-white px-2.5 py-1 text-[11px] font-mono border-2 border-black">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="uppercase text-emerald-400 font-bold">ENGINE LIVE</span>
                </div>
              </div>

              {/* The core endless game canvas */}
              <GameCanvas
                ref={gameRef}
                activeAction={activeAction}
                controlSource={controlSource}
                onScoreUpdate={(score) => {
                  setGameScore(score);
                  if (score > persistentHighScore) {
                    setPersistentHighScore(score);
                  }
                }}
                onCoinsUpdate={(coins) => setGameCoins(coins)}
              />
            </div>

            {/* Quick calibration settings / hints */}
            <div className="bg-[#00D1FF] text-black border-4 border-black p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none text-xs font-mono shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-start gap-2.5">
                <div className="p-1 bg-white border-2 border-black shrink-0">
                  <Wrench className="w-4 h-4 text-black" />
                </div>
                <div>
                  <span className="block font-black uppercase text-black">GESTURE CALIBRATION SUGGESTION</span>
                  <span className="text-black/80 font-bold text-xs leading-tight">
                    Make heavy physical movements for JUMP (e.g., throwing hands high or stepping side) so model predictions trigger instantly!
                  </span>
                </div>
              </div>
              <button
                onClick={resetLocalHighScore}
                className="px-4 py-2 bg-[#FF4D4D] text-white border-4 border-black font-black uppercase tracking-wider text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer shrink-0"
                id="reset-scores-btn"
              >
                RESET SCORES
              </button>
            </div>
          </div>

          {/* Teachable Machine Controller and Webcam panel (Right Col, spans 5 on large) */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <TMController
              onActionTriggered={handleActionTriggered}
              onControlSourceChanged={handleControlSourceChanged}
              activeControlSource={controlSource}
            />
          </div>

        </div>

      </main>

      {/* Footer footer-credit */}
      <footer className="mt-auto py-5 border-t-4 border-black bg-black select-none text-center text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-semibold uppercase tracking-wider">
          <p>© 2026 8-Bit Motion Runner. HTML5 Canvas &amp; Google Teachable Machine Net.</p>
          <div className="flex gap-4">
            <a href="https://teachablemachine.withgoogle.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors underline flex items-center gap-0.5">
              <span>Train Model Now</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
