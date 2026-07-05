import { AppConfig } from '../types/index';

/**
 * Global Configuration for TabVerse
 * Used for tweakable settings that don't change at runtime.
 */
export const Config: AppConfig = {
    // Physics
    physics: {
        gravity: { x: 0, y: 980 }, // Pixels per second squared
        fps: 60,                   // Target physics ticks per second
        substeps: 4,               // Physics iterations per tick (for stability)
        restitution: 0.95,         // Default bounciness (0-1)
        friction: 0.05,            // Default friction (0-1)
    },

    // Rendering
    render: {
        bloom: true,
        trails: true,
        backgroundColor: '#0f172a',
        pixelRatio: window.devicePixelRatio || 1
    },

    // Network
    network: {
        channelName: 'tabverse-shared-world',
        heartbeatInterval: 1000,     // ms
        timeoutDuration: 3000,       // ms before considering a peer dead
        syncRate: 30,                // Hz (how often the owner broadcasts state)
        viewportBroadcastInterval: 250 // ms between each tab announcing its window rect
    },

    // Limits
    limits: {
        maxObjects: 300,
        maxParticles: 500,
        maxRopeSegments: 20
    },

    // Persistence
    persistence: {
        dbName: 'tabverse-world',
        storeName: 'snapshots',
        saveIntervalMs: 3000
    }
};