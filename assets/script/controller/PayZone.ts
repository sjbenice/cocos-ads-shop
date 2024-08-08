import { _decorator, Collider, Component, EAxisDirection, ITriggerEvent, Node, sys, Tween, tween, v3, Vec3 } from 'cc';
import { PlayerController } from './PlayerController';
import { Item } from '../item/Item';
import { Boundary } from '../util/Boundary';
import { ParabolaTween } from '../util/ParabolaTween';
import { Number3d } from '../util/Number3d';
import { CashController } from './CashController';
import { SoundMgr } from '../manager/SoundMgr';
const { ccclass, property } = _decorator;

@ccclass('PayZone')
export class PayZone extends Component {
    @property
    price: number = 50;

    dropInterval: number = 100; // Interval in milliseconds
    effectScale: number = 0.5;
    payUnit:number = 5;

    @property(Number3d)
    number3d:Number3d = null;
    @property(Node)
    vfx:Node = null;
    @property(CashController)
    cash:CashController = null;
    @property(Node)
    unlockAvatar:Node = null;
    @property(Node)
    unlockPayZone: Node;
    @property(Node)
    hideWorkArea:Node = null;

    @property(Node)
    progress: Node;
    @property({ type: EAxisDirection })
    progressDirection: EAxisDirection = EAxisDirection.X_AXIS;

    private _collider:Collider = null;
    private _dropTimer: number = 0;
    private _player:PlayerController = null;
    private _paied:number = 0;
    private _scaleTo:Vec3 = v3(1.5, 1, 1.5);

    private _isTweenRunning:boolean = false;
    private _progressOrgScale:Vec3 = null;
    private _progressDimension:Vec3 = null;

    start() {
        this.number3d.setValue(this.price);

        this._progressOrgScale = this.progress.scale.clone();
        this._progressDimension = Boundary.getMeshDimension(this.progress, true);
        this.showProgress();

        this._collider = this.node.getComponent(Collider);

        if (this._collider) {
            this._collider.on('onTriggerEnter', this.onTriggerEnter, this);
            this._collider.on('onTriggerExit', this.onTriggerExit, this);
        }
    }

    onDestroy() {
        if (this._collider) {
            this._collider.off('onTriggerEnter', this.onTriggerEnter, this);
            this._collider.off('onTriggerExit', this.onTriggerExit, this);
        }
    }

    onTriggerEnter (event: ITriggerEvent) {
        const player:PlayerController = PlayerController.checkPlayer(event.otherCollider, true);
        if (player){
            this._player = player;
            this._dropTimer = sys.now();
        }
    }

    onTriggerExit (event: ITriggerEvent) {
        const player:PlayerController = PlayerController.checkPlayer(event.otherCollider, true);
        if (player && this._player == player){
            this._dropTimer = null;
        }
        if (this.vfx && this.vfx.active)
            this.vfx.active = false;
    }

    public getRemainedPrice() {
        return this.price - this._paied;
    }

    protected scaleEffect() {
        if (!this._isTweenRunning){
            this._isTweenRunning = true;
            tween(this.node)
                .to(0.2, {scale:this._scaleTo}, { easing: 'circIn' })
                .to(0.2, {scale:Vec3.ONE}, { easing: 'circIn' })
                .union()
                .call(() => {
                    // Set the flag to false when the tween completes
                    this._isTweenRunning = false;
                })
                .start()
        }
    }

    public isCompleted() : boolean {
        return this._paied >= this.price;
    }
    
    private showProgress() {
        const pos = this.progress.position;
        const scale = this._paied / this.price;

        switch (this.progressDirection) {
            case EAxisDirection.X_AXIS:
                this.progress.setScale(this._progressOrgScale.x * scale, this._progressOrgScale.y, this._progressOrgScale.z);
                this.progress.setPosition(- (1 - scale) * this._progressDimension.x /2, pos.y, pos.z);
                break;
            case EAxisDirection.Y_AXIS:
                this.progress.setScale(this._progressOrgScale.x, this._progressOrgScale.y * scale, this._progressOrgScale.z);
                this.progress.setPosition(pos.x, - (1 - scale) * this._progressDimension.y / 2, pos.z);
                break;
            case EAxisDirection.Z_AXIS:
                this.progress.setScale(this._progressOrgScale.x, this._progressOrgScale.y, this._progressOrgScale.z * scale);
                this.progress.setPosition(pos.x, pos.y, - (1 - scale) * this._progressDimension.z / 2);
                break;
        }
    }

    update(deltaTime: number) {
        if (this._dropTimer > 0 && sys.now() > this._dropTimer + this.dropInterval && !this.isCompleted()) {
            if (this.cash && this.cash.getDollars() > 0) {
                if (this.vfx && !this.vfx.active){
                    this.vfx.active = true;
                    this.scaleEffect();
                }
    
                this.cash.addDollars(-this.payUnit);
                this._paied += this.payUnit;
                SoundMgr.playSound("money");

                this.showProgress();

                this.number3d.setValue(this.getRemainedPrice());

                if (this.isCompleted()) {
                    SoundMgr.playSound("purchase_staff");

                    this.scaleEffect();
                    this.vfx.active = false;

                    this.scheduleOnce(()=>{
                        this.node.active = false;
                        if (this.hideWorkArea)
                            this.hideWorkArea.active = false;
                        if (this.unlockAvatar)
                            this.unlockAvatar.active = true;
                    }, 0.5);

                    // if (this.unlockPayZone)
                    //     this.unlockPayZone.active = true;
                    
                    this._dropTimer = 0;
                } else
                    this._dropTimer = sys.now();
            } else
                this.vfx.active = false;
        }
    }
}


