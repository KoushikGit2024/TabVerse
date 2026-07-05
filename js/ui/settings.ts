import { Config } from '../core/config';

class Settings {
    public init(): void {
        const gravityInput = document.getElementById('setting-gravity') as HTMLInputElement;
        const bounceInput = document.getElementById('setting-bounce') as HTMLInputElement;
        const frictionInput = document.getElementById('setting-friction') as HTMLInputElement;

        if (!gravityInput || !bounceInput || !frictionInput) return;

        gravityInput.addEventListener('input', (e) => {
            Config.physics.gravity.y = parseFloat((e.target as HTMLInputElement).value);
        });

        bounceInput.addEventListener('input', (e) => {
            Config.physics.restitution = parseFloat((e.target as HTMLInputElement).value);
        });

        frictionInput.addEventListener('input', (e) => {
            Config.physics.friction = parseFloat((e.target as HTMLInputElement).value);
        });
    }
}

export const settings = new Settings();
