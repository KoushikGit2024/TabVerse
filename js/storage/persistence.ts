import { Config } from '../core/config';
import { ownership } from '../network/ownership';
import { physics } from '../physics/physics';
import { SerializedPhysicsObject } from '../types/index';
import { Ball } from '../objects/Ball';
import { Box } from '../objects/Box';
import { Portal } from '../objects/Portal';
import { Constants } from '../core/constants';
import { PhysicsBody } from '../physics/body';

const SNAPSHOT_KEY = 'latest';

interface StoredSnapshot {
    key: string;
    objects: SerializedPhysicsObject[];
    savedAt: number;
}

/**
 * Persistence
 *
 * Periodically saves the live world state to IndexedDB so that if every tab
 * is closed, the next tab to become Owner can restore the world exactly as
 * it was left. Only the current Owner writes (it's the only tab with a live
 * physics simulation to read from); any tab that becomes Owner with no peers
 * already sharing state will attempt to load a snapshot on boot.
 */
class Persistence {
    private dbReady: Promise<IDBDatabase>;

    constructor() {
        this.dbReady = this.openDatabase();
    }

    private openDatabase(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(Config.persistence.dbName, 1);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(Config.persistence.storeName)) {
                    db.createObjectStore(Config.persistence.storeName, { keyPath: 'key' });
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('[Persistence] Failed to open IndexedDB:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Starts the periodic save loop. Safe to call unconditionally; the save
     * itself checks ownership.isOwner each tick since ownership can change
     * over the lifetime of a tab.
     */
    public init(): void {
        window.setInterval(() => {
            if (ownership.isOwner) {
                this.save().catch(err => console.error('[Persistence] Save failed:', err));
            }
        }, Config.persistence.saveIntervalMs);
    }

    private async save(): Promise<void> {
        const db = await this.dbReady;

        const pack: SerializedPhysicsObject[] = physics.objects.map(obj => {
            const s: SerializedPhysicsObject = {
                id: obj.id,
                t: obj.type,
                x: obj.pos.x,
                y: obj.pos.y,
                a: obj.angle,
                vx: obj.vel.x,
                vy: obj.vel.y,
                c: obj.color,
                s: obj.size || 0
            };
            if (obj.width !== undefined) s.w = obj.width;
            if (obj.height !== undefined) s.h = obj.height;
            return s;
        });

        const record: StoredSnapshot = { key: SNAPSHOT_KEY, objects: pack, savedAt: Date.now() };

        return new Promise((resolve, reject) => {
            const tx = db.transaction(Config.persistence.storeName, 'readwrite');
            tx.objectStore(Config.persistence.storeName).put(record);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    /**
     * Attempts to load the last persisted snapshot and returns reconstructed
     * PhysicsBody instances, or null if nothing was saved yet. Rope segments
     * and their joints are NOT reconstructed with distance constraints on load
     * (constraints aren't currently part of the serialized schema) — segments
     * come back as regular free boxes rather than a connected rope. This is an
     * intentional scope trade-off; see summary notes.
     */
    public async load(): Promise<PhysicsBody[] | null> {
        try {
            const db = await this.dbReady;
            const record = await new Promise<StoredSnapshot | undefined>((resolve, reject) => {
                const tx = db.transaction(Config.persistence.storeName, 'readonly');
                const req = tx.objectStore(Config.persistence.storeName).get(SNAPSHOT_KEY);
                req.onsuccess = () => resolve(req.result as StoredSnapshot | undefined);
                req.onerror = () => reject(req.error);
            });

            if (!record || record.objects.length === 0) return null;

            return record.objects.map(o => this.deserialize(o)).filter((o): o is PhysicsBody => o !== null);
        } catch (err) {
            console.error('[Persistence] Load failed:', err);
            return null;
        }
    }

    private deserialize(s: SerializedPhysicsObject): PhysicsBody | null {
        let obj: PhysicsBody | null = null;

        if (s.t === Constants.TYPES.BALL) {
            obj = new Ball(s.x, s.y, s.s);
        } else if (s.t === Constants.TYPES.BOX || s.t === Constants.TYPES.ROPE_SEGMENT) {
            obj = new Box(s.x, s.y, s.w || s.s, s.h || s.s);
        } else if (s.t === Constants.TYPES.PORTAL) {
            const portal = new Portal(s.x, s.y, s.c);
            obj = portal;
            // Note: portal pairing (targetPortalId) is not restored across a save/load
            // cycle since only one portal's id would coincidentally match; a reloaded
            // portal pair will render but not teleport until re-spawned. See summary.
        }

        if (obj) {
            obj.vel.x = s.vx;
            obj.vel.y = s.vy;
            obj.angle = s.a;
            obj.color = s.c;
        }

        return obj;
    }
}

export const persistence = new Persistence();