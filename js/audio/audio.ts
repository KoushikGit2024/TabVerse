import { events } from '../core/events';
import { Constants } from '../core/constants';
import { MathUtils } from '../utilities/math';

class AudioSystem {
    private ctx: AudioContext | null;
    private initialized: boolean;

    constructor() {
        this.ctx = null;
        this.initialized = false;
    }

    public init(): void {
        const initAudio = () => {
            if (!this.initialized) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                this.ctx = new AudioContextClass();
                this.initialized = true;
                window.removeEventListener('click', initAudio);
                window.removeEventListener('keydown', initAudio);
            }
        };

        window.addEventListener('click', initAudio);
        window.addEventListener('keydown', initAudio);

        events.on(Constants.EVENTS.COLLISION, (data) => {
            this.playBounce(data.force);
        });
    }

    private playBounce(force: number): void {
        if (!this.initialized || !this.ctx) return;

        const f = MathUtils.clamp(force, 10, 1000);
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        
        const freq = MathUtils.lerp(800, 200, f / 1000);
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(Math.min(f / 500, 0.5), this.ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }
}

export const audio = new AudioSystem();
