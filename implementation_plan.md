# TabVerse Implementation Plan

## Goal Description
Build "TabVerse", a production-quality, dependency-free distributed multi-tab physics playground web application. It will use native browser APIs (Canvas 2D, BroadcastChannel, Web Audio) to synchronize a physics simulation across multiple browser tabs, allowing them to act as windows into a single shared virtual infinite world.

## User Review Required
> [!IMPORTANT]
> This project is extremely large and complex. Generating all files completely without placeholders (as requested) will require multiple turns due to token limits. I will create the files module by module and notify you of progress. Please approve to start the generation process.

> [!WARNING]
> Since we cannot use any external libraries, the physics engine (including continuous collision detection, spatial partitioning, impulse resolution) and networking synchronization (interpolation, prediction, election of owner) will be built entirely from scratch. This will result in a significant amount of code and careful architectural planning.

## Open Questions
> [!NOTE]
> - **Spatial Layout:** For the layout detection (tabs acting as spatial windows), we will use `window.screenX`, `window.screenY`, `window.innerWidth`, and `window.innerHeight` combined with `window.devicePixelRatio`. This maps physical monitor pixels to world space. Does this align with your expectations for placing tabs in the virtual world?
> - **Audio:** Should the procedural audio be strictly spatialized based on the camera position of each individual tab?
> - **Storage:** For the persistence layer, `localStorage` or `IndexedDB` will be used. Given the potential size of replays, `IndexedDB` is preferred. Is this acceptable?

## Proposed Architecture & Execution Phases

We will build the application in a sequence of dependent layers to ensure each piece can be tested as we go.

### Phase 1: Core, Utilities, & UI Foundation
Establish the project skeleton, event bus (critical for decoupling), utility math functions, and the visual design system.
- **Files**: `index.html`, `css/*` (Styles, UI, Animations, Themes), `js/core/*` (App, Config, Constants, Events), `js/utilities/*` (Math, Random, Easing, Colors, Profiler).

### Phase 2: Distributed Networking
Implement the `BroadcastChannel` synchronization. This layer must run independently of the physics. It handles discovering other tabs, ping/pong latency checks, electing the "Simulation Owner", and graceful failovers if the owner tab is closed.
- **Files**: `js/network/*` (Broadcast, Heartbeat, Ownership, Sync, Serializer).

### Phase 3: Physics Engine
Build the 2D rigid body physics engine from scratch. It will support sleeping bodies, spatial grid partitioning for the broad phase, and impulse-based narrow phase resolution with Baumgarte stabilization or sequential impulses.
- **Files**: `js/physics/*` (Physics, Broadphase, SpatialGrid, Collision, Resolver), `js/objects/*` (Ball, Box, Portal, BlackHole, Rope, Particle).

### Phase 4: Rendering & Visual Effects
Build the Canvas2D rendering pipeline. It will translate world coordinates to screen coordinates based on the tab's physical position. It will include advanced effects like bloom (via shadowBlur/composite ops), trails, and particles.
- **Files**: `js/renderer/*` (Renderer, Camera, Lighting, Trails, Particles, Minimap).

### Phase 5: Interaction, Audio, & Gameplay Systems
Wire up user input, procedural audio using Web Audio API nodes (oscillators, biquad filters), UI updates, saving/loading, and specific gameplay modes.
- **Files**: `js/ui/*` (HUD, Menus, Notifications, Controls), `js/audio/*` (Audio, Synth), `js/storage/*` (Save, Replay), `js/main.js`.

## Verification Plan

### Automated Tests
- Since no external testing frameworks are allowed, we will implement an internal `Benchmark` mode as requested, which spawns 300+ objects and tracks simulation/render FPS, memory, and packet rate via the `profiler.js`.

### Manual Verification
1. Open `index.html` in Chrome.
2. Duplicate the tab multiple times and arrange them across the screen(s).
3. Verify via the HUD that one tab is elected "Owner" and others are "Clients".
4. Spawn an object (e.g., a ball) in one tab, apply a force, and observe it traverse seamlessly into the viewport of the adjacent tab based on monitor pixel mapping.
5. Close the "Owner" tab and verify another tab seamlessly takes over ownership without simulation state loss.
6. Test procedural audio generation on collisions.
7. Switch themes and verify glassmorphism UI interactions.
