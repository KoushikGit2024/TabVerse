import { app } from './core/app';
import { Constants } from './core/constants';
import { events } from './core/events';
import { heartbeat } from './network/heartbeat';
import { ownership } from './network/ownership';
import { sync } from './network/sync';
import { physics } from './physics/physics';
import { renderer } from './renderer/renderer';
import { controls } from './ui/controls';
import { audio } from './audio/audio';
import { hud } from './ui/hud';
import { settings } from './ui/settings';
import { particles } from './renderer/particles';

// Entry point when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize core app
    app.init();
    
    // 2. Initialize networking
    heartbeat.init();
    ownership.init();
    sync.init();

    // 3. Initialize physics
    physics.init();

    // 4. Initialize renderer
    renderer.init();

    // 5. Initialize Interaction & UI
    controls.init();
    audio.init();
    hud.init();
    settings.init();
    particles.init();
    
    // 2. Setup temporary UI updates (until HUD module is built)
    const roleIndicator = document.getElementById('status-indicator')!;
    const roleText = document.getElementById('stat-role')!;
    
    events.on(Constants.EVENTS.ROLE_CHANGED, (role: string) => {
        roleText.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        
        // Update indicator class
        roleIndicator.className = '';
        if (role === Constants.ROLES.OWNER) {
            roleIndicator.classList.add('status-owner');
            roleIndicator.textContent = 'Owner';
        } else if (role === Constants.ROLES.CLIENT) {
            roleIndicator.classList.add('status-client');
            roleIndicator.textContent = 'Client';
        } else {
            roleIndicator.classList.add('status-connecting');
            roleIndicator.textContent = 'Connecting...';
        }
    });

    // Default to connecting, network module will change this soon
    app.setRole(Constants.ROLES.CONNECTING);
});
