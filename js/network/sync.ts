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
    public stateBuffer: Array<{ timestamp: number; serverTime: number; objects: SerializedPhysicsObject[] }>;

    constructor() {
        this.lastSyncTime = 0;
        this.stateBuffer = [];
    }

    public init(): void {
        broadcast.on<WorldStateMessage>('world_state', (payload) => {
            if (!ownership.isOwner) {
                this.stateBuffer.push({
                    timestamp: performance.now(),
                    serverTime: payload.serverTime,
                    objects: payload.objects
                });

                // Keep a slightly larger buffer than before (was 5) since interpolation
                // needs at least 2 recent frames to blend between; 8 gives headroom
                // for occasional dropped/late packets without losing continuity.
                if (this.stateBuffer.length > 8) {
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
        
        broadcast.on<any>('game_state', (payload) => {
            if (!ownership.isOwner) {
                events.emit(Constants.EVENTS.NET_GAME_STATE, payload);
            }
        });

        broadcast.on<any>('paddle_update', (payload, sender) => {
            if (ownership.isOwner) {
                events.emit(Constants.EVENTS.NET_PADDLE_UPDATE, { ...payload, sender });
            }
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

            broadcast.send<WorldStateMessage>('world_state', { objects: pack, serverTime: now });
            this.lastSyncTime = now;
        }
    }

    public requestSpawn(type: number | 'CLEAR' | 'ROPE' | 'START_GAME', x: number, y: number, extra?: number): void {
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

    public broadcastGameState(status: 'MENU' | 'PLAYING' | 'GAMEOVER', score: number, paddleX: number): void {
        if (ownership.isOwner) {
            broadcast.send<any>('game_state', { status, score, paddleX });
            events.emit(Constants.EVENTS.NET_GAME_STATE, { status, score, paddleX });
        }
    }

    public sendPaddleMove(dir: number): void {
        if (ownership.isOwner) {
            events.emit(Constants.EVENTS.NET_PADDLE_UPDATE, { dir, sender: broadcast.tabId });
        } else {
            broadcast.send<any>('paddle_update', { dir });
        }
    }
}

export const sync = new Sync(); 