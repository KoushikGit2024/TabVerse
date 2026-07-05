import { broadcast } from './broadcast';
import { Config } from '../core/config';
import { Constants } from '../core/constants';
import { events } from '../core/events';
import { HeartbeatMessage, HeartbeatReplyMessage } from '../types/index';

interface PeerData {
    lastSeen: number;
}

/**
 * Heartbeat Manager
 */
class Heartbeat {
    private peers: Map<string, PeerData>;

    constructor() {
        this.peers = new Map();
    }

    public init(): void {
        broadcast.on<HeartbeatMessage>('heartbeat', (_payload, sender) => {
            const isNew = !this.peers.has(sender);
            this.peers.set(sender, { lastSeen: Date.now() });
            
            if (isNew) {
                console.log(`[Network] Peer joined: ${sender}`);
                events.emit(Constants.EVENTS.TAB_JOINED, sender);
                
                broadcast.send<HeartbeatReplyMessage>('heartbeat_reply', null);
            }
        });

        broadcast.on<HeartbeatReplyMessage>('heartbeat_reply', (_payload, sender) => {
            if (!this.peers.has(sender)) {
                this.peers.set(sender, { lastSeen: Date.now() });
                console.log(`[Network] Peer discovered via reply: ${sender}`);
                events.emit(Constants.EVENTS.TAB_JOINED, sender);
            } else {
                this.peers.get(sender)!.lastSeen = Date.now();
            }
        });

        this.startHeartbeat();
        this.startCleanup();
        
        broadcast.send<HeartbeatMessage>('heartbeat', null);
    }

    private startHeartbeat(): void {
        window.setInterval(() => {
            broadcast.send<HeartbeatMessage>('heartbeat', null);
        }, Config.network.heartbeatInterval);
    }

    private startCleanup(): void {
        window.setInterval(() => {
            const now = Date.now();
            for (const [peerId, data] of Array.from(this.peers.entries())) {
                if (now - data.lastSeen > Config.network.timeoutDuration) {
                    console.log(`[Network] Peer timeout: ${peerId}`);
                    this.peers.delete(peerId);
                    events.emit(Constants.EVENTS.TAB_LEFT, peerId);
                }
            }
        }, Config.network.heartbeatInterval / 2);
    }
    
    public getPeerCount(): number {
        return this.peers.size;
    }
    
    public getPeers(): string[] {
        return Array.from(this.peers.keys());
    }
}

export const heartbeat = new Heartbeat();
