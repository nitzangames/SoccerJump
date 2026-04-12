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
