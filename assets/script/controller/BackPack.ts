import { _decorator, CCInteger, Component, instantiate, Node, Prefab, tween, v3, Vec3 } from 'cc';
import { Item } from '../item/Item';
import { SoundMgr } from '../manager/SoundMgr';
const { ccclass, property } = _decorator;

@ccclass('BackPack')
export class BackPack extends Component {
    frontPos:Node;

    protected static FRONT_POS:Vec3 = v3(0, 0.8, 0.37);
    protected frontItemMax:number = 2;

    protected start(): void {
        this.frontPos = new Node('frontPos');
        this.frontPos.setPosition(BackPack.FRONT_POS);
        this.node.addChild(this.frontPos);
    }

    public getItemCount():number {
        const pos = this.frontPos;
        return pos ? pos.children.length : 0;
    }

    public isFull():boolean {
        return !this.frontPos || this.frontPos.children.length >= this.frontItemMax;
    }

    public isEmpty():boolean {
        return this.frontPos && this.frontPos.children.length == 0;
    }

    public addItem(item:Item) : boolean {
        if (this.isFull())
            return false;

        const packPos:Node = this.frontPos;
        if (!packPos)
            return false;

        const worldScale:Vec3 = item.node.getWorldScale();
        item.node.setParent(packPos);
        item.node.setWorldScale(worldScale);

        const dimension = item.getHalfDimension();
        let yPos: number = 0;
        if (packPos.children.length > 1) {
            const lastItem:Item = packPos.children[packPos.children.length - 2].getComponent(Item);
            yPos = dimension.y + lastItem.node.position.y;
        }

        item.node.setPosition(v3(0, yPos + dimension.y, 0));
        item.scaleEffect(0.3);

        SoundMgr.playSound("get_order");

        return true;
    }

    public dropOne(worldPos:Vec3 = null) : Item {
        const packPos:Node = this.frontPos;
        if (packPos) {
            for (let index = packPos.children.length - 1; index >= 0; index--) {
                const element = packPos.children[index];
                const item:Item = element.getComponent(Item);
                if (worldPos){
                    const pos = element.getWorldPosition();
                    worldPos.set(pos.x, pos.y, pos.z);
                }
                packPos.removeChild(element);

                const yDelta : number = item.getHalfDimension().y * 2;
                for (let j = index; j < packPos.children.length; j++) {
                    const element = packPos.children[j];
                    element.setPosition(v3(0, element.position.y - yDelta, 0));
                }

                SoundMgr.playSound("give_away_order");

                return item;
            }
        }

        return null;
    }
}


