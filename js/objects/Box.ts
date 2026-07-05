import { PhysicsBody } from '../physics/body';
import { Constants } from '../core/constants';
import { Vector2 } from '../types/index';

export class Box extends PhysicsBody {
    constructor(x: number, y: number, width: number, height: number) {
        super(x, y, Constants.TYPES.BOX);
        this.width = width;
        this.height = height;
        this.size = width; 
        
        this.mass = width * height * 0.01;
        this.invMass = 1 / this.mass;
        
        this.inertia = (this.mass / 12) * (width * width + height * height);
        this.invInertia = 1 / this.inertia;
    }

    public getVertices(): Vector2[] {
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        
        // Use non-null assertion since these are initialized in constructor
        const hw = this.width! / 2;
        const hh = this.height! / 2;

        return [
            { x: this.pos.x + (-hw * cos - -hh * sin), y: this.pos.y + (-hw * sin + -hh * cos) },
            { x: this.pos.x + (hw * cos - -hh * sin),  y: this.pos.y + (hw * sin + -hh * cos) },
            { x: this.pos.x + (hw * cos - hh * sin),   y: this.pos.y + (hw * sin + hh * cos) },
            { x: this.pos.x + (-hw * cos - hh * sin),  y: this.pos.y + (-hw * sin + hh * cos) }
        ];
    }
}
