import { broadcast } from './broadcast';
import { Config } from '../core/config';
import { Constants } from '../core/constants';
import { events } from '../core/events';
import { ViewportRect, ViewportUpdateMessage } from '../types/index';

/**
 * ViewportTracker
 *
 * Every tab (regardless of owner/client role) knows its own physical position
 * and size in "world space" via window.screenX/screenY/innerWidth/innerHeight.
 * This module:
 *   1. Periodically re-measures this tab's own rect and broadcasts it to peers.
 *   2. Listens for peer rects and keeps a live map of every known tab's window.
 *
 * This solves the "invisible spawned object" bug: instead of a single hardcoded
 * floor (window.screen.height), the physics engine can ask "is there ANY open
 * tab window under this x position, and if so, how far down does it extend?"
 * Objects that fall into the gap between windows (e.g. over the Windows taskbar,
 * or between two non-adjacent browser windows) correctly free-fall out of view
 * rather than resting on a phantom floor, matching real multi-monitor window layouts.
 */
class ViewportTracker {
    /** This tab's own current rect, in world/screen space. */
    public selfRect: ViewportRect;

    /** Rects reported by other tabs, keyed by tabId. */
    public peerRects: Map<string, ViewportRect>;

    constructor() {
        this.selfRect = this.measure();
        this.peerRects = new Map();
    }

    public init(): void {
        broadcast.on<ViewportUpdateMessage>('viewport_update', (payload, sender) => {
            this.peerRects.set(sender, payload);
        });

        events.on(Constants.EVENTS.TAB_LEFT, (peerId: string) => {
            this.peerRects.delete(peerId);
        });

        // Re-measure and broadcast on a steady interval. We don't rely solely on
        // the 'resize'/move events because there's no native "window moved" event;
        // app.ts already polls screenX/screenY for its own offset, so we piggyback
        // on a similarly cheap interval here.
        window.setInterval(() => {
            this.selfRect = this.measure();
            broadcast.send<ViewportUpdateMessage>('viewport_update', this.selfRect);
        }, Config.network.viewportBroadcastInterval);

        // Send one immediately so peers don't wait a full interval to learn about us.
        broadcast.send<ViewportUpdateMessage>('viewport_update', this.selfRect);
    }

    private measure(): ViewportRect {
        return {
            left: window.screenX,
            top: window.screenY,
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    /**
     * Returns every known viewport rect (this tab's own + all peers').
     * Used by the physics engine's floor logic and by the minimap renderer.
     */
    public getAllRects(): ViewportRect[] {
        return [this.selfRect, ...this.peerRects.values()];
    }
}

export const viewportTracker = new ViewportTracker();