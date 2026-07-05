import { Constants } from './constants';
import { events } from './events';

/**
 * Main Application Coordinator
 * Handles initialization, loop timing, and tying subsystems together.
 */
class App {
    public isRunning: boolean;
    public lastTime: number;
    public deltaTime: number;
    public animationFrameId: number | null;
    public role: string;
    public windowOffset: { x: number; y: number };

    constructor() {
        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.animationFrameId = null;
        
        // State
        this.role = Constants.ROLES.CONNECTING;
        
        // Window Position (for spatial mapping)
        this.windowOffset = { x: 0, y: 0 };
        this.updateWindowOffset();
        
        // Bind loop
        this.loop = this.loop.bind(this);
    }

    public init(): void {
        console.log("TabVerse initialized");
        this.updateWindowOffset();
        
        // Start listening to window movement/resizing
        window.addEventListener('resize', () => this.updateWindowOffset());
        
        // A hacky way to detect window movement (since there's no native event for it)
        setInterval(() => this.updateWindowOffset(), 100);

        // Notify that the app is ready
        events.emit(Constants.EVENTS.APP_INIT, this);
        
        this.start();
    }

    public start(): void {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    public stop(): void {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private updateWindowOffset(): void {
        // Calculate the window's position in global screen space
        // Use logical CSS pixels for the physics/world coordinate system
        const newX = window.screenX;
        const newY = window.screenY;
        
        if (this.windowOffset.x !== newX || this.windowOffset.y !== newY) {
            this.windowOffset.x = newX;
            this.windowOffset.y = newY;
            // The renderer and physics will use this offset to know where this tab looks into the world
        }
    }

    public loop(time: number): void {
        if (!this.isRunning) return;
        
        // Calculate delta time in seconds, capped to avoid huge jumps if tab was hidden
        this.deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;

        // Note: The actual simulation and rendering updates will be 
        // hooked into this loop by the respective managers.

        this.animationFrameId = requestAnimationFrame(this.loop);
    }
    
    public setRole(role: string): void {
        if (this.role !== role) {
            this.role = role;
            events.emit(Constants.EVENTS.ROLE_CHANGED, role);
        }
    }
}

export const app = new App();
