import { broadcast } from './broadcast';
import { app } from '../core/app';
import { Constants } from '../core/constants';
import { events } from '../core/events';

import { OwnerAnnounceMessage } from '../types/index';

/**
 * Ownership Manager
 */
class Ownership {
    public isOwner: boolean;
    public currentOwnerId: string | null;
    private electionTimer: number | null;
    private creationTime: number;
    private announceInterval: number | null;

    constructor() {
        this.isOwner = false;
        this.currentOwnerId = null;
        this.electionTimer = null;
        this.announceInterval = null;
        this.creationTime = Date.now();
    }

    public init(): void {
        broadcast.on<OwnerAnnounceMessage>('owner_announce', (payload, sender) => {
            this.currentOwnerId = sender;
            if (this.isOwner && sender !== broadcast.tabId) {
                if (payload.creationTime < this.creationTime) {
                    console.log("[Ownership] Yielding ownership to older tab.");
                    this.setClient();
                } else if (payload.creationTime === this.creationTime && sender > broadcast.tabId) {
                    console.log("[Ownership] Yielding ownership (UUID tie-breaker).");
                    this.setClient();
                }
            } else if (!this.isOwner) {
                this.setClient();
            }
        });

        events.on(Constants.EVENTS.TAB_LEFT, (peerId: string) => {
            if (peerId === this.currentOwnerId) {
                console.log("[Ownership] Owner disconnected. Triggering election...");
                this.currentOwnerId = null;
                this.startElection();
            }
        });

        setTimeout(() => {
            if (!this.currentOwnerId) {
                this.startElection();
            }
        }, 500);
    }

    private startElection(): void {
        if (this.electionTimer !== null) window.clearTimeout(this.electionTimer);
        
        const delay = Math.random() * 200 + 100; 
        
        this.electionTimer = window.setTimeout(() => {
            if (!this.currentOwnerId) {
                this.setOwner();
            }
        }, delay);
    }

    private setOwner(): void {
        if (!this.isOwner) {
            console.log("[Ownership] I am now the OWNER.");
            this.isOwner = true;
            this.currentOwnerId = broadcast.tabId;
            app.setRole(Constants.ROLES.OWNER);
            
            this.announceOwnership();
            this.announceInterval = window.setInterval(() => this.announceOwnership(), 1000);
        }
    }

    private setClient(): void {
        if (this.isOwner || app.role === Constants.ROLES.CONNECTING) {
            console.log("[Ownership] I am a CLIENT.");
            this.isOwner = false;
            app.setRole(Constants.ROLES.CLIENT);
            if (this.announceInterval !== null) {
                window.clearInterval(this.announceInterval);
                this.announceInterval = null;
            }
        }
    }

    private announceOwnership(): void {
        broadcast.send<OwnerAnnounceMessage>('owner_announce', { creationTime: this.creationTime });
    }
}

export const ownership = new Ownership();
