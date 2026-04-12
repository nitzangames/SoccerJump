# Soccer Jump Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a one-touch pixel-art soccer game where two tilting egg-shaped players jump and kick a ball into goals.

**Architecture:** Single-file game (`game.js`) using the Physics2D engine for ball physics and collision detection. Players are not physics bodies — they use custom tilt/jump logic with manual position updates. The physics engine handles the ball, ground, walls, goal sensors, and ball-player collisions via collision callbacks.

**Tech Stack:** Vanilla JS, Canvas 2D, Physics2D engine (local copy)

---

## File Structure

```
SoccerJump/
  index.html          — HTML shell: canvas + CSS + script tag
  game.js             — all game logic, rendering, state management
  meta.json           — platform metadata
  .zipignore          — deploy exclusions
  physics2d/          — copied from /Users/nitzanwilnai/Programming/Claude/JSGames/Physics2D
    index.js
    src/
      body.js
      collision.js
      debug.js
      math.js
      raycast.js
      shapes.js
      world.js
```

---

### Task 1: Project scaffolding and physics engine

**Files:**
- Create: `index.html`
- Create: `meta.json`
- Create: `.zipignore`
- Create: `game.js` (minimal — just canvas setup and a loop)
- Copy: `physics2d/` from Physics2D

- [ ] **Step 1: Copy the physics engine**

```bash
cp -r /Users/nitzanwilnai/Programming/Claude/JSGames/Physics2D/src physics2d/src
cp /Users/nitzanwilnai/Programming/Claude/JSGames/Physics2D/index.js physics2d/index.js
```

- [ ] **Step 2: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Soccer Jump</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%; height: 100%;
      overflow: hidden;
      background: #2c2c2c;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    canvas {
      display: block;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      touch-action: none;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <script type="module" src="game.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create meta.json**

```json
{
  "slug": "soccer-jump",
  "title": "Soccer Jump",
  "description": "One-touch soccer! Time your jumps to kick the ball past the opponent. First to 5 wins!",
  "tags": ["sports", "arcade", "one-touch"],
  "author": "Nitzan",
  "thumbnail": "thumbnail.png"
}
```

- [ ] **Step 4: Create .zipignore**

```
.git/*
.superpowers/*
docs/*
CLAUDE.md
.zipignore
```

- [ ] **Step 5: Create minimal game.js with canvas setup and game loop**

```js
import { World, Body, Circle, Rectangle, Edge, Vec2 } from './physics2d/index.js';

// --- Constants ---
const CANVAS_W = 1080;
const CANVAS_H = 1920;
const VERSION = 'v0.1.0';

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

// --- Game Loop ---
let lastTime = performance.now();

function loop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

function update(dt) {
  // placeholder
}

function draw() {
  // Dark background
  ctx.fillStyle = '#1a0a2e';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Field area
  ctx.fillStyle = FIELD_COLOR;
  ctx.fillRect(FIELD_LEFT, FIELD_TOP, FIELD_RIGHT - FIELD_LEFT, FIELD_H);

  // Ground strip
  ctx.fillStyle = GROUND_COLOR;
  ctx.fillRect(FIELD_LEFT, GROUND_Y, FIELD_RIGHT - FIELD_LEFT, FIELD_BOTTOM - GROUND_Y);

  // Version
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(VERSION, CANVAS_W / 2, CANVAS_H - 20);
}

requestAnimationFrame(loop);
```

- [ ] **Step 6: Serve and verify**

```bash
python3 -m http.server 8080
```

Open http://localhost:8080. Verify: dark purple background, green field rectangle, version string at bottom.

- [ ] **Step 7: Commit**

```bash
git add index.html game.js meta.json .zipignore physics2d/
git commit -m "feat: project scaffolding with canvas, game loop, and physics engine"
```

---

### Task 2: Field rendering — sky, skyline, goals, ground

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Add skyline and goal constants**

Add after the existing constants in `game.js`:

```js
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
```

- [ ] **Step 2: Implement the draw function with sky, skyline, field, and goals**

Replace the `draw()` function:

```js
function draw() {
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, FIELD_TOP + 100);
  skyGrad.addColorStop(0, '#1a0a2e');
  skyGrad.addColorStop(1, '#2a1548');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // City skyline
  ctx.fillStyle = '#120828';
  for (const b of SKYLINE) {
    ctx.fillRect(b.x, FIELD_TOP - b.h + 60, b.w, b.h);
  }

  // Fence strip
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(FIELD_LEFT, FIELD_TOP - 10, FIELD_RIGHT - FIELD_LEFT, 30);
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(FIELD_LEFT, FIELD_TOP - 10, FIELD_RIGHT - FIELD_LEFT, 6);

  // Field grass
  ctx.fillStyle = FIELD_COLOR;
  ctx.fillRect(FIELD_LEFT, FIELD_TOP + 20, FIELD_RIGHT - FIELD_LEFT, FIELD_H - 20);

  // Grass stripes (alternating shades)
  ctx.fillStyle = '#52a043';
  for (let y = FIELD_TOP + 20; y < GROUND_Y; y += 60) {
    ctx.fillRect(FIELD_LEFT, y, FIELD_RIGHT - FIELD_LEFT, 30);
  }

  // Ground dirt strip
  ctx.fillStyle = GROUND_COLOR;
  ctx.fillRect(FIELD_LEFT, GROUND_Y, FIELD_RIGHT - FIELD_LEFT, FIELD_BOTTOM - GROUND_Y);

  // Ground line
  ctx.strokeStyle = '#5a9c4f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(FIELD_LEFT, GROUND_Y);
  ctx.lineTo(FIELD_RIGHT, GROUND_Y);
  ctx.stroke();

  drawGoal(GOAL_LEFT_X, true);
  drawGoal(GOAL_RIGHT_X, false);

  // Tap zone area below field
  ctx.fillStyle = '#1a0a2e';
  ctx.fillRect(0, FIELD_BOTTOM, CANVAS_W, CANVAS_H - FIELD_BOTTOM);

  // "TAP TO JUMP" text
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.font = '32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TAP TO JUMP', CANVAS_W / 2, FIELD_BOTTOM + 200);

  // Version
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(VERSION, CANVAS_W / 2, CANVAS_H - 20);
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
    // Left goal: right post + crossbar (open on left side toward edge)
    ctx.moveTo(x + GOAL_W, GROUND_Y);
    ctx.lineTo(x + GOAL_W, goalTop);
    ctx.lineTo(x, goalTop);
  } else {
    // Right goal: left post + crossbar (open on right side toward edge)
    ctx.moveTo(x, GROUND_Y);
    ctx.lineTo(x, goalTop);
    ctx.lineTo(x + GOAL_W, goalTop);
  }
  ctx.stroke();
}
```

- [ ] **Step 3: Serve and verify**

Open http://localhost:8080. Verify: purple sky with skyline silhouette, brown fence, green striped field, two white goals with nets on the ground at each side, dirt strip at bottom of field.

- [ ] **Step 4: Commit**

```bash
git add game.js
git commit -m "feat: field rendering with sky, skyline, goals, and ground"
```

---

### Task 3: Players — tilting and rendering

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Add player constants and state**

Add after goal constants:

```js
// Player dimensions
const PLAYER_W = 120;
const PLAYER_H = 280;
const PLAYER_Y = GROUND_Y; // base of player is at ground

// Tilt
const TILT_SPEED = 2.5; // radians per second (full oscillation period ~2.5s)
const TILT_MAX_ANGLE = 0.45; // max tilt in radians (~26 degrees)

// Player state
const players = [
  {
    x: FIELD_LEFT + GOAL_W + 180,
    y: PLAYER_Y,
    tiltPhase: 0,
    tiltDirection: 1, // 1 = starts tilting right, -1 = starts tilting left
    angle: 0,
    color: CPU_COLOR,
    colorLight: CPU_COLOR_LIGHT,
    isHuman: false,
    isAirborne: false,
    velX: 0,
    velY: 0,
    jumpX: 0, // x position at start of jump
  },
  {
    x: FIELD_RIGHT - GOAL_W - 180,
    y: PLAYER_Y,
    tiltPhase: 0,
    tiltDirection: -1, // opposite to player 0
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
```

- [ ] **Step 2: Implement tilt update logic**

Add the player update function:

```js
function updatePlayers(dt) {
  for (const p of players) {
    if (p.isAirborne) {
      // Apply gravity
      p.velY += 2500 * dt; // gravity in px/s²
      p.x += p.velX * dt;
      p.y += p.velY * dt;

      // Land on ground
      if (p.y >= PLAYER_Y) {
        p.y = PLAYER_Y;
        p.isAirborne = false;
        p.velX = 0;
        p.velY = 0;
        // Tilt resumes from current phase (already frozen)
      }

      // Clamp x within field (keep player inside field, outside goals)
      const minX = FIELD_LEFT + GOAL_W + PLAYER_W / 2;
      const maxX = FIELD_RIGHT - GOAL_W - PLAYER_W / 2;
      if (p.x < minX) p.x = minX;
      if (p.x > maxX) p.x = maxX;
    } else {
      // Tilt oscillation
      p.tiltPhase += TILT_SPEED * dt;
      p.angle = Math.sin(p.tiltPhase) * TILT_MAX_ANGLE * p.tiltDirection;
    }
  }
}
```

Call `updatePlayers(dt)` from `update(dt)`.

- [ ] **Step 3: Implement player rendering**

Add the player draw function. Draw pixel-art egg-shaped players:

```js
function drawPlayer(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);

  // Body (tall rectangle with rounded ends — pixel art style)
  const hw = PLAYER_W / 2;
  const hh = PLAYER_H;

  // Main body
  ctx.fillStyle = p.color;
  ctx.fillRect(-hw, -hh, PLAYER_W, PLAYER_H);

  // Rounded top (semicircle approximated as rect stack for pixel feel)
  ctx.fillRect(-hw + 8, -hh - 16, PLAYER_W - 16, 16);
  ctx.fillRect(-hw + 20, -hh - 28, PLAYER_W - 40, 12);

  // Lighter highlight
  ctx.fillStyle = p.colorLight;
  ctx.fillRect(-hw + 10, -hh + 10, PLAYER_W / 3, PLAYER_H - 40);

  // Head area (lighter skin tone)
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
```

Call `drawPlayer(players[0])` and `drawPlayer(players[1])` at the end of the field drawing section in `draw()` (before the tap zone).

- [ ] **Step 4: Serve and verify**

Open http://localhost:8080. Verify: two blocky players tilting back and forth in opposite directions on the field. They tilt smoothly and in sync.

- [ ] **Step 5: Commit**

```bash
git add game.js
git commit -m "feat: player rendering and tilt oscillation"
```

---

### Task 4: Jumping mechanic

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Add jump constants**

```js
// Jump
const JUMP_FORCE = 1200; // px/s upward component
const JUMP_LATERAL = 600; // px/s lateral component (scaled by tilt)
```

- [ ] **Step 2: Implement jump function**

```js
function jumpPlayer(p) {
  if (p.isAirborne) return;

  p.isAirborne = true;
  p.jumpX = p.x;

  // Jump direction based on current tilt angle
  const lateralDir = Math.sin(p.angle);
  p.velX = lateralDir * JUMP_LATERAL;
  p.velY = -JUMP_FORCE;
}
```

- [ ] **Step 3: Add pointer input for human player**

```js
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (gameState === 'playing') {
    jumpPlayer(players[1]); // players[1] is human (blue)
  }
});
```

Add a `gameState` variable at the top of the game state section:

```js
let gameState = 'playing'; // 'menu', 'playing', 'goalScored', 'matchOver'
```

- [ ] **Step 4: Serve and verify**

Open http://localhost:8080. Tap/click the screen. Blue player should jump in the direction of their tilt. They should land back on the ground and resume tilting. Tilting should freeze while airborne. Pink player should keep tilting (not jumping yet).

- [ ] **Step 5: Commit**

```bash
git add game.js
git commit -m "feat: tap-to-jump mechanic with tilt-based direction"
```

---

### Task 5: Ball with physics

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Set up physics world, ball, ground, and walls**

Add after player state:

```js
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

// Ceiling (top of field)
const ceilingBody = new Body({
  shape: new Edge(new Vec2(600, 0), new Vec2(-600, 0)),
  position: new Vec2(CANVAS_W / 2, FIELD_TOP + 20),
  isStatic: true,
  userData: 'ceiling',
});
world.addBody(ceilingBody);

// Left wall (above goal)
const leftWallBody = new Body({
  shape: new Edge(new Vec2(0, 400), new Vec2(0, -400)),
  position: new Vec2(FIELD_LEFT + GOAL_W, GROUND_Y - GOAL_H - 200),
  isStatic: true,
  userData: 'wall',
});
world.addBody(leftWallBody);

// Right wall (above goal)
const rightWallBody = new Body({
  shape: new Edge(new Vec2(0, -400), new Vec2(0, 400)),
  position: new Vec2(FIELD_RIGHT - GOAL_W, GROUND_Y - GOAL_H - 200),
  isStatic: true,
  userData: 'wall',
});
world.addBody(rightWallBody);

// Goal back walls (so ball bounces off the back of the goal)
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

// Goal crossbars (top of each goal)
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

// Goal sensors (detect when ball enters goal)
const GOAL_SENSOR_GROUP = 0x0002;
const leftGoalSensor = new Body({
  shape: new Rectangle(GOAL_W - 20, GOAL_H - 20),
  position: new Vec2(FIELD_LEFT + GOAL_W / 2, GROUND_Y - GOAL_H / 2),
  isStatic: true,
  isSensor: true,
  userData: 'goalLeft',
  collisionGroup: GOAL_SENSOR_GROUP,
});
world.addBody(leftGoalSensor);

const rightGoalSensor = new Body({
  shape: new Rectangle(GOAL_W - 20, GOAL_H - 20),
  position: new Vec2(FIELD_RIGHT - GOAL_W / 2, GROUND_Y - GOAL_H / 2),
  isStatic: true,
  isSensor: true,
  userData: 'goalRight',
  collisionGroup: GOAL_SENSOR_GROUP,
});
world.addBody(rightGoalSensor);
```

- [ ] **Step 2: Step the physics world in update**

Add to `update(dt)`:

```js
function update(dt) {
  if (gameState !== 'playing' && gameState !== 'goalScored') return;
  updatePlayers(dt);
  world.step(dt);
}
```

- [ ] **Step 3: Draw the ball**

Add a ball draw function called from `draw()`:

```js
function drawBall() {
  const bx = ballBody.renderPosition.x;
  const by = ballBody.renderPosition.y;
  const r = BALL_RADIUS;

  // White square (pixel art ball)
  ctx.fillStyle = 'white';
  ctx.fillRect(bx - r, by - r, r * 2, r * 2);

  // Black pentagon pattern (pixel style)
  ctx.fillStyle = '#333';
  ctx.fillRect(bx - 6, by - 6, 12, 12);

  // Border
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx - r, by - r, r * 2, r * 2);
}
```

- [ ] **Step 4: Serve and verify**

Open http://localhost:8080. Ball should appear at center field, fall to the ground, and rest there. It should bounce slightly on landing.

- [ ] **Step 5: Commit**

```bash
git add game.js
git commit -m "feat: ball physics with ground, walls, and goal geometry"
```

---

### Task 6: Ball-player collision and hybrid kicking

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Add player collision bodies (dynamic rectangles representing players for ball collision)**

Players aren't physics-driven for movement, but we need physics bodies for ball collisions. Create "ghost" kinematic bodies that we teleport to match player positions each frame:

```js
// Player collision bodies (for ball interaction)
const PLAYER_COLLISION_GROUP = 0x0004;
const playerBodies = players.map((p, i) => {
  const body = new Body({
    shape: new Rectangle(PLAYER_W - 20, PLAYER_H - 20),
    position: new Vec2(p.x, p.y - PLAYER_H / 2),
    mass: 50, // heavy so ball bounces off
    restitution: 0.3,
    friction: 0.2,
    userData: i === 0 ? 'playerCPU' : 'playerHuman',
    collisionGroup: PLAYER_COLLISION_GROUP,
  });
  world.addBody(body);
  return body;
});
```

- [ ] **Step 2: Sync player collision bodies each frame**

Add to the end of `updatePlayers(dt)`:

```js
  // Sync physics collision bodies to player visual positions
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const b = playerBodies[i];
    b.setPosition(p.x, p.y - PLAYER_H / 2);
    b.angle = p.angle;
    b.previousAngle = p.angle;
    b.setVelocity(p.velX || 0, p.velY || 0);
  }
```

- [ ] **Step 3: Add hybrid kick impulse on collision**

```js
const KICK_STRENGTH = 800;

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
    // Determine kick direction: toward opponent's goal
    const kickDirX = other.userData === 'playerCPU' ? 1 : -1;

    // Add kick impulse toward opponent's goal and slightly upward
    const impulse = new Vec2(kickDirX * KICK_STRENGTH, -KICK_STRENGTH * 0.5);
    ball.applyImpulse(impulse);
  }
};
```

- [ ] **Step 4: Add a placeholder onGoalScored function**

```js
function onGoalScored(scorer) {
  // Will be implemented in Task 7
  console.log(scorer + ' scored!');
}
```

- [ ] **Step 5: Serve and verify**

Open http://localhost:8080. Jump into the ball — it should get kicked toward the opponent's goal with force. The ball should bounce off walls and crossbars.

- [ ] **Step 6: Commit**

```bash
git add game.js
git commit -m "feat: ball-player collision with hybrid kick impulse"
```

---

### Task 7: Scoring and reset

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Add score state**

```js
let scores = [0, 0]; // [CPU, human]
const WIN_SCORE = 5;
let goalFlashTimer = 0;
let lastScorer = '';
```

- [ ] **Step 2: Implement onGoalScored**

Replace the placeholder:

```js
function onGoalScored(scorer) {
  if (gameState !== 'playing') return;

  if (scorer === 'human') {
    scores[1]++;
  } else {
    scores[0]++;
  }

  lastScorer = scorer;
  goalFlashTimer = 1.5; // seconds of pause
  gameState = 'goalScored';
}
```

- [ ] **Step 3: Implement goal-scored state update**

Add to `update(dt)` for the goalScored state:

```js
function update(dt) {
  if (gameState === 'playing') {
    updatePlayers(dt);
    world.step(dt);
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
```

- [ ] **Step 4: Implement resetRound**

```js
function resetRound() {
  // Reset ball to center
  ballBody.setPosition(CANVAS_W / 2, GROUND_Y - BALL_RADIUS - 5);
  ballBody.setVelocity(0, 0);
  ballBody.angularVelocity = 0;
  ballBody.wake();

  // Reset players to starting positions
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
```

- [ ] **Step 5: Draw the score HUD**

Add a `drawHUD()` function called from `draw()` before everything else:

```js
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

  // Goal flash
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
```

- [ ] **Step 6: Serve and verify**

Open http://localhost:8080. Score shows at top. Kick ball into goal — "GOAL!" text flashes, score increments, ball and players reset.

- [ ] **Step 7: Commit**

```bash
git add game.js
git commit -m "feat: scoring system with goal detection, HUD, and round reset"
```

---

### Task 8: AI opponent

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Add AI constants and state**

```js
// AI
const AI_DIFFICULTY = [
  { reactionDelay: 0.8, jumpChance: 0.5, name: 'easy' },     // 0-1 human goals
  { reactionDelay: 0.4, jumpChance: 0.75, name: 'medium' },   // 2-3 human goals
  { reactionDelay: 0.2, jumpChance: 0.9, name: 'hard' },      // 4 human goals
];
let aiTimer = 0;
let aiDecisionCooldown = 0;
```

- [ ] **Step 2: Implement AI update logic**

```js
function updateAI(dt) {
  const cpu = players[0];
  if (cpu.isAirborne) return;

  // Get difficulty based on human score
  const humanScore = scores[1];
  const diffIdx = humanScore <= 1 ? 0 : humanScore <= 3 ? 1 : 2;
  const diff = AI_DIFFICULTY[diffIdx];

  aiDecisionCooldown -= dt;
  if (aiDecisionCooldown > 0) return;

  // Check if ball is on CPU's side or heading toward CPU's goal
  const ballX = ballBody.position.x;
  const ballVelX = ballBody.velocity.x;
  const fieldCenter = CANVAS_W / 2;

  const ballOnMySide = ballX < fieldCenter;
  const ballComingToMe = ballVelX < -50;
  const ballClose = Math.abs(ballX - cpu.x) < 300 && Math.abs(ballBody.position.y - (cpu.y - PLAYER_H / 2)) < PLAYER_H;

  let shouldJump = false;

  if (ballClose) {
    // Ball is near — react based on difficulty
    shouldJump = Math.random() < diff.jumpChance;
  } else if (ballComingToMe && ballOnMySide) {
    // Ball heading toward my goal — try to intercept
    shouldJump = Math.random() < diff.jumpChance * 0.6;
  }

  // Check if tilt angle would send us toward the ball
  if (shouldJump) {
    const tiltDir = Math.sin(cpu.angle);
    const ballDir = ballX > cpu.x ? 1 : -1;
    // Only jump if tilt is roughly toward the ball
    if (tiltDir * ballDir > -0.2) {
      jumpPlayer(cpu);
      aiDecisionCooldown = diff.reactionDelay;
    }
  }

  // Occasionally jump even if conditions aren't ideal (adds unpredictability)
  if (!shouldJump && aiDecisionCooldown <= -1.5) {
    if (Math.random() < 0.3) {
      jumpPlayer(cpu);
      aiDecisionCooldown = diff.reactionDelay + 0.5;
    }
  }
}
```

Call `updateAI(dt)` from `update(dt)` when `gameState === 'playing'`.

- [ ] **Step 3: Serve and verify**

Open http://localhost:8080. CPU player should jump on its own, reacting to the ball. It should be easier at low scores and harder as you score more.

- [ ] **Step 4: Commit**

```bash
git add game.js
git commit -m "feat: AI opponent with progressive difficulty"
```

---

### Task 9: Menu and match-over screens

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Set initial game state to menu**

Change the initial state:

```js
let gameState = 'menu';
```

- [ ] **Step 2: Add menu drawing**

```js
function drawMenu() {
  // Title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 100px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SOCCER', CANVAS_W / 2, 700);
  ctx.fillText('JUMP', CANVAS_W / 2, 820);

  // Subtitle
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '36px monospace';
  ctx.fillText('TAP TO PLAY', CANVAS_W / 2, 1000);

  // Pulsing effect on tap to play
  const pulse = Math.sin(performance.now() / 500) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(255,255,255,${pulse * 0.6})`;
  ctx.fillText('TAP TO PLAY', CANVAS_W / 2, 1000);

  // Version
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '24px monospace';
  ctx.fillText(VERSION, CANVAS_W / 2, CANVAS_H - 40);
}
```

- [ ] **Step 3: Add match-over drawing**

```js
function drawMatchOver() {
  const humanWon = scores[1] >= WIN_SCORE;

  ctx.fillStyle = `rgba(0,0,0,0.6)`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = humanWon ? '#4dabf7' : '#e74c3c';
  ctx.font = 'bold 100px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(humanWon ? 'YOU WIN!' : 'YOU LOSE', CANVAS_W / 2, CANVAS_H / 2 - 60);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 64px monospace';
  ctx.fillText(`${scores[0]} - ${scores[1]}`, CANVAS_W / 2, CANVAS_H / 2 + 40);

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '36px monospace';
  const pulse = Math.sin(performance.now() / 500) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(255,255,255,${pulse * 0.6})`;
  ctx.fillText('TAP TO PLAY AGAIN', CANVAS_W / 2, CANVAS_H / 2 + 140);
}
```

- [ ] **Step 4: Update input handling for menu and match-over states**

Replace the pointerdown handler:

```js
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
```

- [ ] **Step 5: Update draw to handle all states**

Update `draw()` to call the right draw functions per state:

```js
function draw() {
  // Always draw the field background
  drawField();

  if (gameState === 'menu') {
    drawMenu();
  } else if (gameState === 'playing' || gameState === 'goalScored') {
    drawPlayers();
    drawBall();
    drawHUD();
  } else if (gameState === 'matchOver') {
    drawPlayers();
    drawBall();
    drawHUD();
    drawMatchOver();
  }
}
```

Extract the field drawing code from the old `draw()` into `drawField()`, and player drawing into `drawPlayers()`:

```js
function drawField() {
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, FIELD_TOP + 100);
  skyGrad.addColorStop(0, '#1a0a2e');
  skyGrad.addColorStop(1, '#2a1548');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // ... (all existing field drawing code from Task 2) ...
}

function drawPlayers() {
  drawPlayer(players[0]);
  drawPlayer(players[1]);
}
```

- [ ] **Step 6: Serve and verify**

Open http://localhost:8080. Should start on menu screen with "SOCCER JUMP" title and pulsing "TAP TO PLAY". Tap to start game. Score 5 goals — match over screen appears with result and "TAP TO PLAY AGAIN".

- [ ] **Step 7: Commit**

```bash
git add game.js
git commit -m "feat: menu and match-over screens"
```

---

### Task 10: Polish and tuning

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Add ball trail particles for visual juice**

```js
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
```

Call `updateParticles(dt)` from `update()` and `drawParticles()` from `draw()` after the ball.

Spawn particles from the ball position during movement:

Add to `update()` when playing:
```js
  // Ball trail particles
  const ballSpeed = ballBody.velocity.length();
  if (ballSpeed > 200) {
    spawnParticle(ballBody.position.x, ballBody.position.y, 'white');
  }
```

- [ ] **Step 2: Add screen shake on goal**

```js
let shakeTimer = 0;
let shakeIntensity = 0;

function triggerShake(intensity, duration) {
  shakeIntensity = intensity;
  shakeTimer = duration;
}
```

In `onGoalScored`, add: `triggerShake(15, 0.3);`

In `draw()`, before any drawing, add:
```js
  // Screen shake
  if (shakeTimer > 0) {
    shakeTimer -= 1 / 60;
    const sx = (Math.random() - 0.5) * shakeIntensity * 2;
    const sy = (Math.random() - 0.5) * shakeIntensity * 2;
    ctx.save();
    ctx.translate(sx, sy);
  }
```

At the end of `draw()`:
```js
  if (shakeTimer > 0) {
    ctx.restore();
  }
```

- [ ] **Step 3: Tune physics values**

Review and adjust these values for good feel. Start with:
- `KICK_STRENGTH`: 800 — increase if ball doesn't move enough, decrease if too chaotic
- `JUMP_FORCE`: 1200 — should feel snappy but not send player off-screen
- `JUMP_LATERAL`: 600 — should move player sideways noticeably
- `TILT_SPEED`: 2.5 — oscillation speed; too fast = hard to time, too slow = boring
- `TILT_MAX_ANGLE`: 0.45 — how far players lean
- Ball `restitution`: 0.6 — bouncy but not pinball
- Ball `linearDamping`: 0.3 — ball eventually slows down

These are starting points. Playtest and adjust.

- [ ] **Step 4: Serve and verify**

Open http://localhost:8080. Full game should be playable: menu -> play -> score goals -> match over -> play again. Ball should leave particle trails. Goals should trigger screen shake. Physics feel should be reasonable.

- [ ] **Step 5: Commit**

```bash
git add game.js
git commit -m "feat: visual polish — particles, screen shake, and physics tuning"
```

---

### Task 11: Thumbnail and final prep

**Files:**
- Create: `thumbnail.png` (generated via canvas screenshot or Puppeteer)

- [ ] **Step 1: Create a thumbnail generation script**

Create a temp script to render a 1024x1024 thumbnail. Use the game's draw functions on an offscreen canvas:

```bash
# Use Puppeteer to screenshot the game and crop/resize for thumbnail
node -e "
const puppeteer = require('/usr/local/lib/node_modules/puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 540, height: 960, deviceScaleFactor: 2 });
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'thumbnail-raw.png' });
  await browser.close();
})();
"
```

Then resize/crop to 1024x1024 with the game title rendered on it. Alternatively, create the thumbnail manually by drawing to an offscreen canvas in a separate script.

- [ ] **Step 2: Verify all platform requirements**

Check:
- `index.html` exists
- `meta.json` has slug, title, description, tags, author, thumbnail
- `thumbnail.png` is 1024x1024
- `.zipignore` excludes dev files
- Version string visible on main menu

- [ ] **Step 3: Final commit**

```bash
git add thumbnail.png
git commit -m "feat: add game thumbnail"
```

- [ ] **Step 4: Bump version**

Update `VERSION` in `game.js` to `'v1.0.0'`.

```bash
git add game.js
git commit -m "chore: bump version to v1.0.0"
```
