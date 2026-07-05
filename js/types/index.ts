/**
 * Core Physics and Math Types
 */
export interface Vector2 {
    x: number;
    y: number;
}

export interface CollisionManifold {
    normal: Vector2;
    penetration: number;
    contact: Vector2;
}

export interface PhysicsConfig {
    gravity: Vector2;
    fps: number;
    substeps: number;
    restitution: number;
    friction: number;
}

export interface RenderConfig {
    bloom: boolean;
    trails: boolean;
    backgroundColor: string;
    pixelRatio: number;
}

export interface NetworkConfig {
    channelName: string;
    heartbeatInterval: number;
    timeoutDuration: number;
    syncRate: number;
}

export interface LimitsConfig {
    maxObjects: number;
    maxParticles: number;
}

export interface AppConfig {
    physics: PhysicsConfig;
    render: RenderConfig;
    network: NetworkConfig;
    limits: LimitsConfig;
}

/**
 * Network Messages
 */
export type NetworkMessageType = 
    | 'heartbeat' 
    | 'heartbeat_reply' 
    | 'owner_announce' 
    | 'world_state' 
    | 'spawn_req'
    | 'grab_req'
    | 'grab_move'
    | 'grab_end'
    | 'particle_burst';

// Used to map serialized physics objects over the network
export interface SerializedPhysicsObject {
    id: string;
    t: number;      // type
    x: number;
    y: number;
    a: number;      // angle
    vx: number;
    vy: number;
    c: string;      // color
    s: number;      // size (radius or width/height proxy)
    w?: number;     // width (optional)
    h?: number;     // height (optional)
}

export interface HeartbeatMessage {
    type: 'heartbeat';
    sender: string;
    payload: null;
}

export interface HeartbeatReplyMessage {
    type: 'heartbeat_reply';
    sender: string;
    payload: null;
}

export interface OwnerAnnounceMessage {
    type: 'owner_announce';
    sender: string;
    payload: {
        creationTime: number;
    };
}

export interface WorldStateMessage {
    type: 'world_state';
    sender: string;
    payload: {
        objects: SerializedPhysicsObject[];
    };
}

export interface SpawnReqPayload {
    type: number | 'CLEAR';
    x: number;
    y: number;
    extra?: number;
}

export interface SpawnReqMessage {
    type: 'spawn_req';
    sender: string;
    payload: SpawnReqPayload;
}

export interface GrabReqMessage {
    type: 'grab_req';
    sender: string;
    payload: { x: number; y: number };
}

export interface GrabMoveMessage {
    type: 'grab_move';
    sender: string;
    payload: { x: number; y: number };
}

export interface GrabEndMessage {
    type: 'grab_end';
    sender: string;
    payload: null;
}

export interface ParticleBurstMessage {
    type: 'particle_burst';
    sender: string;
    payload: { x: number; y: number; force: number; color?: string };
}

export type NetworkMessage = 
    | HeartbeatMessage 
    | HeartbeatReplyMessage 
    | OwnerAnnounceMessage 
    | WorldStateMessage 
    | SpawnReqMessage
    | GrabReqMessage
    | GrabMoveMessage
    | GrabEndMessage
    | ParticleBurstMessage;

/**
 * Event System Types
 */

// Strongly typed event map for the EventBus
export interface AppEventMap {
    'app:init': any; // We'll type this explicitly in the app class if needed
    'tab:joined': string; // peerId
    'tab:left': string; // peerId
    'role:changed': string;
    'physics:spawned': any;
    'physics:destroyed': string; // object id
    'physics:collision': { x: number; y: number; force: number };
    'net:state_update': Array<{ timestamp: number; objects: SerializedPhysicsObject[] }>;
    'net:spawn_req': SpawnReqPayload;
    'net:destroy_req': string; // object id
    'net:grab_req': { x: number; y: number; sender: string };
    'net:grab_move': { x: number; y: number; sender: string };
    'net:grab_end': { sender: string };
    'net:particle_burst': { x: number; y: number; force: number; color?: string };
    'input:drag_start': Vector2;
    'input:drag_move': Vector2;
    'input:drag_end': Vector2;
}

export type EventKey = keyof AppEventMap;
