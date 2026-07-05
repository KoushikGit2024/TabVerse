import { Config } from '../core/config';
import { Random } from '../utilities/random';
import { NetworkMessage, NetworkMessageType } from '../types/index';

/**
 * BroadcastWrapper
 * Handles communication between browser tabs using BroadcastChannel API.
 */
class BroadcastWrapper {
    public channel: BroadcastChannel;
    public tabId: string;
    private listeners: Map<NetworkMessageType, Set<(payload: any, sender: string) => void>>;

    constructor() {
        this.channel = new BroadcastChannel(Config.network.channelName);
        this.tabId = Random.uuid();
        this.listeners = new Map();

        this.channel.onmessage = (event: MessageEvent<NetworkMessage>) => {
            const { type, sender, payload } = event.data;
            
            if (sender === this.tabId) return;

            if (this.listeners.has(type)) {
                for (const callback of this.listeners.get(type)!) {
                    callback(payload, sender);
                }
            }
        };
    }

    /**
     * Send a message to all other tabs
     * @param type - Message type
     * @param payload - Message payload
     */
    public send<T extends NetworkMessage>(type: T['type'], payload: T['payload']): void {
        this.channel.postMessage({
            type,
            sender: this.tabId,
            payload
        });
    }

    /**
     * Subscribe to a specific network message type
     * @param type - Message type
     * @param callback - Callback (payload, senderId)
     */
    public on<T extends NetworkMessage>(
        type: T['type'], 
        callback: (payload: T['payload'], senderId: string) => void
    ): void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)!.add(callback);
    }
}

export const broadcast = new BroadcastWrapper();
