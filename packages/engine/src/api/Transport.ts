export interface INetworkTransport {
  send(msg: any): void;
  onMessage(handler: (msg: any) => void): void;
}
