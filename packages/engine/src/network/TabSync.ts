export type SyncEventHandler = (data: any, senderId: string) => void;

export class TabSync {
  private channel: BroadcastChannel;
  public tabId: string;
  private handlers: Map<string, SyncEventHandler[]> = new Map();

  constructor(channelName: string = 'tabverse') {
    this.channel = new BroadcastChannel(channelName);
    this.tabId = Math.random().toString(36).substr(2, 9);
    
    this.channel.onmessage = (event) => {
      const { type, data, senderId } = event.data;
      if (senderId === this.tabId) return; // ignore self
      
      const eventHandlers = this.handlers.get(type);
      if (eventHandlers) {
        eventHandlers.forEach(h => h(data, senderId));
      }
    };
  }

  public send(type: string, data: any) {
    this.channel.postMessage({
      type,
      data,
      senderId: this.tabId
    });
  }

  public on(type: string, handler: SyncEventHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);
  }

  public off(type: string, handler: SyncEventHandler) {
    const eventHandlers = this.handlers.get(type);
    if (eventHandlers) {
      const idx = eventHandlers.indexOf(handler);
      if (idx > -1) eventHandlers.splice(idx, 1);
    }
  }

  public cleanup() {
    this.channel.close();
  }
}
