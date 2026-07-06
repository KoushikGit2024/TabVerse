export class BrowserViewport {
  public getSnapshot() {
    const xOffset = (window.outerWidth - window.innerWidth) / 2;
    const yOffset = window.outerHeight - window.innerHeight - xOffset;
    
    return {
      screenX: window.screenX,
      screenY: window.screenY,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      xOffset,
      yOffset
    };
  }
}
