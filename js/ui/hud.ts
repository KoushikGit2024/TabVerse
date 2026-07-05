import { app } from '../core/app';
import { heartbeat } from '../network/heartbeat';
import { physics } from '../physics/physics';
import { sync } from '../network/sync';
import { ownership } from '../network/ownership';

class HUD {
    private elTabs: HTMLElement;
    private elObjects: HTMLElement;
    private elFps: HTMLElement;
    
    private frames: number;
    private lastFpsTime: number;
    private fps: number;

    constructor() {
        this.elTabs = document.getElementById('stat-tabs')!;
        this.elObjects = document.getElementById('stat-objects')!;
        this.elFps = document.getElementById('stat-fps')!;
        
        this.frames = 0;
        this.lastFpsTime = performance.now();
        this.fps = 0;
    }

    public init(): void {
        const originalLoop = app.loop;
        app.loop = (time: number) => {
            originalLoop.call(app, time);
            this.update(time);
        };
    }

    private update(time: number): void {
        this.frames++;
        if (time - this.lastFpsTime >= 1000) {
            this.fps = this.frames;
            this.frames = 0;
            this.lastFpsTime = time;
            
            this.elFps.textContent = this.fps.toString();
            this.elTabs.textContent = (heartbeat.getPeerCount() + 1).toString();
            
            if (ownership.isOwner) {
                this.elObjects.textContent = physics.objects.length.toString();
            } else {
                if (sync.stateBuffer.length > 0) {
                    this.elObjects.textContent = sync.stateBuffer[sync.stateBuffer.length - 1]!.objects.length.toString();
                }
            }
        }
    }
}

export const hud = new HUD();
