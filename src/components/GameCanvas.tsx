import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { 
  PlayerState, 
  GameObstacle, 
  Particle, 
  Cloud, 
  Star, 
  GameAction, 
  ObstacleType 
} from '../types';
import { drawPixelSprite } from '../utils/sprites';
import { audio } from '../utils/audio';
import { Play, RotateCcw, Volume2, VolumeX, Keyboard, Radio } from 'lucide-react';

interface GameCanvasProps {
  activeAction: GameAction;
  controlSource: 'keyboard' | 'teachable';
  onScoreUpdate: (score: number) => void;
  onCoinsUpdate: (coins: number) => void;
}

export interface GameCanvasHandle {
  startGame: () => void;
  resetGame: () => void;
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(({
  activeAction,
  controlSource,
  onScoreUpdate,
  onCoinsUpdate
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sound States
  const [muted, setMuted] = useState(false);

  // Score stats to display in React Overlay
  const [gameState, setGameState] = useState<PlayerState>({
    y: 0,
    vy: 0,
    isJumping: false,
    isCrouching: false,
    score: 0,
    highScore: parseInt(localStorage.getItem('tm_dino_highscore') || '0', 10),
    distance: 0,
    coins: 0,
    status: 'idle',
  });

  // Mutable Game loop states (avoiding React re-render lag)
  const gameLoopRef = useRef<number | null>(null);
  const stateRef = useRef<PlayerState>({
    y: 0,
    vy: 0,
    isJumping: false,
    isCrouching: false,
    score: 0,
    highScore: parseInt(localStorage.getItem('tm_dino_highscore') || '0', 10),
    distance: 0,
    coins: 0,
    status: 'idle',
  });

  const obstaclesRef = useRef<GameObstacle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const starsRef = useRef<Star[]>([]);
  const frameCountRef = useRef<number>(0);
  const lastObstacleSpawnRef = useRef<number>(0);
  
  // Audio state synchronizer
  useEffect(() => {
    audio.setSoundEnabled(!muted);
  }, [muted]);

  // Dimension tracking
  const [dimensions, setDimensions] = useState({ width: 800, height: 300 });

  // Handle resizing of container
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        // Keep standard aspect ratio of 8:3
        const targetWidth = Math.min(width, 1000);
        const targetHeight = Math.floor(targetWidth * (300 / 800));
        setDimensions({ width: targetWidth, height: targetHeight });
      }
    };

    window.addEventListener('resize', handleResize);
    // Call immediately next tick
    const timer = setTimeout(handleResize, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Sync highscore between state and localStorage
  const saveHighScore = (score: number) => {
    if (score > stateRef.current.highScore) {
      stateRef.current.highScore = score;
      localStorage.setItem('tm_dino_highscore', score.toString());
      setGameState(prev => ({ ...prev, highScore: score }));
    }
  };

  // Keyboard controls listener
  useEffect(() => {
    const activeKeys = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.status !== 'running') return;
      if (controlSource !== 'keyboard') return;

      if ((e.code === 'Space' || e.code === 'ArrowUp') && !activeKeys.has(e.code)) {
        activeKeys.add(e.code);
        triggerJump();
        e.preventDefault();
      }

      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        triggerCrouch(true);
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (controlSource !== 'keyboard') return;
      
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        activeKeys.delete(e.code);
      }

      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        triggerCrouch(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [controlSource]);

  // Teachable Machine Actions mapping listener
  useEffect(() => {
    if (stateRef.current.status !== 'running') return;
    if (controlSource !== 'teachable') return;

    if (activeAction === 'jump') {
      triggerJump();
    } else if (activeAction === 'crouch') {
      triggerCrouch(true);
    } else {
      triggerCrouch(false);
    }
  }, [activeAction, controlSource]);

  // Action methods
  const triggerJump = () => {
    const s = stateRef.current;
    if (!s.isJumping && !s.isCrouching) {
      s.isJumping = true;
      s.vy = -15.5; // Initial jump velocity
      audio.playJump();
      
      // Spawn tiny ground dust particles on takeoff
      for (let i = 0; i < 5; i++) {
        spawnParticle(
          50 + Math.random() * 20, 
          250, 
          -1 - Math.random() * 2, 
          -Math.random() * 2, 
          4, 
          '#94a3b8', 
          15
        );
      }
    }
  };

  const triggerCrouch = (isCrouching: boolean) => {
    const s = stateRef.current;
    if (s.isJumping) return; // Cannot crouch in air

    if (isCrouching && !s.isCrouching) {
      s.isCrouching = true;
      audio.playCrouch();
    } else if (!isCrouching && s.isCrouching) {
      s.isCrouching = false;
    }
  };

  // Particle explosion helper
  const spawnParticle = (
    x: number, 
    y: number, 
    vx: number, 
    vy: number, 
    size: number, 
    color: string, 
    lifetime: number
  ) => {
    particlesRef.current.push({
      x,
      y,
      vx,
      vy,
      size,
      color,
      lifetime,
      maxLifetime: lifetime
    });
  };

  // Initialize background environments (clouds & stars)
  const initEnvironment = () => {
    // Generate initial clouds
    cloudsRef.current = Array.from({ length: 5 }, (_, i) => ({
      x: 100 + i * 220 + Math.random() * 80,
      y: 40 + Math.random() * 50,
      scale: 1 + Math.random() * 0.8,
      speed: 0.15 + Math.random() * 0.15
    }));

    // Generate initial twinkling stars
    starsRef.current = Array.from({ length: 30 }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 150,
      size: 1 + Math.random() * 2,
      brightness: Math.random(),
      twinkleSpeed: 0.01 + Math.random() * 0.02
    }));
  };

  // Expose Game Control APis via Ref
  useImperativeHandle(ref, () => ({
    startGame: () => {
      if (stateRef.current.status === 'running') return;
      
      // Reset game parameters
      stateRef.current = {
        y: 0,
        vy: 0,
        isJumping: false,
        isCrouching: false,
        score: 0,
        highScore: stateRef.current.highScore,
        distance: 0,
        coins: 0,
        status: 'running',
      };
      
      obstaclesRef.current = [];
      particlesRef.current = [];
      frameCountRef.current = 0;
      lastObstacleSpawnRef.current = 0;
      
      initEnvironment();
      setGameState({ ...stateRef.current });

      // Run game loop
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = requestAnimationFrame(tick);
    },
    resetGame: () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      stateRef.current.status = 'idle';
      stateRef.current.score = 0;
      stateRef.current.distance = 0;
      stateRef.current.coins = 0;
      stateRef.current.y = 0;
      stateRef.current.vy = 0;
      stateRef.current.isJumping = false;
      stateRef.current.isCrouching = false;
      obstaclesRef.current = [];
      particlesRef.current = [];
      initEnvironment();
      setGameState({ ...stateRef.current });
      drawDefaultScreen();
    }
  }));

  // Setup canvas drawing context
  useEffect(() => {
    initEnvironment();
    drawDefaultScreen();
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [dimensions]);

  const drawDefaultScreen = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset transform & clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dimensions.width / 800, dimensions.height / 300);

    // Sandy Sky Blue Backdrop
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, 800, 300);

    // Solid Sandy ground block
    ctx.fillStyle = '#E1C699';
    ctx.fillRect(0, 250, 800, 50);

    // Ground floor border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 250);
    ctx.lineTo(800, 250);
    ctx.stroke();

    // Dotted ground accents
    ctx.fillStyle = '#000000';
    for (let x = 10; x < 800; x += 40) {
      ctx.fillRect(x + (x % 3), 254, 3, 2);
    }

    // Draw idle dino resting on the ground
    drawPixelSprite(ctx, 'dino_idle', 50, 250 - 44, 44, 44, 'light');

    // Decorative retro elements
    ctx.fillStyle = '#FF4D4D';
    ctx.font = 'black 38px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('8-BIT RUNNER', 400, 100);

    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillStyle = '#000000';
    ctx.fillText('Press SPACEBAR / Enter OR Trigger TM Input to Run', 400, 140);
  };

  // Spawn dynamic obstacles
  const spawnObstacle = (distance: number, speed: number) => {
    const timeSinceLast = distance - lastObstacleSpawnRef.current;
    const minInterval = 12; // Far more action-heavy interval (approx ~350-400 physical pixels)
    
    if (timeSinceLast < minInterval) return;

    // High spawn triggering chance
    if (Math.random() < 0.08) {
      // Pick obstacle type dynamically based on difficulty/distance (higher coin ratio)
      const types: ObstacleType[] = ['cactus_small', 'cactus_large', 'cactus_double', 'coin', 'coin'];
      if (distance > 300) {
        types.push('bird_high', 'bird_low');
      }

      const selectedType = types[Math.floor(Math.random() * types.length)];
      
      let w = 24;
      let h = 36;
      let y = 250 - h; // Default ground-level

      if (selectedType === 'cactus_small') {
        w = 20; h = 30; y = 250 - h;
      } else if (selectedType === 'cactus_large') {
        w = 28; h = 42; y = 250 - h;
      } else if (selectedType === 'cactus_double') {
        w = 40; h = 32; y = 250 - h;
      } else if (selectedType === 'bird_high') {
        w = 34; h = 26; y = 140; // High flyer, must crouch or stand still
      } else if (selectedType === 'bird_low') {
        w = 34; h = 26; y = 195; // Low flyer, must jump over
      }

      if (selectedType === 'coin') {
        // Spawn a stream of 3 to 5 coins for amazing gold collection thrills!
        const coinCount = Math.floor(Math.random() * 3) + 3;
        const baseCoinY = 120 + Math.random() * 75; // float at varied jump heights
        for (let i = 0; i < coinCount; i++) {
          obstaclesRef.current.push({
            id: Math.random().toString(36).substr(2, 9),
            type: 'coin',
            x: 820 + (i * 38), // neatly spaced cluster
            y: baseCoinY,
            width: 24,
            height: 24,
            speed,
            passed: false,
            frame: 0
          });
        }
      } else {
        obstaclesRef.current.push({
          id: Math.random().toString(36).substr(2, 9),
          type: selectedType,
          x: 820,
          y,
          width: w,
          height: h,
          speed,
          passed: false,
          frame: 0
        });
      }

      lastObstacleSpawnRef.current = distance;
    }
  };

  // Main high speed physics & rendering frame tick
  const tick = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = stateRef.current;
    if (s.status !== 'running') return;

    frameCountRef.current++;

    // 1. UPDATE STATE & CONTROLS
    // Score increment
    s.distance += 0.35;
    s.score = Math.floor(s.distance) + (s.coins * 30); // Coins supercharge score
    onScoreUpdate(s.score);

    // Difficulty Speed increment (elevated baseline & acceleration curve)
    const currentSpeed = Math.min(11.5 + (s.distance * 0.0035), 24.0);

    // Gravity & Jump Physics (tuned to feel crisp and snappy at higher scrolling rates)
    const gravity = 0.92;
    if (s.isJumping) {
      s.vy += gravity;
      s.y += s.vy;

      // Check ground collision
      if (s.y >= 0) {
        s.y = 0;
        s.vy = 0;
        s.isJumping = false;
      }
    }

    // Dynamic Theme Modulation (Day vs Night transition every 1200 distance units)
    const cycleLength = 1200;
    const cyclePos = s.distance % cycleLength;
    // Night is triggered in the third quarter of the cycle
    const isNight = cyclePos > cycleLength * 0.5 && cyclePos < cycleLength * 0.9;
    const skyTheme = isNight ? 'dark' : 'light';

    // 2. CONTEXT PRESETS (800x300 coordinates regardless of physical screen sizing)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dimensions.width / 800, dimensions.height / 300);

    // Render Sky Fill
    ctx.fillStyle = isNight ? '#2e3440' : '#87CEEB';
    ctx.fillRect(0, 0, 800, 300);

    // Ground Sandy backdrop layer during running
    if (!isNight) {
      ctx.fillStyle = '#E1C699';
      ctx.fillRect(0, 250, 800, 50);
    } else {
      ctx.fillStyle = '#4c566a';
      ctx.fillRect(0, 250, 800, 50);
    }

    // 3. BACKGROUND DRAWING
    // Stars Twinkle (Night Mode only)
    if (isNight) {
      starsRef.current.forEach(star => {
        star.brightness += Math.sin(frameCountRef.current * star.twinkleSpeed) * 0.05;
        star.brightness = Math.max(0.1, Math.min(1.0, star.brightness));
        ctx.fillStyle = `rgba(236, 239, 244, ${star.brightness})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      // Simple 8-bit aesthetic moon
      ctx.fillStyle = '#eceff4';
      ctx.beginPath();
      ctx.arc(700, 60, 20, 0, Math.PI * 2);
      ctx.fill();
      // Crescent cutter mask
      ctx.fillStyle = '#2e3440';
      ctx.beginPath();
      ctx.arc(692, 54, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Clouds update and render
    cloudsRef.current.forEach(cloud => {
      cloud.x -= cloud.speed;
      if (cloud.x < -100) {
        cloud.x = 850;
        cloud.y = 30 + Math.random() * 60;
      }
      drawPixelSprite(ctx, 'cloud', cloud.x, cloud.y, 60 * cloud.scale, 20 * cloud.scale, skyTheme);
    });

    // Drawing parallax Mountains/Hills
    ctx.fillStyle = isNight ? '#3b4252' : '#FFCC00';
    const numHills = 4;
    for (let i = 0; i < numHills; i++) {
      const hillX = ((50 + i * 280 - s.distance * 0.4) % 1120);
      const drawHillX = hillX < -150 ? hillX + 1120 : hillX;
      drawPixelSprite(
        ctx, 
        'mountain_jagged', 
        drawHillX, 
        250 - 45, 
        90, 
        45, 
        skyTheme, 
        isNight ? '#3b4252' : '#FFCC00'
      );
    }

    // Ground boundary lines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 250);
    ctx.lineTo(800, 250);
    ctx.stroke();

    // Speckled ground tiles
    ctx.fillStyle = isNight ? '#eceff4' : '#000000';
    const groundScroll = (s.distance * currentSpeed) % 80;
    for (let gx = -80; gx < 880; gx += 40) {
      const px = gx - groundScroll;
      ctx.fillRect(px, 254, 3, 2);
      ctx.fillRect(px + 15, 258, 2, 2);
    }

    // 4. PLAYER CALCULATIONS
    const playerX = 50;
    const playerWidth = s.isCrouching ? 52 : 44;
    const playerHeight = s.isCrouching ? 28 : 44;
    const playerY = 250 - playerHeight + s.y;

    // Sprite Selection & Animation loops
    let playerSprite: 'dino_run_1' | 'dino_run_2' | 'dino_crouch_1' | 'dino_crouch_2' | 'dino_idle' = 'dino_run_1';
    
    if (s.isJumping) {
      playerSprite = 'dino_idle'; // Lock stance in air
    } else if (s.isCrouching) {
      const runs = Math.floor(frameCountRef.current / 6) % 2 === 0;
      playerSprite = runs ? 'dino_crouch_1' : 'dino_crouch_2';
    } else {
      const runs = Math.floor(frameCountRef.current / 6) % 2 === 0;
      playerSprite = runs ? 'dino_run_1' : 'dino_run_2';
    }

    // Draw active Player sprite
    drawPixelSprite(ctx, playerSprite, playerX, playerY, playerWidth, playerHeight, skyTheme);

    // 5. OBSTACLES LOOP (PHYSICS, DRAWING, COLLECTIONS, COLLISIONS)
    spawnObstacle(s.distance, currentSpeed);

    obstaclesRef.current = obstaclesRef.current.filter(obs => {
      // Move obstacles from right to left
      obs.x -= currentSpeed;

      // Render obstacle sprite
      if (obs.type === 'cactus_small') {
        drawPixelSprite(ctx, 'cactus_small', obs.x, obs.y, obs.width, obs.height, skyTheme);
      } else if (obs.type === 'cactus_large') {
        drawPixelSprite(ctx, 'cactus_large', obs.x, obs.y, obs.width, obs.height, skyTheme);
      } else if (obs.type === 'cactus_double') {
        drawPixelSprite(ctx, 'cactus_double', obs.x, obs.y, obs.width, obs.height, skyTheme);
      } else if (obs.type === 'bird_high' || obs.type === 'bird_low') {
        // Flapping wings frame modulation
        const flap = Math.floor(frameCountRef.current / 8) % 2 === 0;
        const bSprite = flap ? 'bird_up' : 'bird_down';
        drawPixelSprite(ctx, bSprite, obs.x, obs.y, obs.width, obs.height, skyTheme);
      } else if (obs.type === 'coin') {
        // Rotates coin through frame matrices
        const rotateFrame = Math.floor(frameCountRef.current / 5) % 3;
        const coinSprite = rotateFrame === 0 ? 'coin_frame_1' : rotateFrame === 1 ? 'coin_frame_2' : 'coin_frame_3';
        drawPixelSprite(ctx, coinSprite as any, obs.x, obs.y, obs.width, obs.height, skyTheme);
      }

      // Check collision / trigger points
      const hasCollided = checkAABBCollision(
        playerX, playerY, playerWidth, playerHeight,
        obs.x, obs.y, obs.width, obs.height,
        obs.type === 'coin' // Generous colliders for sweet coin grabs
      );

      if (hasCollided) {
        if (obs.type === 'coin') {
          // Play coin sound
          audio.playCoin();
          
          // Increment state
          s.coins++;
          onCoinsUpdate(s.coins);
          
          // Trigger star golden shower particles
          for (let p = 0; p < 8; p++) {
            spawnParticle(
              obs.x + obs.width / 2,
              obs.y + obs.height / 2,
              (Math.random() - 0.5) * 6,
              (Math.random() - 0.5) * 6 - 2,
              3 + Math.random() * 2,
              '#ebcb8b', // gold glow
              25
            );
          }
          // Remove from active obstacles (filtered out)
          return false;
        } else {
          // It's a spike/bird danger obstacle -> CRASH AND DESTRUCTION!
          gameOver(ctx, playerX, playerY, playerWidth, playerHeight, skyTheme);
          return false;
        }
      }

      // Filter offscreen obstacles
      return obs.x > -150;
    });

    // 6. DRAW PARTICLES
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.lifetime--;

      const alpha = p.lifetime / p.maxLifetime;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      ctx.restore();

      return p.lifetime > 0;
    });

    // Trigger state sync to display real-time React overlay elements
    if (frameCountRef.current % 10 === 0) {
      setGameState({ ...s });
    }

    gameLoopRef.current = requestAnimationFrame(tick);
  };

  // Safe Axis-Aligned Bounding Box (AABB) Collision Detector
  const checkAABBCollision = (
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number,
    isCoin: boolean
  ): boolean => {
    // Add pixel padding to avoid frustrating pixel-corner collisions
    const padding = isCoin ? -4 : 6; 
    
    return (
      ax + padding < bx + bw - padding &&
      ax + aw - padding > bx + padding &&
      ay + padding < by + bh - padding &&
      ay + ah - padding > by + padding
    );
  };

  // Handle Game Crash / Death Sequence
  const gameOver = (
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    pw: number,
    ph: number,
    theme: 'light' | 'dark'
  ) => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    
    // Play crash explosion
    audio.playGameOver();

    // Heavy dramatic pixel shatter of the dino
    for (let k = 0; k < 25; k++) {
      spawnParticle(
        px + pw / 2,
        py + ph / 2,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 12 - 4,
        4 + Math.random() * 4,
        theme === 'light' ? '#3b4252' : '#eceff4',
        40
      );
    }

    // Set Game Over screen state
    const s = stateRef.current;
    s.status = 'gameover';
    saveHighScore(s.score);
    setGameState({ ...s });

    // Paint Crash sprite
    const mainColor = theme === 'light' ? '#22252a' : '#eceff4';
    ctx.fillStyle = isMuted() ? 'transparent' : '#bf616a';
    drawPixelSprite(ctx, 'dino_dead', px, py, pw, ph, theme, '#bf616a');

    // Translucent dark screen filter
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, 800, 300);

    // Score billboard layout
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('G A M E   O V E R', 400, 110);

    ctx.font = '16px "Courier New", monospace';
    ctx.fillText(`Final Score: ${s.score}   Coins: ${s.coins}`, 400, 150);
    ctx.fillText('Press SPACEBAR / ENTER or click restart button', 400, 195);
  };

  const isMuted = () => muted;

  return (
    <div className="relative w-full overflow-hidden select-none" id="retro-gameplay-container">
      {/* Visual Overlay Header Stats */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between text-xs font-mono select-none pointer-events-none">
        {/* Distance and coins indicator */}
        <div className="flex gap-4 p-2 bg-slate-900/80 text-white rounded-md border border-slate-700 backdrop-blur-xs">
          <div className="flex items-center gap-1.5">
            <Radio className={`w-3.5 h-3.5 ${controlSource === 'teachable' ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span>MODE: <b className="text-amber-400 uppercase">{controlSource}</b></span>
          </div>
          <div>COINS: <span className="text-yellow-400 font-bold">{gameState.coins}</span></div>
        </div>

        {/* Live score meter */}
        <div className="flex gap-4 p-2 bg-slate-900/80 text-white rounded-md border border-slate-700 backdrop-blur-xs font-bold">
          <div>HI: <span className="text-slate-300">{String(gameState.highScore).padStart(5, '0')}</span></div>
          <div>SCORE: <span className="text-emerald-400">{String(gameState.score).padStart(5, '0')}</span></div>
        </div>
      </div>

      {/* Floating Canvas Box wrapper */}
      <div ref={containerRef} className="w-full bg-slate-100 flex justify-center items-center rounded-xl overflow-hidden shadow-inner border border-slate-300">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
          className="block select-none"
          id="game-canvas-retro"
        />
      </div>

      {/* Canvas Cover Overlays */}
      {gameState.status === 'idle' && (
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex flex-col justify-center items-center z-10 p-6 text-center select-none">
          <div className="bg-slate-900/90 border-2 border-slate-600 rounded-xl max-w-md p-6 shadow-2xl scale-in-center">
            <h3 className="text-xl font-bold font-mono text-amber-400 mb-2">Retro Teachable Run</h3>
            <p className="text-xs text-slate-300 font-sans mb-4 leading-relaxed">
              Launch the endless runner and control it using your standard keyboard or set up your trained Teachable Machine model webcam inputs!
            </p>
            <div className="flex flex-col gap-2.5 mb-5 text-left bg-slate-950/80 p-3 rounded border border-slate-700 font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Keyboard Space / Up: <b>JUMP ACTION</b></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span>Keyboard ArrowDown: <b>CROUCH SLIDE</b></span>
              </div>
            </div>
            <button
              onClick={() => ref && (ref as any).current?.startGame()}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              id="start-running-btn"
            >
              <Play className="w-4 h-4 fill-current" />
              LAUNCH GAME
            </button>
          </div>
        </div>
      )}

      {gameState.status === 'gameover' && (
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs flex flex-col justify-center items-center z-10 p-6 select-none animate-fade-in">
          <div className="bg-slate-900/95 border-2 border-rose-500/50 rounded-xl max-w-sm p-5 text-center shadow-2xl">
            <span className="inline-block px-3 py-1 bg-red-950 text-red-400 border border-red-800 text-xs font-mono rounded-full mb-3 uppercase tracking-wider font-semibold animate-pulse">
              DINO COLLISION
            </span>
            <h4 className="text-2xl font-bold font-mono text-white tracking-widest uppercase mb-1">Crash Lands</h4>
            <p className="text-sm font-semibold font-mono text-emerald-400 mb-4">
              Distance: {Math.floor(gameState.distance)}m | Score: {gameState.score}
            </p>
            <button
              onClick={() => ref && (ref as any).current?.startGame()}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono rounded-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md"
              id="play-again-btn"
            >
              <RotateCcw className="w-4 h-4" />
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Mute and Manual Override Controls */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted(!muted)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 flex items-center gap-1.5 text-xs text-slate-600 font-medium font-mono cursor-pointer transition-colors"
            title={muted ? 'Unmute game sound' : 'Mute game sound'}
            id="toggle-audio-btn"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-slate-600" />}
            <span>SOUND: {muted ? 'OFF' : 'ON'}</span>
          </button>

          {gameState.status === 'running' && (
            <button
              onClick={() => ref && (ref as any).current?.resetGame()}
              className="px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-rose-600 flex items-center gap-1 text-xs font-mono cursor-pointer transition-colors"
              id="force-reset-game-btn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ABORT RUN
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 p-1.5 rounded-lg border border-slate-200 px-3">
          {controlSource === 'keyboard' ? (
            <>
              <Keyboard className="w-3.5 h-3.5 text-slate-600" />
              <span>Input Mode: <b>KEYBOARD OVERRIDE</b></span>
            </>
          ) : (
            <>
              <Radio className="w-3.5 h-4 text-emerald-500 animate-pulse" />
              <span>Input Mode: <b className="text-emerald-600">TEACHABLE WEBCAM</b></span>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

GameCanvas.displayName = 'GameCanvas';
