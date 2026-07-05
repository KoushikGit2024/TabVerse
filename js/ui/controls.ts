import { camera } from '../renderer/camera';
import { sync } from '../network/sync';
import { Constants } from '../core/constants';

class Controls {
    private isDragging: boolean;

    constructor() {
        this.isDragging = false;
    }

    public init(): void {
        document.getElementById('btn-spawn-box')!.addEventListener('click', () => {
            const worldX = camera.x + window.innerWidth / 2;
            const worldY = camera.y + window.innerHeight / 2;
            sync.requestSpawn(Constants.TYPES.BOX, worldX, worldY);
        });

        document.getElementById('btn-spawn-portal')!.addEventListener('click', () => {
            const worldX = camera.x + window.innerWidth / 2;
            const worldY = camera.y + window.innerHeight / 2;
            sync.requestSpawn(Constants.TYPES.PORTAL, worldX - 200, worldY);
        });

        document.getElementById('btn-spawn-ball')!.addEventListener('click', () => {
            const worldX = camera.x + window.innerWidth / 2;
            const worldY = camera.y + window.innerHeight / 2;
            sync.requestSpawn(Constants.TYPES.BALL, worldX, worldY);
        });

        document.getElementById('btn-clear')!.addEventListener('click', () => {
            sync.requestSpawn('CLEAR', 0, 0);
        });

        window.addEventListener('mousedown', (e: MouseEvent) => {
            if (e.button === 0 && (e.target as HTMLElement).id === 'worldCanvas') {
                this.isDragging = true;
                const worldX = camera.x + e.clientX;
                const worldY = camera.y + e.clientY;
                sync.sendGrab('start', worldX, worldY);
            }
        });

        window.addEventListener('mousemove', (e: MouseEvent) => {
            if (this.isDragging) {
                const worldX = camera.x + e.clientX;
                const worldY = camera.y + e.clientY;
                sync.sendGrab('move', worldX, worldY);
            }
        });

        window.addEventListener('mouseup', (e: MouseEvent) => {
            if (e.button === 0 && this.isDragging) {
                this.isDragging = false;
                sync.sendGrab('end');
            }
        });
    }
}

export const controls = new Controls();
