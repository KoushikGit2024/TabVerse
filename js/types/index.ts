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
    viewportBroadcastInterval: number; // ms between viewport gossip broadcasts
}

export interface LimitsConfig {
    maxObjects: number;
    maxParticles: number;
    maxRopeSegments: number;
}

export interface PersistenceConfig {
    dbName: string;
    storeName: string;
    saveIntervalMs: number;
}

export interface AppConfig {
    physics: PhysicsConfig;
    render: RenderConfig;
    network: NetworkConfig;
    limits: LimitsConfig;
    persistence: PersistenceConfig;
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
    | 'particle_burst'
    | 'viewport_update'
    | 'state_snapshot_response'
    | 'state_snapshot_request'
    | 'game_state'
    | 'paddle_update';

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
    linkA?: string; // id of constraint partner A (for rendering rope links), optional
    linkB?: string; // id of constraint partner B, optional
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
        /** Server (owner) timestamp in performance.now() terms, for interpolation math on clients */
        serverTime: number;
    };
}

export interface SpawnReqPayload {
    type: number | 'CLEAR' | 'ROPE' | 'START_GAME';
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

/**
 * A tab's physical viewport rectangle in world (screen) space.
 * Broadcast periodically by every tab (not just the owner) so the owner's
 * physics step knows where every "window into the world" currently is —
 * used to determine valid floor/ground regions instead of a single hardcoded floor.
 */
export interface ViewportRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

export interface ViewportUpdateMessage {
    type: 'viewport_update';
    sender: string;
    payload: ViewportRect;
}

/**
 * Persisted world snapshot, requested by a freshly-elected owner that has no
 * peers to inherit live state from, so it can restore from IndexedDB itself.
 * (No network round-trip needed for this case, but the message types are kept
 * for symmetry / future multi-owner recovery scenarios.)
 */
export interface StateSnapshotRequestMessage {
    type: 'state_snapshot_request';
    sender: string;
    payload: null;
}

export interface GameStateMessage {
    type: 'game_state';
    sender: string;
    payload: {
        status: 'MENU' | 'PLAYING' | 'GAMEOVER';
        score: number;
        paddleX: number;
    };
}

export interface PaddleUpdateMessage {
    type: 'paddle_update';
    sender: string;
    payload: {
        dir: number;
    };
}

export interface StateSnapshotResponseMessage {
    type: 'state_snapshot_response';
    sender: string;
    payload: { objects: SerializedPhysicsObject[] };
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
    | ParticleBurstMessage
    | ViewportUpdateMessage
    | StateSnapshotRequestMessage
    | StateSnapshotResponseMessage
    | GameStateMessage
    | PaddleUpdateMessage;

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
    'net:state_update': Array<{ timestamp: number; serverTime: number; objects: SerializedPhysicsObject[] }>;
    'net:spawn_req': SpawnReqPayload;
    'net:destroy_req': string; // object id
    'net:grab_req': { x: number; y: number; sender: string };
    'net:grab_move': { x: number; y: number; sender: string };
    'net:grab_end': { sender: string };
    'net:particle_burst': { x: number; y: number; force: number; color?: string };
    'net:viewport_update': { sender: string; rect: ViewportRect };
    'net:tab_left_viewport': string; // peerId whose viewport should be forgotten
    'input:drag_start': Vector2;
    'input:drag_move': Vector2;
    'input:drag_end': Vector2;
    'net:game_state': { status: 'MENU' | 'PLAYING' | 'GAMEOVER'; score: number; paddleX: number };
    'net:paddle_update': { dir: number; sender: string };
}

export type EventKey = keyof AppEventMap;