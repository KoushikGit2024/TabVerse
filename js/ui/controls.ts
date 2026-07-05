import { camera } from '../renderer/camera';
import { sync } from '../network/sync';
import { Constants } from '../core/constants';
import { ownership } from '../network/ownership';
import { events } from '../core/events';

class Controls {
    private isDragging: boolean;

    constructor() {
        this.isDragging = false;
    }

    public init(): void {
        const startBtn = document.getElementById('btn-start');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                sync.requestSpawn('START_GAME', 0, 0);
            });
        }

        const quitBtn = document.getElementById('btn-quit');
        if (quitBtn) {
            quitBtn.addEventListener('click', () => {
                sync.requestSpawn('CLEAR', 0, 0);
                if (ownership.isOwner) {
                    sync.broadcastGameState('MENU', 0, 0);
                }
            });
        }

        // Keyboard Controls for Paddles
        let moveDir = 0;
        let leftPressed = false;
        let rightPressed = false;

        const updateDir = () => {
            const newDir = (rightPressed ? 1 : 0) - (leftPressed ? 1 : 0);
            if (newDir !== moveDir) {
                moveDir = newDir;
                sync.sendPaddleMove(moveDir);
            }
        };

        window.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
                leftPressed = true;
                updateDir();
            } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
                rightPressed = true;
                updateDir();
            }
        });

        window.addEventListener('keyup', (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
                leftPressed = false;
                updateDir();
            } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
                rightPressed = false;
                updateDir();
            }
        });

        // UI Updates based on Game State
        const scoreDisplay = document.getElementById('score-display');
        events.on(Constants.EVENTS.NET_GAME_STATE, (data: any) => {
            if (scoreDisplay) {
                if (data.status === 'GAMEOVER') {
                    scoreDisplay.innerText = 'GAME OVER';
                    scoreDisplay.style.color = '#ff00ff'; // Neon pink for game over
                    scoreDisplay.style.fontSize = '2rem';
                } else if (data.status === 'PLAYING') {
                    scoreDisplay.innerText = data.score.toString().padStart(4, '0');
                    scoreDisplay.style.color = '#fff';
                    scoreDisplay.style.fontSize = '3.5rem';
                } else {
                    scoreDisplay.innerText = '0000';
                    scoreDisplay.style.color = '#fff';
                    scoreDisplay.style.fontSize = '3.5rem';
                }
            }
        });

        // Double click / context menu spawns are removed as they disrupt the game

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