import { PhysicsBody } from '../physics/body';
import { Constants } from '../core/constants';

export class Ball extends PhysicsBody {
    constructor(x: number, y: number, radius: number) {
        super(x, y, Constants.TYPES.BALL);
        this.size = radius;
        this.radius = radius;
        
        this.mass = Math.PI * radius * radius * 0.01;
        this.invMass = 1 / this.mass;
        
        this.inertia = 0.5 * this.mass * radius * radius;
        this.invInertia = 1 / this.inertia;
    }
}
