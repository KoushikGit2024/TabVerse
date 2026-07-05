import { PhysicsBody } from '../physics/body';
import { Constants } from '../core/constants';

export class Portal extends PhysicsBody {
    public targetPortalId: string | null;
    
    constructor(x: number, y: number, color: string) {
        super(x, y, Constants.TYPES.PORTAL);
        this.setStatic();
        this.isSensor = true;
        this.radius = 50;
        this.size = 50;
        this.color = color;
        this.targetPortalId = null;
    }
}
