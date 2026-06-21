import React, { useEffect, useRef, useState, useCallback } from 'react';

// Constants
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const GRAVITY = 1.2;
const FLIP_FORCE = 25;
const GAME_SPEED_START = 8;
const MAX_FALL_SPEED = 30;

// Types
type GameState = {
  player: { x: number, y: number, velocity: number, isFlipped: boolean, size: number };
  obstacles: Array<{ x: number, topHeight: number, bottomY: number, width: number, passed: boolean }>;
  particles: Array<{ x: number, y: number, vx: number, vy: number, life: number, color: string, size: number }>;
  score: number;
  speed: number;
  isGameOver: boolean;
  frames: number;
  isAutoPlay: boolean;
};

const createInitialState = (autoPlay: boolean = false): GameState => ({
  player: { x: 300, y: CANVAS_HEIGHT / 2, velocity: 0, isFlipped: false, size: 60 },
  obstacles: [],
  particles: [],
  score: 0,
  speed: GAME_SPEED_START,
  isGameOver: false,
  frames: 0,
  isAutoPlay: autoPlay,
});

const GamePage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // UI State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  // Mutable Game State
  const gameState = useRef<GameState>(createInitialState(isAutoPlay));
  const requestRef = useRef<number>();
  
  // Recording State
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Sound Engine
  const playSound = useCallback((type: 'flip' | 'score' | 'crash') => {
    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'flip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'score') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      }
    } catch (e) {
      console.warn('Audio not supported or disabled', e);
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!canvasRef.current) return;
    recordedChunksRef.current = [];
    const stream = canvasRef.current.captureStream(60); // 60 FPS
    
    // Add audio track if possible
    try {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const dest = audioCtx.createMediaStreamDestination();
      stream.addTrack(dest.stream.getAudioTracks()[0]);
    } catch { 
      /* empty */ 
    }

    const options = { mimeType: 'video/webm;codecs=vp9' };
    const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedVideoUrl(url);
    };
    
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordedVideoUrl(null);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  // Controls
  const flipGravity = useCallback(() => {
    if (gameState.current.isGameOver) return;
    const p = gameState.current.player;
    p.isFlipped = !p.isFlipped;
    p.velocity = p.isFlipped ? -FLIP_FORCE : FLIP_FORCE;
    playSound('flip');
    
    for(let i=0; i<10; i++) {
      gameState.current.particles.push({
        x: p.x, y: p.isFlipped ? p.y : p.y + p.size,
        vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
        life: 1.0, color: '#00ffff', size: Math.random() * 8 + 4
      });
    }
  }, [playSound]);

  const handleInput = useCallback((e?: KeyboardEvent | React.TouchEvent | React.MouseEvent) => {
    if (e && e.type === 'keydown' && (e as KeyboardEvent).code !== 'Space') return;
    if (e && e.type !== 'keydown') e.preventDefault();

    if (!isPlaying) {
      if (isGameOver) {
        gameState.current = createInitialState(isAutoPlay);
        setIsGameOver(false);
        setScore(0);
      }
      setIsPlaying(true);
      startRecording();
      return;
    }
    
    // Don't allow manual flip if auto-play is strictly controlling
    if (!isAutoPlay) flipGravity();
  }, [isPlaying, isGameOver, isAutoPlay, flipGravity, startRecording]);

  // AI Bot Logic
  const runAutoPlay = useCallback(() => {
    const state = gameState.current;
    if (!state.isAutoPlay) return;
    
    const p = state.player;
    // Find next obstacle
    const nextObs = state.obstacles.find(o => o.x + o.width > p.x);
    if (!nextObs) return;

    const safeCenterY = nextObs.topHeight + ((nextObs.bottomY - nextObs.topHeight) / 2);
    
    // Simple AI: If we are far from the center, flip to head towards it
    if (p.y + p.size/2 > safeCenterY + 50 && !p.isFlipped) {
      flipGravity();
    } else if (p.y + p.size/2 < safeCenterY - 50 && p.isFlipped) {
      flipGravity();
    }
  }, [flipGravity]);

  // Game Loop Update
  const update = useCallback(() => {
    const state = gameState.current;
    if (state.isGameOver) return;

    state.frames++;
    runAutoPlay();

    // Player physics
    const p = state.player;
    p.velocity += p.isFlipped ? -GRAVITY : GRAVITY;
    if (p.velocity > MAX_FALL_SPEED) p.velocity = MAX_FALL_SPEED;
    if (p.velocity < -MAX_FALL_SPEED) p.velocity = -MAX_FALL_SPEED;
    p.y += p.velocity;

    if (p.y <= 0) { p.y = 0; p.velocity = 0; }
    if (p.y + p.size >= CANVAS_HEIGHT) { p.y = CANVAS_HEIGHT - p.size; p.velocity = 0; }

    // Obstacles
    if (state.frames % Math.max(50, Math.floor(100 - state.speed * 2)) === 0) {
      const gap = Math.max(300, 450 - (state.speed * 4)); 
      const minHeight = 200;
      const maxHeight = CANVAS_HEIGHT - minHeight - gap;
      const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
      
      state.obstacles.push({
        x: CANVAS_WIDTH, width: 140, topHeight, bottomY: topHeight + gap, passed: false
      });
    }

    state.obstacles.forEach((obs) => {
      obs.x -= state.speed;

      // Collision
      if (p.x < obs.x + obs.width && p.x + p.size > obs.x) {
        if (p.y < obs.topHeight || p.y + p.size > obs.bottomY) {
          state.isGameOver = true;
        }
      }

      // Score
      if (obs.x + obs.width < p.x && !obs.passed) {
        obs.passed = true;
        state.score++;
        setScore(state.score);
        state.speed += 0.15; 
        playSound('score');
      }
    });

    state.obstacles = state.obstacles.filter(obs => obs.x + obs.width > 0);

    // Particles
    state.particles.forEach(pt => {
      pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.02;
    });
    state.particles = state.particles.filter(pt => pt.life > 0);

    if (state.isGameOver) {
      setIsPlaying(false);
      setIsGameOver(true);
      setHighScore(prev => Math.max(prev, state.score));
      playSound('crash');
      stopRecording();
      
      for(let i=0; i<40; i++) {
        state.particles.push({
          x: p.x + p.size/2, y: p.y + p.size/2,
          vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40,
          life: 1.0, color: '#ff0055', size: Math.random() * 15 + 5
        });
      }

      if (state.isAutoPlay) {
        setTimeout(() => handleInput(), 1000); // Auto-restart
      }
    }
  }, [runAutoPlay, playSound, stopRecording, handleInput]);

  // Game Loop Draw
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const state = gameState.current;

    ctx.fillStyle = '#0f0f1b'; 
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 3;
    const offset = (state.frames * state.speed * 0.5) % 150;
    for(let i = -offset; i < CANVAS_WIDTH; i += 150) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
    }

    state.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.life;
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
    });
    ctx.globalAlpha = 1.0;

    state.obstacles.forEach(obs => {
      ctx.fillStyle = '#00ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 20;
      ctx.fillRect(obs.x, 0, obs.width, obs.topHeight);
      ctx.fillRect(obs.x - 15, obs.topHeight - 30, obs.width + 30, 30); 
      
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.fillRect(obs.x, obs.bottomY, obs.width, CANVAS_HEIGHT - obs.bottomY);
      ctx.fillRect(obs.x - 15, obs.bottomY, obs.width + 30, 30); 
    });

    const p = state.player;
    if (!state.isGameOver) {
      ctx.shadowBlur = 30;
      ctx.shadowColor = p.isFlipped ? '#ff0055' : '#00ffff';
      ctx.fillStyle = '#ffffff';
      
      ctx.save();
      ctx.translate(p.x + p.size/2, p.y + p.size/2);
      ctx.rotate(p.velocity * 0.02);
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      
      ctx.fillStyle = p.isFlipped ? '#ff0055' : '#00ffff';
      ctx.fillRect(-p.size/2 + 12, -p.size/2 + 12, p.size - 24, p.size - 24);
      ctx.restore();
    }
    
    ctx.shadowBlur = 0;

    // Draw Score directly on Canvas for Recording Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 150);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE: ${state.score}`, CANVAS_WIDTH / 2, 100);
    
    // Watermark
    ctx.font = 'bold 40px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillText('Gravity Flip: Sky Escape', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);

  }, []);

  const tickRef = useRef<() => void>(() => {});
  
  tickRef.current = () => {
    if (isPlaying || isGameOver) update(); // Keep drawing particles on game over
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx);
    }
    
    requestRef.current = requestAnimationFrame(() => tickRef.current());
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(() => tickRef.current());
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleInput as unknown as EventListener);
    return () => window.removeEventListener('keydown', handleInput as unknown as EventListener);
  }, [handleInput]);

  useEffect(() => {
    gameState.current.isAutoPlay = isAutoPlay;
  }, [isAutoPlay]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8 h-[calc(100vh-4rem)]">
      
      {/* Game Canvas Container */}
      <div className="relative flex-1 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onMouseDown={handleInput}
          onTouchStart={handleInput}
          className="block h-full max-h-[85vh] cursor-pointer bg-black"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{ aspectRatio: '9/16', objectFit: 'contain' }}
        />

        {/* Start / Game Over Overlay (Not captured in canvas recording, UI only) */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none">
            <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 mb-2 drop-shadow-lg">
              {isGameOver ? 'GAME OVER' : 'GRAVITY FLIP'}
            </h2>
            <p className="text-gray-300 text-lg md:text-xl mb-12">
              {isGameOver ? `Final Score: ${score}` : 'Tap or Spacebar to Flip Gravity'}
            </p>
            <button 
              onClick={(e) => { e.stopPropagation(); handleInput(); }}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-full font-bold text-xl shadow-[0_0_30px_rgba(0,255,255,0.5)] transition-all hover:scale-105 pointer-events-auto"
            >
              {isGameOver ? 'PLAY AGAIN' : 'START GAME'}
            </button>
          </div>
        )}
        
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/20 text-red-500 px-3 py-1 rounded-full border border-red-500 animate-pulse">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="font-bold text-sm">REC</span>
          </div>
        )}
      </div>

      {/* Sidebar Controls */}
      <div className="w-full md:w-80 flex flex-col gap-6">
        <div className="bg-gray-800/80 p-6 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Shorts Generator</h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 text-white cursor-pointer group">
              <div className={`w-12 h-6 rounded-full transition-colors relative ${isAutoPlay ? 'bg-cyan-500' : 'bg-gray-600'}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${isAutoPlay ? 'translate-x-6' : ''}`} />
              </div>
              <input type="checkbox" className="hidden" checked={isAutoPlay} onChange={(e) => setIsAutoPlay(e.target.checked)} />
              <span className="font-medium group-hover:text-cyan-400 transition-colors">AI Auto-Play</span>
            </label>
            <p className="text-sm text-gray-400">
              When enabled, the AI will perfectly play the game and automatically restart upon death, ideal for generating long endless clips.
            </p>
          </div>
        </div>

        {recordedVideoUrl && !isPlaying && (
          <div className="bg-green-900/20 p-6 rounded-xl border border-green-500/30">
            <h3 className="text-xl font-bold text-green-400 mb-2">Shorts Ready!</h3>
            <p className="text-sm text-gray-300 mb-4">Your last run was successfully recorded in 9:16 format.</p>
            <a 
              href={recordedVideoUrl} 
              download={`GravityFlip_Shorts_${score}pts.webm`}
              className="block w-full text-center px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors"
            >
              Download Video
            </a>
          </div>
        )}

        <div className="bg-gray-800/80 p-6 rounded-xl border border-gray-700 flex-1">
          <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Stats</h3>
          <div className="text-white text-3xl font-mono mb-1">SCORE: {score}</div>
          <div className="text-cyan-400 text-xl font-mono mb-4">HIGH: {highScore}</div>
        </div>
      </div>

    </div>
  );
};

export default GamePage;