import { _decorator, Component, Node, tween, Vec3 } from 'cc';
import { PlayerController } from './PlayerController';
import { Item } from '../item/Item';
import { ActionTableController } from './ActionTableController';
import { GuestController } from './GuestController';
import event_html_playable from '../event_html_playable';
const { ccclass, property } = _decorator;


@ccclass('OutputController')
export class OutputController extends ActionTableController {
    @property(Node)
    placePos:Node = null;
    
    public outputCount:number = 0;
    private _guest:GuestController = null;
    
    start() {
        if (super.start)
            super.start();

        this._dropInterval = 200;
    }

    protected findEmptyPlace() : Node {
        for (let index = 0; index < this.placePos.children.length; index++) {
            const element = this.placePos.children[index];
            if (element.children.length == 0)
                return element;
        }

        return null;
    }

    protected onProcessPlayer(node:Node):boolean {
        let ret:boolean = false;
        const player:PlayerController = node.getComponent(PlayerController);
        if (player) {
            const placeNode:Node = this.findEmptyPlace();
            if (placeNode) {
                const item:Item = player.dropItem();
                if (item){
                    placeNode.addChild(item.node);
                    item.node.setPosition(Vec3.ZERO);
                    item.node.setScale(Vec3.ONE);
                    item.scaleEffect(this._dropInterval / 2000);
                }
            }

            ret = !player.isPackEmpty();
        }
        return ret;
    }

    protected onEnter(node:Node, enter:boolean):boolean {
        const player:PlayerController = node.getComponent(PlayerController);
        return player && player.onEnterOutput(enter);
    }

    update(deltaTime: number): void {
        super.update(deltaTime);

        if (this._guest) {
            const items:Item[] = this.getComponentsInChildren(Item);
            if (items) {
                for (let index = 0; index < items.length; index++) {
                    const element = items[index];
                    if (!element.isAnimating()) {
                        if (this._guest.catchItem(element)) {
                            if (this.outputCount == 0)
                                event_html_playable.trackFirstOrder();
                            
                            this.outputCount ++;
                        }
                    }
                }
            }
        }
    }

    public hasItem() : boolean {
        const items:Item[] = this.getComponentsInChildren(Item);
        return !!(items && items.length);
    }

    public arrivedGuest(guest:GuestController) : boolean {
        if (guest && this._guest)
            return false;

        this._guest = guest;

        return true;
    }

    public hasGuest() : boolean {
        return this._guest != null;
    }
}


