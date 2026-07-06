import './styles/main.css';
import { EngineBuilder } from '@tabverse/engine/api';
import { 
  BrowserClock, 
  BrowserViewport, 
  BroadcastTransport, 
  BrowserInputMapper,
  CanvasRenderer
} from '@tabverse/browser-adapter';
import { BallSimulationPlugin } from './simulation/BallSimulationPlugin';
import { SnapshotPlugin } from '@tabverse/engine/runtime/SnapshotPlugin'; // Assuming this was exported

const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;

const config = {
  version: 1 as const,
  physics: { gravity: 9.8, maxVelocity: 1000 },
  network: { heartbeatIntervalMs: 500, peerTimeoutMs: 2000 },
  topology: { snapTolerance: 80, minimumOverlap: 20 },
  diagnostics: { enabled: true }
};

const snapshotPlugin = new SnapshotPlugin();

const engine = new EngineBuilder()
  .withConfiguration(config)
  .withClock(new BrowserClock())
  .withViewport(new BrowserViewport())
  .withNetwork(new BroadcastTransport('tve_sync'))
  .withInputMapper(new BrowserInputMapper())
  .use(new BallSimulationPlugin())
  .use(snapshotPlugin)
  .build();

const renderer = new CanvasRenderer(canvas);

let lastTime = performance.now();

function loop() {
  const now = performance.now();
  const dt = now - lastTime;
  lastTime = now;

  engine.tick(dt);
  
  const snapshot = snapshotPlugin.getSnapshot();
  if (snapshot) {
    renderer.render(snapshot);
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
