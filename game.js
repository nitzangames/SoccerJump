import { World, Body, Circle, Rectangle, Edge, Vec2 } from './physics2d/index.js';

// --- Constants ---
const CANVAS_W = 1080;
const CANVAS_H = 1920;
const VERSION = 'v1.2.0';

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
const PLAYER_W = 60;
const PLAYER_H = 140;
const PLAYER_Y = GROUND_Y; // base of player is at ground

// Tilt
const TILT_SPEED = 3.125; // radians per second
const TILT_MAX_ANGLE = 0.45; // max tilt in radians (~26 degrees)

// Jump
const JUMP_FORCE = 1200; // px/s upward component
const JUMP_LATERAL = 600; // px/s lateral component

// Ball
const BALL_MAX_SPEED = 1200; // px/s

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

// Ground (extends into both goals so ball can roll in)
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

// Left wall (above left goal — only above the crossbar)
const wallTopY = FIELD_TOP + 20;
const crossbarY = GROUND_Y - GOAL_H;
const wallAboveGoalH = (crossbarY - wallTopY) / 2;
const leftWallBody = new Body({
  shape: new Edge(new Vec2(0, wallAboveGoalH), new Vec2(0, -wallAboveGoalH)),
  position: new Vec2(FIELD_LEFT + GOAL_W, wallTopY + wallAboveGoalH),
  isStatic: true,
  userData: 'wall',
});
world.addBody(leftWallBody);

// Right wall (above right goal — only above the crossbar)
const rightWallBody = new Body({
  shape: new Edge(new Vec2(0, -wallAboveGoalH), new Vec2(0, wallAboveGoalH)),
  position: new Vec2(FIELD_RIGHT - GOAL_W, wallTopY + wallAboveGoalH),
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
  { reactionDelay: 0.6, jumpChance: 0.6, waitForAngle: false, name: 'easy' },
  { reactionDelay: 0.3, jumpChance: 0.85, waitForAngle: true, name: 'medium' },
  { reactionDelay: 0.15, jumpChance: 0.95, waitForAngle: true, name: 'hard' },
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
let scores = [0, 0]; // [left, right] = [CPU/remote, human/local]
const WIN_SCORE = 5;
let goalFlashTimer = 0;
let lastScorer = '';

// Multiplayer state
let gameMode = 'cpu'; // 'cpu' or 'multiplayer'
let mpIsHost = false;
let mpRoom = null;
let mpOpponentId = null;
let mpLastSendTime = 0;
const MP_SEND_INTERVAL = 1 / 30; // 30 Hz state updates
let mpRemoteJumpPending = false; // joiner sets this; host reads it next update

// Local player index: host controls right/blue (index 1), joiner controls left/red (index 0)
function getLocalPlayerIdx() {
  if (gameMode !== 'multiplayer') return 1;
  return mpIsHost ? 1 : 0;
}

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
  const human = players[1];
  if (cpu.isAirborne) return;

  const humanScore = scores[1];
  const diffIdx = humanScore <= 1 ? 0 : humanScore <= 3 ? 1 : 2;
  const diff = AI_DIFFICULTY[diffIdx];

  aiDecisionCooldown -= dt;
  if (aiDecisionCooldown > 0) return;

  const ballX = ballBody.position.x;
  const ballY = ballBody.position.y;
  const ballVelX = ballBody.velocity.x;
  const ballVelY = ballBody.velocity.y;
  const fieldCenter = CANVAS_W / 2;
  const myGoalX = FIELD_LEFT + GOAL_W;

  // Predict where the ball will be in ~0.5s
  const predictX = ballX + ballVelX * 0.5;

  const ballOnMySide = ballX < fieldCenter;
  const ballComingToMe = ballVelX < -30;
  const distToBall = Math.abs(ballX - cpu.x);
  const ballClose = distToBall < 250;
  const ballVeryClose = distToBall < 150;

  // Key insight: if the human is airborne and ball is still on the ground,
  // DON'T jump — stay grounded to block/kick when they land
  const humanAirborne = human.isAirborne;
  const ballOnGround = ballY > GROUND_Y - BALL_RADIUS - 30;
  const ballStationary = Math.abs(ballVelX) < 100 && Math.abs(ballVelY) < 100;
  const shouldStayGrounded = humanAirborne && ballOnGround && !ballComingToMe;

  // Urgency: higher when ball is near our goal
  const goalDanger = ballX < myGoalX + 200 && ballComingToMe;

  let shouldJump = false;
  let urgency = 0;

  if (goalDanger) {
    // Ball heading toward my goal — always defend regardless
    shouldJump = true;
    urgency = 1.0;
  } else if (shouldStayGrounded) {
    // Human is in the air — wait on the ground to counter
    shouldJump = false;
    aiDecisionCooldown = 0.1; // check again soon
  } else if (ballVeryClose && !ballStationary) {
    // Ball moving near me — kick it
    shouldJump = Math.random() < diff.jumpChance;
    urgency = 0.8;
  } else if (ballVeryClose && ballStationary) {
    // Ball sitting still near me — good time to kick it toward their goal
    shouldJump = Math.random() < diff.jumpChance * 0.9;
    urgency = 0.7;
  } else if (ballClose && ballOnMySide) {
    // Ball nearby on my side — go for it
    shouldJump = Math.random() < diff.jumpChance * 0.7;
    urgency = 0.6;
  } else if (ballComingToMe) {
    // Ball heading toward me — wait for it to get closer before jumping
    if (distToBall < 350) {
      shouldJump = Math.random() < diff.jumpChance * 0.6;
      urgency = 0.4;
    }
  } else if (!ballOnMySide && distToBall < 400) {
    // Ball on opponent's side but reachable — only attack sometimes
    shouldJump = Math.random() < diff.jumpChance * 0.25;
    urgency = 0.2;
  }

  if (shouldJump) {
    const tiltAngle = cpu.angle;
    const tiltDir = Math.sin(tiltAngle);

    // Where do we want to go? Toward the ball
    const wantDir = ballX > cpu.x ? 1 : -1;

    if (diff.waitForAngle) {
      const alignment = tiltDir * wantDir;

      if (alignment > 0.15) {
        jumpPlayer(cpu);
        aiDecisionCooldown = diff.reactionDelay;
      } else if (urgency >= 0.8 && alignment > -0.1) {
        jumpPlayer(cpu);
        aiDecisionCooldown = diff.reactionDelay;
      }
    } else {
      if (tiltDir * wantDir > -0.3) {
        jumpPlayer(cpu);
        aiDecisionCooldown = diff.reactionDelay;
      }
    }
  }

  // Idle jump: if nothing has happened for a while, jump to stay active
  if (!shouldJump && aiDecisionCooldown <= -2.5) {
    if (Math.random() < 0.15) {
      jumpPlayer(cpu);
      aiDecisionCooldown = diff.reactionDelay + 0.5;
    }
  }
}

function screenToCanvas(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width;
  const sy = canvas.height / rect.height;
  return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
}

// Menu button rects (y coords relative to canvas)
function getMenuButtons() {
  const y1 = FIELD_BOTTOM + 400;
  const y2 = FIELD_BOTTOM + 560;
  return {
    vsCpu:    { x: CANVAS_W / 2 - 280, y: y1 - 60, w: 560, h: 100 },
    vsPlayer: { x: CANVAS_W / 2 - 280, y: y2 - 60, w: 560, h: 100 },
  };
}

function pointInRect(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const p = screenToCanvas(e.clientX, e.clientY);

  if (gameState === 'menu') {
    const btns = getMenuButtons();
    if (pointInRect(p, btns.vsCpu)) {
      gameMode = 'cpu';
      scores = [0, 0];
      resetRound();
      gameState = 'playing';
    } else if (pointInRect(p, btns.vsPlayer)) {
      startMultiplayer();
    }
  } else if (gameState === 'playing') {
    if (gameMode === 'multiplayer' && !mpIsHost) {
      // Joiner: send jump input to host, don't jump locally
      if (mpRoom) mpRoom.send({ jump: true });
    } else {
      // Single player or host: jump the local player
      jumpPlayer(players[getLocalPlayerIdx()]);
    }
  } else if (gameState === 'matchOver') {
    if (gameMode === 'multiplayer') {
      // Return to menu; don't auto-restart in multiplayer
      leaveMultiplayer();
      gameState = 'menu';
    } else {
      scores = [0, 0];
      resetRound();
      gameState = 'playing';
    }
  }
});

// --- Multiplayer ---
function startMultiplayer() {
  if (typeof window.PlaySDK === 'undefined' || !window.PlaySDK.multiplayer) {
    console.warn('PlaySDK.multiplayer not available');
    return;
  }

  window.PlaySDK.onReady(() => {
    window.PlaySDK.multiplayer.showLobby({
      maxPlayers: 2,
      onStart: () => {
        const room = window.PlaySDK.multiplayer.getRoom();
        if (!room) return;
        mpRoom = room;
        mpIsHost = room.isHost;
        mpOpponentId = room.players.find(pl => pl.userId !== room.players.find(x => x.userId === room.hostId || !x.userId).userId)?.userId || null;
        // Simpler: opponent = any player that isn't us
        const myId = room.players.find(pl => room.isHost ? pl.userId === room.hostId : pl.userId !== room.hostId)?.userId;
        mpOpponentId = room.players.find(pl => pl.userId !== myId)?.userId || null;

        gameMode = 'multiplayer';
        scores = [0, 0];
        resetRound();
        gameState = 'playing';
      },
      onCancel: () => {
        leaveMultiplayer();
      },
    });

    // Register event listeners (only once)
    if (!window._soccerJumpMpWired) {
      window._soccerJumpMpWired = true;

      window.PlaySDK.multiplayer.on('game', (fromUserId, payload) => {
        if (gameMode !== 'multiplayer') return;

        if (mpIsHost) {
          // Host receives only jump events from joiner
          if (payload && payload.jump) {
            mpRemoteJumpPending = true;
          }
        } else {
          // Joiner receives full game state from host
          if (payload && payload.s) applyHostState(payload);
        }
      });

      window.PlaySDK.multiplayer.on('playerLeft', () => {
        if (gameMode === 'multiplayer') {
          // Opponent left — end match
          leaveMultiplayer();
          gameState = 'menu';
        }
      });

      window.PlaySDK.multiplayer.on('disconnected', () => {
        if (gameMode === 'multiplayer') {
          leaveMultiplayer();
          gameState = 'menu';
        }
      });
    }
  });
}

function leaveMultiplayer() {
  if (mpRoom) {
    try { mpRoom.leave(); } catch (e) {}
  }
  mpRoom = null;
  mpIsHost = false;
  mpOpponentId = null;
  mpRemoteJumpPending = false;
  gameMode = 'cpu';
}

// Host broadcasts full game state to joiner
function sendHostState() {
  if (!mpRoom) return;
  mpRoom.send({
    s: 1, // marker for "host state packet"
    ball: {
      x: ballBody.position.x,
      y: ballBody.position.y,
      vx: ballBody.velocity.x,
      vy: ballBody.velocity.y,
    },
    p0: {
      x: players[0].x, y: players[0].y,
      angle: players[0].angle,
      isAirborne: players[0].isAirborne,
      tiltPhase: players[0].tiltPhase,
    },
    p1: {
      x: players[1].x, y: players[1].y,
      angle: players[1].angle,
      isAirborne: players[1].isAirborne,
      tiltPhase: players[1].tiltPhase,
    },
    scores: [scores[0], scores[1]],
    gs: gameState,
    gf: goalFlashTimer,
  });
}

// Joiner applies host state
function applyHostState(msg) {
  ballBody.setPosition(msg.ball.x, msg.ball.y);
  ballBody.setVelocity(msg.ball.vx, msg.ball.vy);

  players[0].x = msg.p0.x;
  players[0].y = msg.p0.y;
  players[0].angle = msg.p0.angle;
  players[0].isAirborne = msg.p0.isAirborne;
  players[0].tiltPhase = msg.p0.tiltPhase;

  players[1].x = msg.p1.x;
  players[1].y = msg.p1.y;
  players[1].angle = msg.p1.angle;
  players[1].isAirborne = msg.p1.isAirborne;
  players[1].tiltPhase = msg.p1.tiltPhase;

  scores[0] = msg.scores[0];
  scores[1] = msg.scores[1];
  goalFlashTimer = msg.gf;

  // Only update gameState on meaningful transitions
  if (msg.gs === 'goalScored' && gameState === 'playing') {
    gameState = 'goalScored';
    triggerShake(15, 0.3);
  } else if (msg.gs === 'matchOver') {
    gameState = 'matchOver';
  } else if (msg.gs === 'playing') {
    gameState = 'playing';
  }
}

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
  // Joiner in multiplayer mode: no local simulation, state comes from host
  if (gameMode === 'multiplayer' && !mpIsHost) {
    updateParticles(dt);
    if (gameState === 'playing' || gameState === 'goalScored') {
      if (ballBody.velocity.length() > 200) {
        spawnParticle(ballBody.position.x, ballBody.position.y, 'white');
      }
    }
    if (gameState === 'goalScored') {
      goalFlashTimer -= dt;
    }
    return;
  }

  // Host or single-player
  if (gameState === 'playing') {
    // Apply remote jump for the left/red player if multiplayer host
    if (gameMode === 'multiplayer' && mpIsHost && mpRemoteJumpPending) {
      jumpPlayer(players[0]);
      mpRemoteJumpPending = false;
    }

    updatePlayers(dt);

    // AI only runs in CPU mode
    if (gameMode === 'cpu') {
      updateAI(dt);
    }

    world.step(dt);
    updateParticles(dt);

    // Clamp ball speed
    const ballSpeed = ballBody.velocity.length();
    if (ballSpeed > BALL_MAX_SPEED) {
      const scale = BALL_MAX_SPEED / ballSpeed;
      ballBody.velocity.x *= scale;
      ballBody.velocity.y *= scale;
    }

    // Ball out of bounds — reset round
    const bx = ballBody.position.x;
    const by = ballBody.position.y;
    if (bx < -50 || bx > CANVAS_W + 50 || by < -50 || by > CANVAS_H + 50) {
      resetRound();
    }

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

  // Host broadcasts state periodically
  if (gameMode === 'multiplayer' && mpIsHost && mpRoom) {
    mpLastSendTime += dt;
    if (mpLastSendTime >= MP_SEND_INTERVAL) {
      mpLastSendTime = 0;
      sendHostState();
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
  ctx.fillRect(-hw + 4, -hh - 8, PLAYER_W - 8, 8);
  ctx.fillRect(-hw + 10, -hh - 14, PLAYER_W - 20, 6);

  // Lighter highlight
  ctx.fillStyle = p.colorLight;
  ctx.fillRect(-hw + 5, -hh + 5, PLAYER_W / 3, PLAYER_H - 20);

  // Head area
  ctx.fillStyle = '#f5c6a0';
  ctx.fillRect(-hw + 8, -hh - 4, PLAYER_W - 16, 30);

  // Eyes
  ctx.fillStyle = '#333';
  ctx.fillRect(-hw + 14, -hh + 6, 7, 9);
  ctx.fillRect(-hw + PLAYER_W - 21, -hh + 6, 7, 9);

  // Eye whites
  ctx.fillStyle = 'white';
  ctx.fillRect(-hw + 15, -hh + 7, 5, 6);
  ctx.fillRect(-hw + PLAYER_W - 20, -hh + 7, 5, 6);

  ctx.restore();
}

// Pre-render pixelated ball to offscreen canvas
const ballCanvas = document.createElement('canvas');
const ballSize = BALL_RADIUS * 2 + 4;
ballCanvas.width = ballSize;
ballCanvas.height = ballSize;
const ballCtx = ballCanvas.getContext('2d');
(() => {
  const cx = ballSize / 2;
  const cy = ballSize / 2;
  const r = BALL_RADIUS;
  const px = 4; // pixel size

  // Draw circle filled with white "pixels"
  for (let y = -r; y <= r; y += px) {
    for (let x = -r; x <= r; x += px) {
      if (x * x + y * y <= r * r) {
        ballCtx.fillStyle = 'white';
        ballCtx.fillRect(cx + x, cy + y, px, px);
      }
    }
  }

  // Dark pentagon pattern in center
  for (let y = -6; y <= 4; y += px) {
    for (let x = -6; x <= 4; x += px) {
      if (x * x + y * y <= 36) {
        ballCtx.fillStyle = '#333';
        ballCtx.fillRect(cx + x, cy + y, px, px);
      }
    }
  }

  // Outline: slightly darker pixels around the edge
  for (let y = -r; y <= r; y += px) {
    for (let x = -r; x <= r; x += px) {
      const distSq = x * x + y * y;
      if (distSq <= r * r && distSq > (r - px) * (r - px)) {
        ballCtx.fillStyle = '#ccc';
        ballCtx.fillRect(cx + x, cy + y, px, px);
      }
    }
  }
})();

function drawBall() {
  const bx = ballBody.renderPosition.x;
  const by = ballBody.renderPosition.y;
  ctx.drawImage(ballCanvas, bx - ballSize / 2, by - ballSize / 2);
}

function drawHUD() {
  // CPU score (left)
  ctx.fillStyle = CPU_COLOR;
  ctx.font = 'bold 80px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(scores[0], 60, 110);

  // Labels differ based on game mode and local player side
  const localIdx = getLocalPlayerIdx();
  const leftLabel = gameMode === 'multiplayer' ? (localIdx === 0 ? 'YOU' : 'OPP') : 'CPU';
  const rightLabel = gameMode === 'multiplayer' ? (localIdx === 1 ? 'YOU' : 'OPP') : 'YOU';

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '28px monospace';
  ctx.fillText(leftLabel, 160, 110);

  // Right score
  ctx.fillStyle = HUMAN_COLOR;
  ctx.font = 'bold 80px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(scores[1], CANVAS_W - 60, 110);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '28px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(rightLabel, CANVAS_W - 160, 110);

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

  const btns = getMenuButtons();

  // VS CPU button
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(btns.vsCpu.x, btns.vsCpu.y, btns.vsCpu.w, btns.vsCpu.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 3;
  ctx.strokeRect(btns.vsCpu.x, btns.vsCpu.y, btns.vsCpu.w, btns.vsCpu.h);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 44px monospace';
  ctx.fillText('VS CPU', CANVAS_W / 2, btns.vsCpu.y + 68);

  // VS PLAYER button
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(btns.vsPlayer.x, btns.vsPlayer.y, btns.vsPlayer.w, btns.vsPlayer.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 3;
  ctx.strokeRect(btns.vsPlayer.x, btns.vsPlayer.y, btns.vsPlayer.w, btns.vsPlayer.h);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 44px monospace';
  ctx.fillText('VS PLAYER', CANVAS_W / 2, btns.vsPlayer.y + 68);

  // Version
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '24px monospace';
  ctx.fillText(VERSION, CANVAS_W / 2, CANVAS_H - 40);
}

function drawMatchOver() {
  // In multiplayer, local player might be red (left) or blue (right)
  const localIdx = getLocalPlayerIdx();
  const myScore = scores[localIdx];
  const iWon = myScore >= WIN_SCORE;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = iWon ? '#4dabf7' : '#e74c3c';
  ctx.font = 'bold 100px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(iWon ? 'YOU WIN!' : 'YOU LOSE', CANVAS_W / 2, CANVAS_H / 2 - 60);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 64px monospace';
  ctx.fillText(`${scores[0]} - ${scores[1]}`, CANVAS_W / 2, CANVAS_H / 2 + 40);

  const pulse = Math.sin(performance.now() / 500) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(255,255,255,${pulse * 0.6})`;
  ctx.font = '36px monospace';
  const prompt = gameMode === 'multiplayer' ? 'TAP TO RETURN' : 'TAP TO PLAY AGAIN';
  ctx.fillText(prompt, CANVAS_W / 2, CANVAS_H / 2 + 140);
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
