import { World, Body, Circle, Rectangle, Edge, Vec2 } from './physics2d/index.js';

// --- Constants ---
const CANVAS_W = 1080;
const CANVAS_H = 1920;
const VERSION = 'v1.0.0';

// Field dimensions (in canvas pixels)
const FIELD_TOP = 160;
const FIELD_BOTTOM = 860;
const FIELD_LEFT = 20;
const FIELD_RIGHT = 1060;
const FIELD_H = FIELD_BOTTOM - FIELD_TOP;
const GROUND_Y = FIELD_BOTTOM - 60; // ground line within the field

// Colors
const SKY_COLOR_TOP = '#1a0a2e';
const SKY_COLOR_BOT = '#2a1548';
const FIELD_COLOR = '#4a8c3f';
const GROUND_COLOR = '#3a6e2e';

// Goal dimensions
const GOAL_W = 80;
const GOAL_H = 300;
const GOAL_LEFT_X = FIELD_LEFT;
const GOAL_RIGHT_X = FIELD_RIGHT - GOAL_W;

// Player colors
const CPU_COLOR = '#e74c3c';
const CPU_COLOR_LIGHT = '#ff6b6b';
const HUMAN_COLOR = '#3498db';
const HUMAN_COLOR_LIGHT = '#5dade2';

// Player dimensions
const PLAYER_W = 120;
const PLAYER_H = 280;
const PLAYER_Y = GROUND_Y; // base of player is at ground

// Tilt
const TILT_SPEED = 2.5; // radians per second
const TILT_MAX_ANGLE = 0.45; // max tilt in radians (~26 degrees)

// Jump
const JUMP_FORCE = 1200; // px/s upward component
const JUMP_LATERAL = 600; // px/s lateral component

// Player state
const players = [
  {
    x: FIELD_LEFT + GOAL_W + 180,
    y: PLAYER_Y,
    tiltPhase: 0,
    tiltDirection: 1,
    angle: 0,
    color: CPU_COLOR,
    colorLight: CPU_COLOR_LIGHT,
    isHuman: false,
    isAirborne: false,
    velX: 0,
    velY: 0,
    jumpX: 0,
  },
  {
    x: FIELD_RIGHT - GOAL_W - 180,
    y: PLAYER_Y,
    tiltPhase: 0,
    tiltDirection: -1,
    angle: 0,
    color: HUMAN_COLOR,
    colorLight: HUMAN_COLOR_LIGHT,
    isHuman: true,
    isAirborne: false,
    velX: 0,
    velY: 0,
    jumpX: 0,
  },
];

// Skyline buildings (x, width, height offsets from FIELD_TOP)
const SKYLINE = [
  { x: 60, w: 80, h: 120 },
  { x: 180, w: 50, h: 80 },
  { x: 260, w: 100, h: 140 },
  { x: 400, w: 60, h: 100 },
  { x: 500, w: 90, h: 130 },
  { x: 620, w: 40, h: 70 },
  { x: 700, w: 70, h: 110 },
  { x: 800, w: 55, h: 90 },
  { x: 880, w: 85, h: 125 },
  { x: 990, w: 60, h: 75 },
];

// --- Physics ---
const world = new World({
  gravity: new Vec2(0, 981),
  fixedDt: 1 / 120,
});

// Ball
const BALL_RADIUS = 20;
const ballBody = new Body({
  shape: new Circle(BALL_RADIUS),
  position: new Vec2(CANVAS_W / 2, GROUND_Y - BALL_RADIUS - 5),
  mass: 0.5,
  restitution: 0.6,
  friction: 0.4,
  userData: 'ball',
  linearDamping: 0.3,
});
world.addBody(ballBody);

// Ground
const groundBody = new Body({
  shape: new Edge(new Vec2(-600, 0), new Vec2(600, 0)),
  position: new Vec2(CANVAS_W / 2, GROUND_Y),
  isStatic: true,
  userData: 'ground',
});
world.addBody(groundBody);

// Ceiling
const ceilingBody = new Body({
  shape: new Edge(new Vec2(600, 0), new Vec2(-600, 0)),
  position: new Vec2(CANVAS_W / 2, FIELD_TOP + 20),
  isStatic: true,
  userData: 'ceiling',
});
world.addBody(ceilingBody);

// Left wall (above left goal)
const leftWallBody = new Body({
  shape: new Edge(new Vec2(0, 400), new Vec2(0, -400)),
  position: new Vec2(FIELD_LEFT + GOAL_W, GROUND_Y - GOAL_H - 200),
  isStatic: true,
  userData: 'wall',
});
world.addBody(leftWallBody);

// Right wall (above right goal)
const rightWallBody = new Body({
  shape: new Edge(new Vec2(0, -400), new Vec2(0, 400)),
  position: new Vec2(FIELD_RIGHT - GOAL_W, GROUND_Y - GOAL_H - 200),
  isStatic: true,
  userData: 'wall',
});
world.addBody(rightWallBody);

// Goal back walls
const leftGoalBack = new Body({
  shape: new Edge(new Vec2(0, -200), new Vec2(0, 200)),
  position: new Vec2(FIELD_LEFT + 5, GROUND_Y - GOAL_H / 2),
  isStatic: true,
  userData: 'goalWall',
});
world.addBody(leftGoalBack);

const rightGoalBack = new Body({
  shape: new Edge(new Vec2(0, 200), new Vec2(0, -200)),
  position: new Vec2(FIELD_RIGHT - 5, GROUND_Y - GOAL_H / 2),
  isStatic: true,
  userData: 'goalWall',
});
world.addBody(rightGoalBack);

// Goal crossbars
const leftCrossbar = new Body({
  shape: new Edge(new Vec2(-GOAL_W, 0), new Vec2(0, 0)),
  position: new Vec2(FIELD_LEFT + GOAL_W, GROUND_Y - GOAL_H),
  isStatic: true,
  userData: 'goalWall',
  restitution: 0.5,
});
world.addBody(leftCrossbar);

const rightCrossbar = new Body({
  shape: new Edge(new Vec2(0, 0), new Vec2(GOAL_W, 0)),
  position: new Vec2(FIELD_RIGHT - GOAL_W, GROUND_Y - GOAL_H),
  isStatic: true,
  userData: 'goalWall',
  restitution: 0.5,
});
world.addBody(rightCrossbar);

// Goal sensors
const leftGoalSensor = new Body({
  shape: new Rectangle(GOAL_W - 20, GOAL_H - 20),
  position: new Vec2(FIELD_LEFT + GOAL_W / 2, GROUND_Y - GOAL_H / 2),
  isStatic: true,
  isSensor: true,
  userData: 'goalLeft',
});
world.addBody(leftGoalSensor);

const rightGoalSensor = new Body({
  shape: new Rectangle(GOAL_W - 20, GOAL_H - 20),
  position: new Vec2(FIELD_RIGHT - GOAL_W / 2, GROUND_Y - GOAL_H / 2),
  isStatic: true,
  isSensor: true,
  userData: 'goalRight',
});
world.addBody(rightGoalSensor);

// Player collision bodies
const playerBodies = players.map((p, i) => {
  const body = new Body({
    shape: new Rectangle(PLAYER_W - 20, PLAYER_H - 20),
    position: new Vec2(p.x, p.y - PLAYER_H / 2),
    mass: 50,
    restitution: 0.3,
    friction: 0.2,
    userData: i === 0 ? 'playerCPU' : 'playerHuman',
  });
  world.addBody(body);
  return body;
});

const KICK_STRENGTH = 800;

// AI
const AI_DIFFICULTY = [
  { reactionDelay: 0.8, jumpChance: 0.5, name: 'easy' },
  { reactionDelay: 0.4, jumpChance: 0.75, name: 'medium' },
  { reactionDelay: 0.2, jumpChance: 0.9, name: 'hard' },
];
let aiDecisionCooldown = 0;

world.onCollision = (bodyA, bodyB, contact) => {
  const ball = bodyA.userData === 'ball' ? bodyA : bodyB.userData === 'ball' ? bodyB : null;
  const other = ball === bodyA ? bodyB : bodyA;
  if (!ball) return;

  // Goal detection
  if (other.userData === 'goalLeft') {
    onGoalScored('human');
    return;
  }
  if (other.userData === 'goalRight') {
    onGoalScored('cpu');
    return;
  }

  // Player-ball kick
  if (other.userData === 'playerCPU' || other.userData === 'playerHuman') {
    const kickDirX = other.userData === 'playerCPU' ? 1 : -1;
    const impulse = new Vec2(kickDirX * KICK_STRENGTH, -KICK_STRENGTH * 0.5);
    ball.applyImpulse(impulse);
  }
};

// --- Particles ---
const MAX_PARTICLES = 32;
const particles = [];

function spawnParticle(x, y, color) {
  if (particles.length >= MAX_PARTICLES) particles.shift();
  particles.push({
    x, y,
    size: 4 + Math.random() * 6,
    life: 0.3,
    maxLife: 0.3,
    color,
  });
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].life -= dt;
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

// --- Screen Shake ---
let shakeTimer = 0;
let shakeIntensity = 0;

function triggerShake(intensity, duration) {
  shakeIntensity = intensity;
  shakeTimer = duration;
}

// Game state
let gameState = 'menu';
let scores = [0, 0]; // [CPU, human]
const WIN_SCORE = 5;
let goalFlashTimer = 0;
let lastScorer = '';

// --- Canvas Setup ---
const canvas = document.getElementById('c');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext('2d');

// --- Pointer ---
let canvasRect = canvas.getBoundingClientRect();
let canvasScaleX = canvas.width / canvasRect.width;
window.addEventListener('resize', () => {
  canvasRect = canvas.getBoundingClientRect();
  canvasScaleX = canvas.width / canvasRect.width;
});

// --- Jump ---
function jumpPlayer(p) {
  if (p.isAirborne) return;
  p.isAirborne = true;
  p.jumpX = p.x;
  const lateralDir = Math.sin(p.angle);
  p.velX = lateralDir * JUMP_LATERAL;
  p.velY = -JUMP_FORCE;
}

function updateAI(dt) {
  const cpu = players[0];
  if (cpu.isAirborne) return;

  const humanScore = scores[1];
  const diffIdx = humanScore <= 1 ? 0 : humanScore <= 3 ? 1 : 2;
  const diff = AI_DIFFICULTY[diffIdx];

  aiDecisionCooldown -= dt;
  if (aiDecisionCooldown > 0) return;

  const ballX = ballBody.position.x;
  const ballVelX = ballBody.velocity.x;
  const fieldCenter = CANVAS_W / 2;

  const ballOnMySide = ballX < fieldCenter;
  const ballComingToMe = ballVelX < -50;
  const ballClose = Math.abs(ballX - cpu.x) < 300 && Math.abs(ballBody.position.y - (cpu.y - PLAYER_H / 2)) < PLAYER_H;

  let shouldJump = false;

  if (ballClose) {
    shouldJump = Math.random() < diff.jumpChance;
  } else if (ballComingToMe && ballOnMySide) {
    shouldJump = Math.random() < diff.jumpChance * 0.6;
  }

  if (shouldJump) {
    const tiltDir = Math.sin(cpu.angle);
    const ballDir = ballX > cpu.x ? 1 : -1;
    if (tiltDir * ballDir > -0.2) {
      jumpPlayer(cpu);
      aiDecisionCooldown = diff.reactionDelay;
    }
  }

  if (!shouldJump && aiDecisionCooldown <= -1.5) {
    if (Math.random() < 0.3) {
      jumpPlayer(cpu);
      aiDecisionCooldown = diff.reactionDelay + 0.5;
    }
  }
}

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (gameState === 'menu') {
    scores = [0, 0];
    resetRound();
    gameState = 'playing';
  } else if (gameState === 'playing') {
    jumpPlayer(players[1]);
  } else if (gameState === 'matchOver') {
    scores = [0, 0];
    resetRound();
    gameState = 'playing';
  }
});

// --- Game Loop ---
let lastTime = performance.now();

function loop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

function updatePlayers(dt) {
  for (const p of players) {
    if (p.isAirborne) {
      p.velY += 2500 * dt;
      p.x += p.velX * dt;
      p.y += p.velY * dt;

      if (p.y >= PLAYER_Y) {
        p.y = PLAYER_Y;
        p.isAirborne = false;
        p.velX = 0;
        p.velY = 0;
      }

      const minX = FIELD_LEFT + GOAL_W + PLAYER_W / 2;
      const maxX = FIELD_RIGHT - GOAL_W - PLAYER_W / 2;
      if (p.x < minX) p.x = minX;
      if (p.x > maxX) p.x = maxX;
    } else {
      p.tiltPhase += TILT_SPEED * dt;
      p.angle = Math.sin(p.tiltPhase) * TILT_MAX_ANGLE * p.tiltDirection;
    }
  }

  // Sync physics collision bodies to player visual positions
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const b = playerBodies[i];
    b.setPosition(p.x, p.y - PLAYER_H / 2);
    b.angle = p.angle;
    b.previousAngle = p.angle;
    b.setVelocity(p.velX || 0, p.velY || 0);
  }
}

function onGoalScored(scorer) {
  if (gameState !== 'playing') return;
  if (scorer === 'human') {
    scores[1]++;
  } else {
    scores[0]++;
  }
  lastScorer = scorer;
  goalFlashTimer = 1.5;
  triggerShake(15, 0.3);
  gameState = 'goalScored';
}

function resetRound() {
  ballBody.setPosition(CANVAS_W / 2, GROUND_Y - BALL_RADIUS - 5);
  ballBody.setVelocity(0, 0);
  ballBody.angularVelocity = 0;
  ballBody.wake();

  players[0].x = FIELD_LEFT + GOAL_W + 180;
  players[0].y = PLAYER_Y;
  players[0].tiltPhase = 0;
  players[0].angle = 0;
  players[0].isAirborne = false;
  players[0].velX = 0;
  players[0].velY = 0;

  players[1].x = FIELD_RIGHT - GOAL_W - 180;
  players[1].y = PLAYER_Y;
  players[1].tiltPhase = 0;
  players[1].angle = 0;
  players[1].isAirborne = false;
  players[1].velX = 0;
  players[1].velY = 0;
}

function update(dt) {
  if (gameState === 'playing') {
    updatePlayers(dt);
    updateAI(dt);
    world.step(dt);
    updateParticles(dt);
    const ballSpeed = ballBody.velocity.length();
    if (ballSpeed > 200) {
      spawnParticle(ballBody.position.x, ballBody.position.y, 'white');
    }
  } else if (gameState === 'goalScored') {
    goalFlashTimer -= dt;
    if (goalFlashTimer <= 0) {
      if (scores[0] >= WIN_SCORE || scores[1] >= WIN_SCORE) {
        gameState = 'matchOver';
      } else {
        resetRound();
        gameState = 'playing';
      }
    }
  }
}

function drawGoal(x, isLeft) {
  const goalTop = GROUND_Y - GOAL_H;

  // Goal back (net area)
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(x, goalTop, GOAL_W, GOAL_H);

  // Net lines (vertical)
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  for (let nx = x + 12; nx < x + GOAL_W; nx += 14) {
    ctx.beginPath();
    ctx.moveTo(nx, goalTop + 10);
    ctx.lineTo(nx, GROUND_Y);
    ctx.stroke();
  }

  // Net lines (horizontal)
  for (let ny = goalTop + 20; ny < GROUND_Y; ny += 20) {
    ctx.beginPath();
    ctx.moveTo(x, ny);
    ctx.lineTo(x + GOAL_W, ny);
    ctx.stroke();
  }

  // Goal frame (white posts and crossbar)
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 6;
  ctx.beginPath();
  if (isLeft) {
    ctx.moveTo(x + GOAL_W, GROUND_Y);
    ctx.lineTo(x + GOAL_W, goalTop);
    ctx.lineTo(x, goalTop);
  } else {
    ctx.moveTo(x, GROUND_Y);
    ctx.lineTo(x, goalTop);
    ctx.lineTo(x + GOAL_W, goalTop);
  }
  ctx.stroke();
}

function drawField() {
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, FIELD_TOP);
  skyGrad.addColorStop(0, SKY_COLOR_TOP);
  skyGrad.addColorStop(1, SKY_COLOR_BOT);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_W, FIELD_TOP);

  // City skyline silhouettes
  ctx.fillStyle = 'rgba(30,15,60,0.7)';
  for (const b of SKYLINE) {
    ctx.fillRect(b.x, FIELD_TOP - b.h, b.w, b.h);
  }

  // Fence strip
  ctx.fillStyle = '#8B6914';
  ctx.fillRect(FIELD_LEFT, FIELD_TOP - 12, FIELD_RIGHT - FIELD_LEFT, 12);

  // Field grass with alternating stripe shades
  const stripeW = (FIELD_RIGHT - FIELD_LEFT) / 10;
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#4a8c3f' : '#3e7a35';
    ctx.fillRect(FIELD_LEFT + i * stripeW, FIELD_TOP, stripeW, GROUND_Y - FIELD_TOP);
  }

  // Ground dirt strip at bottom
  ctx.fillStyle = GROUND_COLOR;
  ctx.fillRect(FIELD_LEFT, GROUND_Y, FIELD_RIGHT - FIELD_LEFT, FIELD_BOTTOM - GROUND_Y);

  // Ground line
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(FIELD_LEFT, GROUND_Y);
  ctx.lineTo(FIELD_RIGHT, GROUND_Y);
  ctx.stroke();

  // Goals
  drawGoal(GOAL_LEFT_X, true);
  drawGoal(GOAL_RIGHT_X, false);

  // Tap zone area below field (dark background)
  ctx.fillStyle = '#12082a';
  ctx.fillRect(0, FIELD_BOTTOM, CANVAS_W, CANVAS_H - FIELD_BOTTOM);

  // "TAP TO JUMP" text (only during gameplay)
  if (gameState === 'playing' || gameState === 'goalScored') {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TAP TO JUMP', CANVAS_W / 2, FIELD_BOTTOM + 120);
  }

  // Version string (only during gameplay — menu draws its own)
  if (gameState !== 'menu') {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(VERSION, CANVAS_W / 2, CANVAS_H - 20);
  }
}

function drawPlayer(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);

  const hw = PLAYER_W / 2;
  const hh = PLAYER_H;

  // Main body
  ctx.fillStyle = p.color;
  ctx.fillRect(-hw, -hh, PLAYER_W, PLAYER_H);

  // Rounded top
  ctx.fillRect(-hw + 8, -hh - 16, PLAYER_W - 16, 16);
  ctx.fillRect(-hw + 20, -hh - 28, PLAYER_W - 40, 12);

  // Lighter highlight
  ctx.fillStyle = p.colorLight;
  ctx.fillRect(-hw + 10, -hh + 10, PLAYER_W / 3, PLAYER_H - 40);

  // Head area
  ctx.fillStyle = '#f5c6a0';
  ctx.fillRect(-hw + 16, -hh - 8, PLAYER_W - 32, 60);

  // Eyes
  ctx.fillStyle = '#333';
  ctx.fillRect(-hw + 28, -hh + 12, 14, 18);
  ctx.fillRect(-hw + PLAYER_W - 42, -hh + 12, 14, 18);

  // Eye whites
  ctx.fillStyle = 'white';
  ctx.fillRect(-hw + 30, -hh + 14, 10, 12);
  ctx.fillRect(-hw + PLAYER_W - 40, -hh + 14, 10, 12);

  // Pupils
  ctx.fillStyle = '#333';
  ctx.fillRect(-hw + 34, -hh + 18, 5, 6);
  ctx.fillRect(-hw + PLAYER_W - 36, -hh + 18, 5, 6);

  ctx.restore();
}

function drawBall() {
  const bx = ballBody.renderPosition.x;
  const by = ballBody.renderPosition.y;
  const r = BALL_RADIUS;

  ctx.fillStyle = 'white';
  ctx.fillRect(bx - r, by - r, r * 2, r * 2);

  ctx.fillStyle = '#333';
  ctx.fillRect(bx - 6, by - 6, 12, 12);

  ctx.strokeStyle = '#999';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx - r, by - r, r * 2, r * 2);
}

function drawHUD() {
  // CPU score (left)
  ctx.fillStyle = CPU_COLOR;
  ctx.font = 'bold 80px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(scores[0], 60, 110);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '28px monospace';
  ctx.fillText('CPU', 160, 110);

  // Human score (right)
  ctx.fillStyle = HUMAN_COLOR;
  ctx.font = 'bold 80px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(scores[1], CANVAS_W - 60, 110);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '28px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('YOU', CANVAS_W - 160, 110);

  // Center label
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('FIRST TO 5', CANVAS_W / 2, 100);

  // Goal flash overlay
  if (gameState === 'goalScored' && goalFlashTimer > 0) {
    const alpha = Math.min(1, goalFlashTimer * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.3})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.font = 'bold 120px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GOAL!', CANVAS_W / 2, CANVAS_H / 2);
  }
}

function drawMenu() {
  // Title below the field
  ctx.fillStyle = 'white';
  ctx.font = 'bold 100px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SOCCER', CANVAS_W / 2, FIELD_BOTTOM + 160);
  ctx.fillText('JUMP', CANVAS_W / 2, FIELD_BOTTOM + 280);

  // Pulsing tap prompt
  const pulse = Math.sin(performance.now() / 500) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(255,255,255,${pulse * 0.6})`;
  ctx.font = '36px monospace';
  ctx.fillText('TAP TO PLAY', CANVAS_W / 2, FIELD_BOTTOM + 420);

  // Version
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '24px monospace';
  ctx.fillText(VERSION, CANVAS_W / 2, CANVAS_H - 40);
}

function drawMatchOver() {
  const humanWon = scores[1] >= WIN_SCORE;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = humanWon ? '#4dabf7' : '#e74c3c';
  ctx.font = 'bold 100px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(humanWon ? 'YOU WIN!' : 'YOU LOSE', CANVAS_W / 2, CANVAS_H / 2 - 60);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 64px monospace';
  ctx.fillText(`${scores[0]} - ${scores[1]}`, CANVAS_W / 2, CANVAS_H / 2 + 40);

  const pulse = Math.sin(performance.now() / 500) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(255,255,255,${pulse * 0.6})`;
  ctx.font = '36px monospace';
  ctx.fillText('TAP TO PLAY AGAIN', CANVAS_W / 2, CANVAS_H / 2 + 140);
}

function draw() {
  if (shakeTimer > 0) {
    shakeTimer -= 1 / 60;
    const sx = (Math.random() - 0.5) * shakeIntensity * 2;
    const sy = (Math.random() - 0.5) * shakeIntensity * 2;
    ctx.save();
    ctx.translate(sx, sy);
  }

  drawField();

  if (gameState === 'menu') {
    drawMenu();
  } else if (gameState === 'playing' || gameState === 'goalScored') {
    drawPlayer(players[0]);
    drawPlayer(players[1]);
    drawBall();
    drawParticles();
    drawHUD();
  } else if (gameState === 'matchOver') {
    drawPlayer(players[0]);
    drawPlayer(players[1]);
    drawBall();
    drawParticles();
    drawHUD();
    drawMatchOver();
  }

  if (shakeTimer > 0) {
    ctx.restore();
  }
}

requestAnimationFrame(loop);
