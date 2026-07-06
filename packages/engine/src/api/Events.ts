export interface EngineEvents {
  'viewportDirty': void;
  'FRAME_STARTED': { frame: number; time: number };
  'FRAME_COMPLETED': { frame: number; time: number };
  'PROFILE_READY': any; // FrameProfile
  
  // Networking
  'net:STATE': any;
  'net:VIEWPORT': any;
  'MASTER_CHANGED': { isMaster: boolean };

  // To be expanded as Phase 5/6 architecture matures
  'WORLD_UPDATED': void;
  'GEOMETRY_REBUILT': void;
  'LAYOUT_CHANGED': void;
  'COLLISION_OCCURRED': any;
}
