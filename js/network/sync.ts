import { broadcast } from './broadcast';
import { ownership } from './ownership';
import { Config } from '../core/config';
import { Constants } from '../core/constants';
import { events } from '../core/events';
import { SerializedPhysicsObject, WorldStateMessage, SpawnReqMessage, SpawnReqPayload } from '../types/index';
import { PhysicsBody } from '../physics/body';

/**
 * State Synchronizer
 */
class Sync {
    private lastSyncTime: number;
    public stateBuffer: Array<{ timestamp: number; objects: SerializedPhysicsObject[] }>;

    constructor() {
        this.lastSyncTime = 0;
        this.stateBuffer = [];
    }

    public init(): void {
        broadcast.on<WorldStateMessage>('world_state', (payload) => {
            if (!ownership.isOwner) {
                this.stateBuffer.push({
                    timestamp: performance.now(),
                    objects: payload.objects
                });
                
                if (this.stateBuffer.length > 5) {
                    this.stateBuffer.shift();
                }
                
                events.emit(Constants.EVENTS.NET_STATE_UPDATE, this.stateBuffer);
            }
        });
        
        broadcast.on<SpawnReqMessage>('spawn_req', (payload) => {
            if (ownership.isOwner) {
                events.emit(Constants.EVENTS.NET_SPAWN_REQ, payload);
            }
        });

        broadcast.on<any>('grab_req', (payload, sender) => {
            if (ownership.isOwner) events.emit(Constants.EVENTS.NET_GRAB_REQ, { ...payload, sender });
        });
        broadcast.on<any>('grab_move', (payload, sender) => {
            if (ownership.isOwner) events.emit(Constants.EVENTS.NET_GRAB_MOVE, { ...payload, sender });
        });
        broadcast.on<any>('grab_end', (_payload, sender) => {
            if (ownership.isOwner) events.emit(Constants.EVENTS.NET_GRAB_END, { sender });
        });
        broadcast.on<any>('particle_burst', (payload) => {
            events.emit(Constants.EVENTS.NET_PARTICLE_BURST, payload);
        });
        
        // The owner emits COLLISION locally. Broadcast it so all clients see particles.
        events.on(Constants.EVENTS.COLLISION, (data) => {
            if (ownership.isOwner) {
                events.emit(Constants.EVENTS.NET_PARTICLE_BURST, data); // self
                broadcast.send<any>('particle_burst', data); // peers
            }
        });
    }

    public broadcastState(objects: PhysicsBody[]): void {
        if (!ownership.isOwner) return;

        const now = performance.now();
        if (now - this.lastSyncTime > (1000 / Config.network.syncRate)) {
            
            const pack: SerializedPhysicsObject[] = objects.map(obj => {
                const s: SerializedPhysicsObject = {
                    id: obj.id,
                    t: obj.type,
                    x: obj.pos.x,
                    y: obj.pos.y,
                    a: obj.angle,
                    vx: obj.vel.x,
                    vy: obj.vel.y,
                    c: obj.color,
                    s: obj.size || 0
                };
                if (obj.width !== undefined) s.w = obj.width;
                if (obj.height !== undefined) s.h = obj.height;
                return s;
            });

            broadcast.send<WorldStateMessage>('world_state', { objects: pack });
            this.lastSyncTime = now;
        }
    }
    
    public requestSpawn(type: number | 'CLEAR', x: number, y: number, extra?: number): void {
        const payload: SpawnReqPayload = { type, x, y };
        if (extra !== undefined) payload.extra = extra;

        if (ownership.isOwner) {
            events.emit(Constants.EVENTS.NET_SPAWN_REQ, payload);
        } else {
            broadcast.send<SpawnReqMessage>('spawn_req', payload);
        }
    }

    public sendGrab(action: 'start' | 'move' | 'end', x?: number, y?: number): void {
        if (action === 'start') {
            if (ownership.isOwner) events.emit(Constants.EVENTS.NET_GRAB_REQ, { x: x!, y: y!, sender: broadcast.tabId });
            else broadcast.send<any>('grab_req', { x: x!, y: y! });
        } else if (action === 'move') {
            if (ownership.isOwner) events.emit(Constants.EVENTS.NET_GRAB_MOVE, { x: x!, y: y!, sender: broadcast.tabId });
            else broadcast.send<any>('grab_move', { x: x!, y: y! });
        } else if (action === 'end') {
            if (ownership.isOwner) events.emit(Constants.EVENTS.NET_GRAB_END, { sender: broadcast.tabId });
            else broadcast.send<any>('grab_end', null);
        }
    }
}

export const sync = new Sync();
