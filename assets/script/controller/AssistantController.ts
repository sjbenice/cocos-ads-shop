import { _decorator, Component, Node, Quat, SkeletalAnimation, Vec3 } from 'cc';
import { PlayerController } from './PlayerController';
import event_html_playable from '../event_html_playable';
const { ccclass, property } = _decorator;

@ccclass('AssistantController')
export class AssistantController extends PlayerController{
    static State = {
        WAIT: 0,
        TO_TABLE: 1,
        WORKING: 2,
        TO_OUTPUT: 3,
        OUTPUT: 4,
    };

    @property
    isCashier:boolean = true;

    @property(Node)
    outputNode:Node = null;
    @property(Node)
    payZone:Node=null;

    protected _state:number = AssistantController.State.WAIT;
    protected _orgPos:Vec3 = null;
    protected _outputPos:Vec3 = null;
    protected _orgRotation:Quat = null;

    private _moveInput:Vec3 = Vec3.ZERO.clone();

    public isBot() : boolean {
        return true;
    }

    start() {
        super.start();

        this._orgPos = this.node.getPosition();
        this._orgRotation = this.node.getRotation();

        if (this.outputNode)
            this._outputPos = this.outputNode.getPosition();

        if (this.isCashier)
            event_html_playable.trackCassaUpgrade();
        else
            event_html_playable.trackKitchenUpgrade();
    }

    update(deltaTime: number) {
        this._moveInput.set(Vec3.ZERO);

        switch (this._state) {
            case AssistantController.State.WAIT:
                if (!this.payZone || !this.payZone.active) {
                    this._state = AssistantController.State.TO_TABLE;
                }
                break;
            case AssistantController.State.TO_TABLE:
                this.calcMoveInput(this._orgPos);
                break;
            case AssistantController.State.WORKING:
                if (!this.isCashier && this.isPackFull()) {
                    this._state = AssistantController.State.TO_OUTPUT;
                }
                break;
            case AssistantController.State.TO_OUTPUT:
                this.calcMoveInput(this._outputPos);
                break;
            case AssistantController.State.OUTPUT:
                if (this.isPackEmpty())
                    this._state = AssistantController.State.TO_TABLE;
                break;
        }

        super.update(deltaTime);
    }

    protected calcMoveInput(endPos:Vec3){
        if (endPos){
            this._moveInput.set(endPos);
            this._moveInput.subtract(this.node.position);
            this._moveInput.normalize();
        }else{
            this._moveInput.set(Vec3.ZERO);
        }

        return this._moveInput;
    }

    protected fetchMovementInput() : Vec3{
        return this._moveInput;
    }

    protected setOrgPosition() {
        this.node.setPosition(this._orgPos);
        this.node.setRotation(this._orgRotation);
    }

    public onEnterCash(enter:boolean): boolean {
        let ret = super.onEnterCash(enter);

        if (this.isCashier) {
            this._state = enter ? AssistantController.State.WORKING : AssistantController.State.TO_TABLE;

            if (enter) {
                this.setOrgPosition();
            }
        }

        return ret;
    }

    public onEnterCook(enter:boolean): boolean {
        if (!this.isCashier) {
            if (enter) {
                this._state = AssistantController.State.WORKING;
                this.setOrgPosition();
            } else if (this._state == AssistantController.State.WORKING)
                this._state = AssistantController.State.TO_TABLE;

            return true;
        }
        return false;
    }

    public onEnterOutput(enter: boolean): boolean {
        // let ret = super.onEnterOutput(enter);
        let ret:boolean = true;
        if (enter) {
            if (!this.isPackEmpty())
                this._state = AssistantController.State.OUTPUT;
            else
                ret = false;
        } else {
            if (!this.isPackEmpty())
                this._state = AssistantController.State.TO_OUTPUT;
        }

        return ret;
    }
}


