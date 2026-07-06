import { TabSync } from './TabSync';

export enum TabRole {
  UNKNOWN,
  MASTER,
  CLIENT
}

export class Ownership {
  private role: TabRole = TabRole.UNKNOWN;
  private tabId: string;
  private sync: TabSync;

  private electionTimeout: number | null = null;
  private heartbeats: Map<string, { lastSeen: number, isMaster: boolean }> = new Map();
  
  public onRoleChanged: ((role: TabRole) => void) | null = null;
  public onConnectedTabsChanged: ((count: number, masterId: string | null) => void) | null = null;

  constructor(tabId: string, sync: TabSync) {
    this.tabId = tabId;
    this.sync = sync;

    this.sync.on('heartbeat', (data: any, sender: string) => {
      this.heartbeats.set(sender, { lastSeen: Date.now(), isMaster: data.isMaster });
      if (data.isMaster) {
        if (this.role === TabRole.UNKNOWN) {
          this.setRole(TabRole.CLIENT);
        } else if (this.role === TabRole.MASTER && sender < this.tabId) {
          // Tie-breaker: lowest ID wins
          this.setRole(TabRole.CLIENT);
        }
      }
      this.notifyTabsChanged();
    });

    this.sync.on('election_request', (_data: any, _sender: string) => {
      if (this.role === TabRole.MASTER) {
        this.sync.send('heartbeat', { isMaster: true });
      }
    });

    this.sync.on('tab_closed', (_data: any, sender: string) => {
      this.heartbeats.delete(sender);
      this.notifyTabsChanged();
      // If we are a client and the master closed, trigger an election
      if (this.role === TabRole.CLIENT) {
        this.startElection();
      }
    });

    // Clean up dead tabs periodically
    setInterval(() => {
      this.ping(); // Send heartbeat every 500ms

      const now = Date.now();
      let changed = false;
      let masterAlive = false;

      for (const [id, info] of this.heartbeats.entries()) {
        if (now - info.lastSeen > 2000) {
          this.heartbeats.delete(id);
          changed = true;
        } else if (info.isMaster) {
          masterAlive = true;
        }
      }
      
      if (changed) {
        this.notifyTabsChanged();
      }

      if (this.role === TabRole.CLIENT && !masterAlive) {
        this.startElection();
      }
    }, 500);

    // Initial election
    this.startElection();
  }

  public getRole(): TabRole {
    return this.role;
  }

  public getActiveTabCount(): number {
    return this.heartbeats.size + 1; // Others + self
  }

  public ping() {
    this.sync.send('heartbeat', { isMaster: this.role === TabRole.MASTER });
  }

  private startElection() {
    this.role = TabRole.UNKNOWN;
    this.sync.send('election_request', {});
    
    if (this.electionTimeout) clearTimeout(this.electionTimeout);
    
    this.electionTimeout = window.setTimeout(() => {
      if (this.role === TabRole.UNKNOWN) {
        // No master responded, we become master
        this.setRole(TabRole.MASTER);
      }
    }, 150) as unknown as number; // Wait 150ms for a heartbeat
  }

  private setRole(role: TabRole) {
    if (this.role !== role) {
      this.role = role;
      this.ping();
      this.onRoleChanged?.(this.role);
    }
  }

  private notifyTabsChanged() {
    // Figure out who master is
    // Actually we only know if someone sent a heartbeat with isMaster: true recently
    this.onConnectedTabsChanged?.(this.getActiveTabCount(), this.role === TabRole.MASTER ? this.tabId : "unknown");
  }

  public cleanup() {
    this.sync.send('tab_closed', {});
  }
}
