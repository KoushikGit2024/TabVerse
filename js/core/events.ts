import { AppEventMap, EventKey } from '../types/index';

/**
 * Strongly Typed Event Dispatcher for decoupled module communication.
 */
class EventBus {
    private listeners: Map<EventKey, Set<(payload: any) => void>>;

    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param event - Event name
     * @param callback - Callback function
     */
    on<K extends EventKey>(event: K, callback: (payload: AppEventMap[K]) => void): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    /**
     * Unsubscribe from an event
     * @param event - Event name
     * @param callback - Callback function
     */
    off<K extends EventKey>(event: K, callback: (payload: AppEventMap[K]) => void): void {
        if (this.listeners.has(event)) {
            this.listeners.get(event)!.delete(callback as any);
        }
    }

    /**
     * Emit an event
     * @param event - Event name
     * @param payload - Data to pass to callbacks
     */
    emit<K extends EventKey>(event: K, payload: AppEventMap[K]): void {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            if (callbacks) {
                for (const callback of callbacks) {
                    try {
                        callback(payload);
                    } catch (error) {
                        console.error(`Error in event listener for ${event}:`, error);
                    }
                }
            }
        }
    }
}

// Export a singleton instance
export const events = new EventBus();
