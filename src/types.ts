export interface GameConfig {
  gravity: number;
  jumpForce: number;
  baseSpeed: number;
  speedIncrement: number; // Speed increase over distance
  maxSpeed: number;
}

export interface PlayerState {
  y: number;
  vy: number;
  isJumping: boolean;
  isCrouching: boolean;
  score: number;
  highScore: number;
  distance: number;
  coins: number;
  status: 'idle' | 'running' | 'gameover';
}

export type ObstacleType = 'cactus_small' | 'cactus_large' | 'cactus_double' | 'bird_high' | 'bird_low' | 'coin';

export interface GameObstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  passed: boolean;
  frame: number; // for animated obstacles like bird
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  lifetime: number;
  maxLifetime: number;
}

export interface Cloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
}

export type GameAction = 'jump' | 'crouch' | 'neutral';

export interface ClassMapping {
  className: string;
  action: GameAction;
  threshold: number; // Confidence threshold (0.0 to 1.0)
}

export interface PredictionResult {
  className: string;
  probability: number;
}

export interface TMModelInfo {
  url: string;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  classes: string[];
}
