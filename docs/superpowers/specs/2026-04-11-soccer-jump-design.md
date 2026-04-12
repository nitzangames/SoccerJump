# Soccer Jump — Game Design Spec

## Overview

A one-touch soccer game for the play.nitzan.games platform. Two egg-shaped players tilt back and forth on a horizontal field. The human player taps to jump in the direction of their tilt, trying to kick the ball into the opponent's goal. First to 5 goals wins.

## Core Mechanic

### Tilting
- Both players tilt back and forth like pendulums, pivoting at their base
- They start each round tilting in sync but in opposite directions (when one leans left, the other leans right)
- Tilt is a smooth sinusoidal oscillation at a fixed frequency
- When a player jumps, their tilt freezes until they land, then resumes from where it left off
- Once someone jumps, the two players are no longer in sync — creating emergent timing complexity

### Jumping
- Tap anywhere on screen to make the human player (blue, right side) jump
- Jump direction follows the current tilt angle — if tilted left, you jump up-and-left; if tilted right, up-and-right
- Players are subject to gravity and land back on the ground
- Players cannot jump while airborne (must be on the ground)

### Kicking (Hybrid)
- The ball is a physics body — collisions with players produce natural physics responses
- Additionally, when a player makes contact with the ball, a kick impulse is applied toward the opponent's goal
- This ensures the ball moves purposefully rather than bouncing randomly
- Kick strength can be tuned for feel

## Players

- **Blue (right side)**: Human-controlled. Taps to jump.
- **Pink (left side)**: AI-controlled with progressive difficulty.

### AI Opponent
- The AI watches the ball position and its own tilt angle to decide when to jump
- **Difficulty tiers** that ramp up as the human player scores:
  - **Easy (0-1 human goals)**: Slow reaction time (~800ms delay), occasionally jumps at bad angles, sometimes doesn't react at all
  - **Medium (2-3 human goals)**: Moderate reaction time (~400ms), better angle selection, more consistent
  - **Hard (4 human goals)**: Fast reactions (~200ms), good angle selection, rarely misses opportunities
- The AI's tilt runs independently (same frequency but desyncs after its own jumps)

## Field Layout

### Canvas
- 1080x1920 portrait (9:16), per platform standard
- CSS scales with `object-fit: contain` and flexbox centering (no transforms)

### Layout (top to bottom)
1. **Score bar** (~120px): Shows CPU score (left, pink) and YOU score (right, blue) with "FIRST TO 5" centered
2. **Playing field** (~700px): Horizontal field with goals on left and right edges, ground at the bottom
3. **Tap zone** (remaining ~1100px): Empty space below the field — entire screen is tappable but this area gives the thumb room on mobile

### Field Elements
- **Ground**: Pixel-art grass strip at the bottom of the field area
- **Goals**: Large, sitting on the ground, with net pattern visible. Open toward the field. Ball can roll into them along the ground.
- **Players**: Large egg-shaped bodies (~120px wide, ~280px tall in game units), standing on the ground
- **Ball**: ~40px diameter circle, white with pixel-art soccer pattern
- **Background**: City skyline silhouette above the field, dark purple sky

## Scoring

- A goal is scored when the ball fully enters a goal area
- The ball entering the LEFT goal = human (blue) scores
- The ball entering the RIGHT goal = CPU (pink) scores
- **After a goal**:
  1. Brief visual flash / score emphasis (~0.5s)
  2. Ball respawns at center of field
  3. Players reset to starting positions
  4. Tilting resumes in sync (opposite directions)
  5. Play resumes (~1-2 seconds total pause)
- **Match end**: When either player reaches 5 goals, show win/lose screen with option to play again

## Visual Style

### Pixel Art
- Retro blocky aesthetic inspired by classic pixel soccer games
- City skyline background in dark purple/indigo tones
- Green field with striped grass pattern
- Chunky player characters with simple pixel details (face/head area)
- White goals with visible net lines
- Square/blocky ball
- Pixel-style font for scores and UI text
- Color palette: dark purples (sky), greens (field), pink/red (CPU), blue (human), white (goals/ball)

## Physics

### Engine
- Uses Physics2D from `/Users/nitzanwilnai/Programming/Claude/JSGames/Physics2D`
- Copy into project as `physics2d/` subdirectory (same pattern as SuikaGame)

### Bodies
- **Players**: Capsule or rectangle shapes, dynamic bodies with mass. High friction to grip the ground.
- **Ball**: Circle shape, dynamic body. Moderate restitution (bouncy but not crazy), low friction.
- **Ground**: Static edge body across the bottom of the field
- **Walls**: Static edge bodies at top and sides of the field (ceiling to keep ball in play)
- **Goals**: Sensor bodies at each end — detect when the ball enters to trigger scoring. Plus static edges for the goal frame (crossbar, back wall) so the ball bounces off the frame realistically.

### Settings
- Gravity: ~981 px/s² (default)
- Fixed timestep: 1/120s for stability
- Use `renderPosition` and `renderAngle` for all drawing

## Game States

1. **Menu**: Title screen with "Tap to Play" prompt. Shows version string.
2. **Playing**: Active gameplay with tilting, jumping, kicking
3. **Goal scored**: Brief pause, score update, reset
4. **Match over**: Win/Lose message, "Tap to Play Again"

## Platform Requirements

- `index.html` — entry point
- `meta.json` — slug: "soccer-jump", title, description, tags, author, thumbnail
- `thumbnail.png` — 1024x1024 PNG with game title rendered in it
- `.zipignore` — exclude dev files from deploy
- Version string visible on main menu (bottom corner)

## Audio

Deferred to a future iteration. No sound for v1.

## File Structure

```
SoccerJump/
  index.html          — canvas + CSS + module script tag
  game.js             — main game loop, state management, rendering
  meta.json           — platform metadata
  thumbnail.png       — 1024x1024 game thumbnail
  .zipignore          — deploy exclusions
  physics2d/          — copy of Physics2D engine
  docs/               — specs and plans
```

Single-file game (`game.js`) to start. Can split later if it grows too large.
