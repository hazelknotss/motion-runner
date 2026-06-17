import React, { useRef, useEffect, useState } from 'react';
import { GameAction, ClassMapping, PredictionResult, TMModelInfo } from '../types';
import { 
  Camera, 
  CameraOff, 
  Info, 
  HelpCircle, 
  Sliders, 
  Link2, 
  ShieldAlert, 
  Lightbulb, 
  Video, 
  CheckCircle2, 
  Loader2,
  Gamepad2,
  Settings,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface TMControllerProps {
  onActionTriggered: (action: GameAction) => void;
  onControlSourceChanged: (source: 'keyboard' | 'teachable') => void;
  activeControlSource: 'keyboard' | 'teachable';
}

export const TMController: React.FC<TMControllerProps> = ({
  onActionTriggered,
  onControlSourceChanged,
  activeControlSource
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Script loading state
  const [libsReady, setLibsReady] = useState(false);
  const [libsLoading, setLibsLoading] = useState(false);
  const [libError, setLibError] = useState<string | null>(null);

  // Model parameters and user url input
  const [modelUrl, setModelUrl] = useState('');
  const [modelState, setModelState] = useState<TMModelInfo>({
    url: '',
    isLoading: false,
    isLoaded: false,
    error: null,
    classes: []
  });

  // TF/TM Model references
  const modelRef = useRef<any>(null);

  // Webcam stream
  const [streamActive, setStreamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  // Active mappings configured by user
  const [mappings, setMappings] = useState<ClassMapping[]>([]);

  // Track live predictions to display confidence meters
  const [livePredictions, setLivePredictions] = useState<PredictionResult[]>([]);

  // Simulation mode states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedClass, setSimulatedClass] = useState<string>('idle');

  // Load TensorFlow.js and Teachable Machine dynamically from CDN
  const loadTMlibraries = async () => {
    if (libsReady) return;
    setLibsLoading(true);
    setLibError(null);
    try {
      // 1. Load TensorFlow.js core
      await injectScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js', 'tfjs');
      // 2. Load Teachable Machine Image SDK
      await injectScript('https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.5/dist/teachablemachine-image.min.js', 'tmImage');
      
      setLibsReady(true);
    } catch (e: any) {
      console.error('Failed to resolve CDN libraries', e);
      setLibError('SDK load failed. Check internet access.');
    } finally {
      setLibsLoading(false);
    }
  };

  const injectScript = (src: string, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.getElementById(id)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.id = id;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  };

  // Turn on/off webcam streams safely
  const startCamera = async () => {
    setWebcamError(null);
    try {
      const constraints = {
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      }
    } catch (e: any) {
      console.error('Camera access rejected', e);
      setWebcamError(
        e.name === 'NotAllowedError' 
          ? 'Webcam permission denied. Please allow camera access in browser settings.' 
          : 'Could not access web camera. Check if it is occupied by another application.'
      );
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Start webcam automatically if libraries load or on mounting
  useEffect(() => {
    loadTMlibraries();
    return () => {
      stopCamera();
    };
  }, []);

  // Fetch / Load the custom model from Teachable Machine
  const handleLoadModel = async () => {
    if (!modelUrl.trim()) return;
    
    // Normalize URL
    let absoluteUrl = modelUrl.trim();
    if (!absoluteUrl.endsWith('/')) {
      absoluteUrl += '/';
    }

    setModelState({
      url: absoluteUrl,
      isLoading: true,
      isLoaded: false,
      error: null,
      classes: []
    });

    try {
      // Ensure scripts are fully populated
      if (!libsReady) {
        await loadTMlibraries();
      }

      const tmImage = (window as any).tmImage;
      if (!tmImage) {
        throw new Error('Teachable Machine SDK is missing on window.');
      }

      const modelJSON = absoluteUrl + 'model.json';
      const metadataJSON = absoluteUrl + 'metadata.json';

      // Loads the model and metadata from cloud
      const loadedModel = await tmImage.load(modelJSON, metadataJSON);
      modelRef.current = loadedModel;

      // Extract classification labels
      const classes = loadedModel.getClassLabels() as string[];
      
      // Setup initial mappings:
      // Try to intelligently match standard labels like jump, crouch, idle or similar
      const initialMappings = classes.map((cl, idx) => {
        const lower = cl.toLowerCase();
        let action: GameAction = 'neutral';
        
        if (lower.includes('jump') || lower.includes('up') || lower.includes('high') || lower.includes('fly')) {
          action = 'jump';
        } else if (lower.includes('crouch') || lower.includes('down') || lower.includes('duck') || lower.includes('low')) {
          action = 'crouch';
        } else if (idx === 0) {
          action = 'neutral'; // default idle
        }

        return {
          className: cl,
          action,
          threshold: 0.82 // Default sweet-spot prediction threshold
        };
      });

      setMappings(initialMappings);
      setModelState({
        url: absoluteUrl,
        isLoading: false,
        isLoaded: true,
        error: null,
        classes
      });

      // Turn on webcam if not already running to preview instantly
      if (!streamActive) {
        await startCamera();
      }

      // Automatically switch game controller input source to teachable
      onControlSourceChanged('teachable');

    } catch (e: any) {
      console.error('Failed loading Teachable Machine Model:', e);
      setModelState(prev => ({
        ...prev,
        isLoading: false,
        isLoaded: false,
        error: 'Failed to fetch model files. Verify that your sharing URL is public and correct (e.g. starts with https://teachablemachine.withgoogle.com/models/).'
      }));
    }
  };

  // Prediction loop running on requestAnimationFrame
  useEffect(() => {
    if (!modelState.isLoaded || !modelRef.current || !streamActive) return;

    let predictionTimer: any;

    const runPredictions = async () => {
      // Ensure video is playing and ready
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          // run inference
          const predictions = await modelRef.current.predict(videoRef.current);
          const formattedPredictions = predictions.map((p: any) => ({
            className: p.className,
            probability: p.probability
          }));

          setLivePredictions(formattedPredictions);

          // Find if any class matches action criteria threshold
          let triggeredGameAction: GameAction = 'neutral';
          let highestConfidence = 0;

          formattedPredictions.forEach((pred: any) => {
            const rule = mappings.find(m => m.className === pred.className);
            if (rule && rule.action !== 'neutral' && pred.probability >= rule.threshold) {
              if (pred.probability > highestConfidence) {
                highestConfidence = pred.probability;
                triggeredGameAction = rule.action;
              }
            }
          });

          // Send action to game canvas
          if (triggeredGameAction !== 'neutral') {
            onActionTriggered(triggeredGameAction);
          } else {
            onActionTriggered('neutral'); // returns to steady running state
          }

        } catch (e) {
          console.error('Inference error:', e);
        }
      }

      // Schedule next prediction (throttling slightly to save CPU)
      predictionTimer = setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(runPredictions);
      }, 80); // ~12 fps is plenty fast for response and saves CPU in sandboxes!
    };

    animationFrameRef.current = requestAnimationFrame(runPredictions);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      clearTimeout(predictionTimer);
    };
  }, [modelState.isLoaded, streamActive, mappings]);

  // Adjust Mapping configuration
  const handleMapAction = (className: string, action: GameAction) => {
    setMappings(prev => prev.map(m => 
      m.className === className ? { ...m, action } : m
    ));
  };

  const handleMapThreshold = (className: string, val: number) => {
    setMappings(prev => prev.map(m => 
      m.className === className ? { ...m, threshold: val } : m
    ));
  };

  // Toggle active input control source
  const toggleControlSource = () => {
    const nextSource = activeControlSource === 'keyboard' ? 'teachable' : 'keyboard';
    onControlSourceChanged(nextSource);
  };

  // Setup simulated parameters for users without TM URLs
  const activeSimulation = (action: GameAction) => {
    onActionTriggered(action);
    setSimulatedClass(action);
  };

  return (
    <div className="bg-white border-4 border-black p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black flex flex-col h-full" id="teachable-machine-dashboard">
      <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-4 select-none">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-red-500 animate-pulse" />
          <h2 className="font-extrabold text-lg font-mono tracking-tighter uppercase">Motion Settings</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-black text-black uppercase">Source:</span>
          <button
            onClick={toggleControlSource}
            className={`flex items-center gap-1.5 px-3 py-1 font-mono text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer ${
              activeControlSource === 'keyboard' ? 'bg-[#FFCC00] text-black' : 'bg-[#00D1FF] text-black'
            }`}
            id="toggle-source-btn"
          >
            {activeControlSource === 'keyboard' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                <span>KEYBOARD</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                <span>CAMERA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1. Paste Teachable Machine SDK URL form */}
      <div className="bg-slate-100 p-4 border-4 border-black mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <label className="block text-xs font-mono font-black text-black mb-2 flex items-center gap-1.5 uppercase">
          <Link2 className="w-4 h-4 text-black shrink-0" />
          Paste Shared Teachable Machine URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-3 py-1.5 bg-white border-2 border-black text-xs text-black font-mono outline-hidden focus:bg-amber-50 max-w-full text-ellipsis placeholder-slate-400"
            placeholder="https://teachablemachine.withgoogle.com/models/..."
            value={modelUrl}
            onChange={(e) => setModelUrl(e.target.value)}
            disabled={modelState.isLoading}
            id="tm-url-input"
          />
          <button
            onClick={handleLoadModel}
            disabled={modelState.isLoading || !modelUrl.trim()}
            className="px-4 py-1.5 bg-[#FFCC00] hover:bg-amber-400 disabled:bg-slate-300 border-2 border-black text-black font-black font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:shadow-none disabled:translate-x-0 cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5"
            id="load-tm-btn"
          >
            {modelState.isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : <span>SYNC</span>}
          </button>
        </div>

        {modelState.isLoading && (
          <div className="mt-2 text-xs font-mono text-slate-700 flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
            <span>Connecting Teachable CDN cloud matrices...</span>
          </div>
        )}

        {modelState.error && (
          <div className="mt-2.5 p-2 bg-red-100 border-2 border-red-500 text-xs text-red-700 font-mono font-bold">
            <span>{modelState.error}</span>
          </div>
        )}

        {modelState.isLoaded && (
          <div className="mt-2 text-xs font-mono text-emerald-700 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Success: {modelState.classes.length} classes loaded!</span>
          </div>
        )}
      </div>

      {/* Grid Layout: Video Feed and Live Config mappings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        
        {/* Video Viewfinder / Camera block */}
        <div className="flex flex-col">
          <div className="relative aspect-video w-full bg-black border-4 border-black overflow-hidden flex items-center justify-center group shadow-inner">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 z-0 bg-black"
              muted
              playsInline
            />

            {!streamActive ? (
              <div className="z-10 text-center p-3">
                <CameraOff className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="block text-xs font-mono text-slate-300 mb-2 font-black uppercase">Web-Camera Inactive</span>
                <button
                  onClick={startCamera}
                  className="px-3 py-1 bg-[#FFCC00] text-black border-2 border-black text-xs font-mono font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                  id="activate-camera-btn"
                >
                  START CAMERA
                </button>
              </div>
            ) : (
              <div className="absolute top-2 right-2 z-10 flex gap-1">
                <span className="px-2 py-0.5 bg-red-500 text-white font-mono text-[9px] font-black border-2 border-black flex items-center gap-1 tracking-wide select-none">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                  LIVE FEED
                </span>
                <button
                  onClick={stopCamera}
                  className="p-1 bg-white border-2 border-black text-rose-600 transition-colors cursor-pointer"
                  title="Shut off webcam"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {webcamError && (
              <div className="absolute inset-0 bg-white/95 z-25 p-4 flex flex-col justify-center items-center text-center text-black">
                <ShieldAlert className="w-8 h-8 text-red-500 mb-2 animate-bounce" />
                <p className="text-xs font-mono text-slate-800 font-bold leading-normal max-w-xs">{webcamError}</p>
                <button
                  onClick={startCamera}
                  className="mt-3 px-3 py-1 bg-red-500 text-white border-2 border-black font-black text-xs font-mono rounded-none cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  Retry Access
                </button>
              </div>
            )}
          </div>

          {/* Quick instructions details */}
          <div className="mt-3.5 p-3.5 bg-slate-100 border-2 border-black flex gap-2 items-start text-xs text-black leading-relaxed">
            <Lightbulb className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-black uppercase tracking-tight text-red-500">Quick Guide:</span>
              <p>1. Stand neutral in front of your camera to teach the <b>idle</b> state.</p>
              <p>2. Keep model gestures distinct for <code>Jump</code> and <code>Crouch</code>.</p>
              <p>3. Map classes below to actions once your model is synchronized.</p>
            </div>
          </div>
        </div>

        {/* Mappings Panel & Confidence indicators */}
        <div className="flex flex-col gap-3">
          {modelState.isLoaded ? (
            <div className="flex-grow flex flex-col">
              <div className="bg-slate-150 p-2 border-2 border-black flex items-center gap-1.5 mb-2.5">
                <Sliders className="w-4 h-4 text-black shrink-0" />
                <span className="text-xs font-mono font-black uppercase text-black">Map Classes to Actions</span>
              </div>

              {/* Class Mappings list */}
              <div className="flex-grow flex flex-col gap-2 overflow-y-auto max-h-[220px]">
                {mappings.map((rule) => {
                  // Find current prediction value
                  const pred = livePredictions.find(lp => lp.className === rule.className);
                  const confidence = pred ? pred.probability : 0;
                  const isExceeded = confidence >= rule.threshold;
                  
                  return (
                    <div 
                      key={rule.className} 
                      className={`p-3 border-2 transition-all ${
                        isExceeded && rule.action !== 'neutral'
                          ? 'bg-amber-100 border-red-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                          : 'bg-slate-50 border-black'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2 gap-1">
                        <span className="text-xs font-mono font-black truncate text-black uppercase">
                          {rule.className}
                        </span>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          <select
                            value={rule.action}
                            onChange={(e) => handleMapAction(rule.className, e.target.value as GameAction)}
                            className="bg-white border-2 border-black text-black font-mono text-[11px] font-bold px-1.5 py-0.5 cursor-pointer outline-hidden focus:bg-amber-50"
                          >
                            <option value="neutral">Idle / Ignore</option>
                            <option value="jump">Jump ⬆️</option>
                            <option value="crouch">Crouch ⬇️</option>
                          </select>
                        </div>
                      </div>

                      {/* Display live meter progress bar */}
                      <div className="mb-2">
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-700 mb-1">
                          <span className="font-bold">Live Prediction</span>
                          <span className={`${isExceeded ? 'text-red-600 font-extrabold' : 'font-bold'}`}>
                            {Math.floor(confidence * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 border-2 border-black overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-75 ${
                              isExceeded && rule.action !== 'neutral' ? 'bg-[#FF4D4D]' : 'bg-slate-600'
                            }`}
                            style={{ width: `${confidence * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Slider for setting threshold */}
                      <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-600">
                        <span className="font-bold">Threshold to activate:</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="range"
                            min="0.5"
                            max="0.98"
                            step="0.02"
                            value={rule.threshold}
                            onChange={(e) => handleMapThreshold(rule.className, parseFloat(e.target.value))}
                            className="w-16 h-1 bg-slate-400 appearance-none cursor-pointer accent-[#FF4D4D]"
                          />
                          <span className="w-7 text-right font-bold text-black font-mono">{(rule.threshold * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Developer Mock Simulator console (for instant playing/testing)
            <div className="bg-[#00D1FF] p-4 border-4 border-black h-full flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] select-none">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Gamepad2 className="w-4 h-4 text-black animate-bounce" />
                  <span className="text-xs font-mono font-black text-black uppercase tracking-tight">Input Emulator Console</span>
                </div>
                <p className="text-xs text-black/90 font-bold leading-normal mb-3">
                  Do not have a completed model URL share-link yet? Simulate live neural responses on-the-fly below, or simply tap computer arrow keys!
                </p>

                <div className="flex flex-col gap-2 mb-3">
                  <button
                    onMouseDown={() => activeSimulation('jump')}
                    onMouseUp={() => activeSimulation('neutral')}
                    onTouchStart={() => activeSimulation('jump')}
                    onTouchEnd={() => activeSimulation('neutral')}
                    className={`py-2 px-3 font-mono font-black text-xs border-2 border-black outline-none cursor-pointer flex justify-between items-center transition-all ${
                      simulatedClass === 'jump'
                        ? 'bg-[#FFCC00] text-black shadow-none translate-x-[1px] translate-y-[1px]'
                        : 'bg-white text-black hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
                    }`}
                  >
                    <span>SIMULATE &quot;JUMP&quot;</span>
                    <span className="text-[9px] px-1 bg-black text-white font-mono">HOLD SPACE</span>
                  </button>

                  <button
                    onMouseDown={() => activeSimulation('crouch')}
                    onMouseUp={() => activeSimulation('neutral')}
                    onTouchStart={() => activeSimulation('crouch')}
                    onTouchEnd={() => activeSimulation('neutral')}
                    className={`py-2 px-3 font-mono font-black text-xs border-2 border-black outline-none cursor-pointer flex justify-between items-center transition-all ${
                      simulatedClass === 'crouch'
                        ? 'bg-[#FFCC00] text-black shadow-none translate-x-[1px] translate-y-[1px]'
                        : 'bg-white text-black hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
                    }`}
                  >
                    <span>SIMULATE &quot;CROUCH&quot;</span>
                    <span className="text-[9px] px-1 bg-black text-white font-mono">HOLD DOWN</span>
                  </button>
                </div>
              </div>

              <div className="text-[9px] font-mono leading-normal text-black bg-white p-2 border-2 border-black font-semibold">
                Tip: Standard model classifiers run best when trained in Chrome or Edge brower versions.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
