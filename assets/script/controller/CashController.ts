import { _decorator, Camera, Collider, Component, director, ITriggerEvent, Label, MeshRenderer, Node, Prefab, sys, Tween, tween, UITransform, Vec3, view } from 'cc';
import { GuestController } from './GuestController';
import { PlayerController } from './PlayerController';
import { Utils } from '../util/Utils';
import { OutputController } from './OutputController';
import { SoundMgr } from '../manager/SoundMgr';
import { ActionTableController } from './ActionTableController';
const { ccclass, property } = _decorator;

@ccclass('CashController')
export class CashController extends ActionTableController {
    @property(Node)
    plusMoneyNode:Node = null;

    @property(Label)
    dollarLabel:Label = null;
    @property(OutputController)
    output:OutputController = null;

    protected static PRICE:number = 25;
    protected static MAX_OUTPUT_WAIT:number = 3;
    private _guest:GuestController = null;
    private _dollars:number = 0;

    private _plusMoneyOrgPos:Vec3 = null;
    private _plusMoneyEffectPos:Vec3 = null;
    private _plusMoneyMeshRenderers:MeshRenderer[] = null;

    public inputCount:number = 0;

    start() {
        if (super.start)
            super.start();

        this._dropInterval = 1000;

        if (this.plusMoneyNode) {
            this.plusMoneyNode.active = false;
            this._plusMoneyOrgPos = this.plusMoneyNode.position.clone();
            this._plusMoneyEffectPos = this._plusMoneyOrgPos.clone();
            this._plusMoneyEffectPos.y += 5;

            this._plusMoneyMeshRenderers = this.plusMoneyNode.getComponentsInChildren(MeshRenderer);
        }
    }

    protected onProcessPlayer(node:Node):boolean {
        if (this._guest && this.inputCount - this.output.outputCount < CashController.MAX_OUTPUT_WAIT) {
            this.addDollars(CashController.PRICE);
            this._guest.paid();
            this.showPlusMoneyAnimation();
    
            SoundMgr.playSound('sell');
    
            this.inputCount ++;
    
            return true;
        }
        return false;
    }

    protected onEnter(node:Node, enter:boolean):boolean {
        const player:PlayerController = node.getComponent(PlayerController);
        if (player && player.onEnterCash(enter)) {
            if (enter)
                player.onArriveGuest(this._guest != null);
            return true;
        }
        return false;
    }

    protected showPlusMoneyAnimation() {
        if (this.plusMoneyNode) {
            Tween.stopAllByTarget(this.plusMoneyNode);

            this.plusMoneyNode.active = true;
            this.plusMoneyNode.setPosition(this._plusMoneyOrgPos);

            this.setPlusMoneyMeshRendererAlpha(1);

            const cash:CashController = this;
            tween(this.plusMoneyNode)
            .to (this._dropInterval / 1000, {position:this._plusMoneyEffectPos}, {
                progress: (start: number, end: number, current: number, ratio: number) => {
                    cash.setPlusMoneyMeshRendererAlpha(1 - Math.pow(ratio, 5));
                    return start + (end - start) * ratio;
                }
            })
            .start();
        }
    }

    protected setPlusMoneyMeshRendererAlpha(alpha:number) {
        if (this._plusMoneyMeshRenderers){
            this._plusMoneyMeshRenderers.forEach(element => {
                Utils.setMeshRendererAlpha(element, alpha);
            });
        }
    }

    public arrivedGuest(guest:GuestController) {
        this._guest = guest;

        for (let index = 0; index < this._inputPlayers.length; index++) {
            const time = this._inputTimers[index];
            const player = this._inputPlayers[index].getComponent(PlayerController);
            if (time > 0 && player) {
                this._inputTimers[index] = sys.now();
                player.onArriveGuest(guest != null)
            }
        }
    }

    public addDollars(amount:number) {
        this._dollars += amount;
        this.showTotalDollarLabel();
    }

    public getDollars():number {
        return this._dollars;
    }

    protected showTotalDollarLabel() {
        if (this.dollarLabel)
            this.dollarLabel.string = this._dollars.toString();
    }
}


