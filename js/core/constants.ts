import { EventKey } from '../types/index';

/**
 * System Constants
 */
export const Constants = {
    // Event Names
    EVENTS: {
        APP_INIT: 'app:init' as EventKey,
        TAB_JOINED: 'tab:joined' as EventKey,
        TAB_LEFT: 'tab:left' as EventKey,
        ROLE_CHANGED: 'role:changed' as EventKey,
        
        // Physics Events
        OBJECT_SPAWNED: 'physics:spawned' as EventKey,
        OBJECT_DESTROYED: 'physics:destroyed' as EventKey,
        COLLISION: 'physics:collision' as EventKey,

        // Network Events
        NET_STATE_UPDATE: 'net:state_update' as EventKey,
        NET_SPAWN_REQ: 'net:spawn_req' as EventKey,
        NET_DESTROY_REQ: 'net:destroy_req' as EventKey,
        NET_GRAB_REQ: 'net:grab_req' as EventKey,
        NET_GRAB_MOVE: 'net:grab_move' as EventKey,
        NET_GRAB_END: 'net:grab_end' as EventKey,
        NET_PARTICLE_BURST: 'net:particle_burst' as EventKey,
        
        // Input Events
        INPUT_DRAG_START: 'input:drag_start' as EventKey,
        INPUT_DRAG_MOVE: 'input:drag_move' as EventKey,
        INPUT_DRAG_END: 'input:drag_end' as EventKey
    },
    
    // Roles
    ROLES: {
        OWNER: 'owner',
        CLIENT: 'client',
        CONNECTING: 'connecting'
    },

    // Object Types
    TYPES: {
        BALL: 1,
        BOX: 2,
        PARTICLE: 3,
        PORTAL: 4
    }
} as const;
