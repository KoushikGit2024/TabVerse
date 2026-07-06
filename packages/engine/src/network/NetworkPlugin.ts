import { IPlugin, FrameContext, PluginOutput } from '../api/Plugin';
import { INetworkTransport } from '../api/Transport';
import { ServiceRegistry } from '../api/ServiceRegistry';

export interface NetworkMessage<T = any> {
  protocolVersion: 1;
  type: string;
  senderId: string;
  timestamp: number;
  payload: T;
}

export class NetworkPlugin implements IPlugin {
  public metadata = {
    id: 'NetworkPlugin',
    version: '1.0.0',
    capabilities: { requiresNetworking: true }
  };

  private transport!: INetworkTransport;
  public localId: string;
  public isMaster: boolean = false;
  
  public peers: Map<string, number> = new Map();
  private joinTimes: Map<string, number> = new Map();
  private localJoinTime: number;
  public masterId: string;

  private lastHeartbeat: number = 0;
  private messageQueue: NetworkMessage[] = [];

  constructor(localId: string) {
    this.localId = localId;
    this.masterId = localId;
    this.localJoinTime = Date.now();
  }

  public initialize(registry: ServiceRegistry) {
    const transport = registry.get<INetworkTransport>('Network');
    if (!transport) throw new Error("NetworkPlugin requires 'Network' service (INetworkTransport)");
    this.transport = transport;

    this.transport.onMessage((msg: NetworkMessage) => {
      this.messageQueue.push(msg);
    });

    registry.register('NetworkManager', this);
  }

  public onRegister() {
    this.send('HELLO', { joinTime: this.localJoinTime });
    this.evaluateMaster();
  }

  public update(context: FrameContext) {
    const now = Date.now();
    
    // Process messages
    for (const msg of this.messageQueue) {
      this.handleMessage(msg);
    }
    this.messageQueue = [];

    // Heartbeat & peer purge
    if (now - this.lastHeartbeat > 500) {
      this.heartbeat(now);
      this.lastHeartbeat = now;
    }
  }

  private heartbeat(now: number) {
    this.send('HEARTBEAT', { joinTime: this.localJoinTime });
    
    let changed = false;
    for (const [peerId, lastSeen] of this.peers.entries()) {
      if (now - lastSeen > 2000) {
        this.peers.delete(peerId);
        this.joinTimes.delete(peerId);
        changed = true;
      }
    }
    if (changed) this.evaluateMaster();
  }

  private evaluateMaster() {
    let oldestId = this.localId;
    let oldestTime = this.localJoinTime;

    for (const [peerId, joinTime] of this.joinTimes.entries()) {
      if (joinTime < oldestTime) {
        oldestTime = joinTime;
        oldestId = peerId;
      } else if (joinTime === oldestTime && peerId < oldestId) {
        oldestId = peerId;
      }
    }

    this.masterId = oldestId;
    this.isMaster = (this.localId === this.masterId);
  }

  public send(type: string, payload: any) {
    if (!this.transport) return;
    const msg: NetworkMessage = {
      protocolVersion: 1,
      type,
      senderId: this.localId,
      timestamp: Date.now(),
      payload
    };
    this.transport.send(msg);
  }

  private handleMessage(msg: NetworkMessage) {
    if (msg.senderId === this.localId) return;

    this.peers.set(msg.senderId, Date.now());

    if (msg.type === 'HELLO' || msg.type === 'HEARTBEAT') {
      if (msg.payload && msg.payload.joinTime) {
        const prevJoinTime = this.joinTimes.get(msg.senderId);
        this.joinTimes.set(msg.senderId, msg.payload.joinTime);
        if (prevJoinTime !== msg.payload.joinTime) {
          this.evaluateMaster();
        }
      }
    } else if (msg.type === 'GOODBYE') {
      this.peers.delete(msg.senderId);
      this.joinTimes.delete(msg.senderId);
      this.evaluateMaster();
    }
  }

  public shutdown() {
    this.send('GOODBYE', null);
  }
}
