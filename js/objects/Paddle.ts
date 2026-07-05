import { PhysicsBody } from '../physics/body';
import { Constants } from '../core/constants';

export class Paddle extends PhysicsBody {
    public width: number;
    public height: number;
    public isTop: boolean;

    constructor(x: number, y: number, isTop: boolean = false) {
        super(x, y, Constants.TYPES.PADDLE);
        this.width = 300;
        this.height = 20;
        this.isTop = isTop;
        
        this.setStatic();
        this.restitution = 1.2; // Extra bouncy
        this.friction = 0.0;
        this.color = '#00ffff';
    }
}
