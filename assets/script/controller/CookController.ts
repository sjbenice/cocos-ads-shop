import { _decorator, Collider, Component, instantiate, ITriggerEvent, Node, Prefab, sys } from 'cc';
import { PlayerController } from './PlayerController';
import { CashController } from './CashController';
import { Item } from '../item/Item';
import { ActionTableController } from './ActionTableController';
const { ccclass, property } = _decorator;

@ccclass('CookController')
export class CookController extends ActionTableController {
    @property(Prefab)
    itemPrefab:Prefab = null;

    protected onProcessPlayer(node:Node):boolean {
        const player:PlayerController = node.getComponent(PlayerController);
        if (player && !player.isPackFull()) {
            const item = instantiate(this.itemPrefab);
            player.catchItem(item.getComponent(Item));
            return true;
        }
        return false;
    }

    protected onEnter(node:Node, enter:boolean):boolean {
        const player:PlayerController = node.getComponent(PlayerController);
        return player && player.onEnterCook(enter);
    }
}


