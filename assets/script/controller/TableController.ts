import { _decorator, Collider, Component, ICollisionEvent, Node } from 'cc';
import { PHY_GROUP } from '../manager/Layers';
import { GuestController } from './GuestController';
const { ccclass, property } = _decorator;

@ccclass('TableController')
export class TableController extends Component {
    @property(Node)
    placePos:Node = null;

    protected _collider:Collider = null;

    protected onLoad(): void {
        this._collider = this.getComponent(Collider);
        if (this._collider) {
            this._collider.on('onCollisionEnter', this.onCollisionEnter, this);
        }
    }

    protected onDestroy(): void {
        if (this._collider) {
            this._collider.off('onCollisionEnter', this.onCollisionEnter, this);
        }
    }
    
    onCollisionEnter(event: ICollisionEvent) {
        const otherCollider = event.otherCollider;
        if (otherCollider) {
            const otherNode = otherCollider.node;
            if (otherNode) {
                if (otherCollider.getGroup() == PHY_GROUP.PLAYER) {
                    const guest:GuestController = otherCollider.getComponent(GuestController);
                    if (guest) {
                        const place = this.getEmptyPlace();
                        if (place) {
                            guest.onSitdown(place);
                        }
                    }
                }
            }
        }
    }

    public getEmptyPlace() : Node {
        if (this.placePos) {
            for (let index = 0; index < this.placePos.children.length; index++) {
                const element = this.placePos.children[index];
                if (element.children.length == 0)
                    return element;
            }
        }

        return null;
    }
}


