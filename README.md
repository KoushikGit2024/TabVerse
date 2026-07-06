# TabVerse v2 — Distributed Browser Game Engine

TabVerse is a distributed physics engine whose rendering is split across multiple browser tabs. It uses `BroadcastChannel` to synchronize state and ownership, creating one continuous virtual world that spans your entire screen. Opening a new tab expands the playable area, while closing a tab contracts it—all without resetting the simulation.

## Features
- **Distributed Physics Engine**: A seamless physics world shared across multiple Chrome tabs.
- **Continuous Collision Detection**: Fast-moving objects accurately collide with dynamic tab boundaries.
- **Ownership Migration**: Master election algorithm dynamically handles tab additions and closures.
- **Premium Aesthetics**: Apple/Linear-inspired visual design featuring glassmorphism, dynamic gradients, soft shadows, motion blur, and ambient aurora backgrounds.
- **Procedural Audio**: Web Audio API generates impact sounds dynamically based on collision velocity and position.
- **Adaptive Resolution**: Fully supports Retina/High-DPI displays.

## Architecture

The project follows a strict, modular engine design with one-way data flow:

`Input -> Network Sync -> Game Logic -> Physics -> Renderer -> UI / Audio`

### Folder Structure
- `src/core/`: Game loop, Object pooling.
- `src/physics/`: Verly/Euler integration, Continuous Collision Detection (CCD).
- `src/network/`: BroadcastChannel abstractions, Master-Client ownership logic.
- `src/renderer/`: High DPI Canvas2D, gradients, and lighting.
- `src/effects/`: Particles, motion trails.
- `src/audio/`: Web Audio procedural sound generation.
- `src/ui/`: HUD, Minimap, DOM overlays.
- `src/styles/`: Glassmorphism CSS.

## Networking & Synchronization
The engine operates entirely locally within the browser using `BroadcastChannel`. 
- **Master/Client Model**: Exactly one tab acts as the "Master" and runs the physics simulation at 120 updates per second.
- **Interpolation**: Client tabs receive state updates and interpolate positions between frames using the accumulator's `alpha` value to ensure zero visual stutter.
- **Global Coordinates**: The `CoordinateSpace` layer maps local viewport pixels to global screen coordinates (using `window.screenX/Y`).

## Physics
The engine avoids jitter and clipping by utilizing a stable accumulator timestep. `PhysicsWorld` dynamically computes the boundaries of the world by computing the union of all connected tab viewports in global coordinate space. Sub-stepping and predictive swept-sphere algorithms ensure balls never phase through window edges.

## Controls
- **Left Click & Drag**: Spawn and throw a ball.
- **Scroll Wheel**: Adjust the size of the next spawned ball.
- **Right Click**: Delete the hovered ball.

## Running Locally

1. `npm install`
2. `npm run dev`
3. Open multiple Chrome windows and resize them.
