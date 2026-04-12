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

  // "TAP TO JUMP" text
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = 'bold 56px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TAP TO JUMP', CANVAS_W / 2, FIELD_BOTTOM + 120);

  // Version string
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(VERSION, CANVAS_W / 2, CANVAS_H - 20);
}

function draw() {
  drawField();
}

requestAnimationFrame(loop);
