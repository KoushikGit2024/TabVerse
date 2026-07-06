export class BroadcastTransport {
  private channel: BroadcastChannel;
  private messageHandlers: ((msg: any) => void)[] = [];

  constructor(channelName: string = 'tve_sync') {
    this.channel = new BroadcastChannel(channelName);
    this.channel.onmessage = (e) => {
      for (const handler of this.messageHandlers) {
        handler(e.data);
      }
    };
  }

  public send(msg: any) {
    this.channel.postMessage(msg);
  }

  public onMessage(handler: (msg: any) => void) {
    this.messageHandlers.push(handler);
  }
}
