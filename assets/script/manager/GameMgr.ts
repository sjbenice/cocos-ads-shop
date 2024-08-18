import { _decorator, CCInteger, Component, director, Game, input, Input, instantiate, Node, Prefab, Quat, randomRange, Toggle, toRadian, Tween, tween, v3, Vec3 } from 'cc';
import { SoundMgr } from './SoundMgr';
import { GuestController } from '../controller/GuestController';
import { PlayerController } from '../controller/PlayerController';
import { PayZone } from '../controller/PayZone';
import { Utils } from '../util/Utils';
import { TableController } from '../controller/TableController';
import { OutputController } from '../controller/OutputController';
import { CashController } from '../controller/CashController';
import event_html_playable from '../event_html_playable';
const { ccclass, property } = _decorator;

@ccclass('GameMgr')
export class GameMgr extends Component {

    static VERSION = {
        FULL: 1,
    };

    @property(Prefab)
    guestSamples:Prefab[] = [];

    @property(Node)
    path2cash:Node = null;

    @property(Node)
    path2output:Node = null;

    @property(Node)
    path2back:Node = null;

    @property(Node)
    cash:Node = null;

    @property(Node)
    output:Node = null;

    @property(Node)
    tableGroup:Node = null;

    @property(Node)
    tutorialPoints:Node[] = [];

    @property(Node)
    tutorialArrow:Node;
    
    @property(Node)
    playerNode:Node = null;

    @property(Node)
    firstPayZone:Node = null;

    @property(Node)
    guestGroup:Node = null;

    @property(Node)
    btnSound:Node = null;

    private _player:PlayerController = null;
    private _outputController:OutputController = null;
    private _cashController:CashController = null;

    static State = {
        SPLASH: -1,
        CASH: 0,
        COOK: 1,
        OUTPUT: 2,
        BUY_COOK: 3,
        BUY_CASHIER: 4,
        END: 5,
    };

    protected static _tutorialRangeSqrt:number = 4;
    private static _instance: GameMgr = null;

    private _state: number = GameMgr.State.SPLASH;
    private _buyState: number = GameMgr.State.BUY_COOK;

    private _targetPos:Vec3 = v3(0, 0, 0);
    private _targetPos1:Vec3 = v3(0, 0, 0);
    private _targetPos2:Vec3 = v3(0, 0, 0);
    private _tutorialDirection:Vec3 = v3(0, 0, 0);

    private _version:number = 0;

    private _firstCook:boolean = true;

    private _guestArriveInterval:number = 4;
    private _guestIndice:number[] = null;
    private _tables:TableController[] = null;

    private _isGameEnd:boolean = false;

    onLoad() {
        if (GameMgr._instance) {
            this.node.destroy();
            return;
        }
        GameMgr._instance = this;
        director.addPersistRootNode(this.node);

        if (this.tableGroup)
            this._tables = this.tableGroup.getComponentsInChildren(TableController);

        if (this.cash)
            this._cashController = this.cash.getComponent(CashController);

        if (this.output)
            this._outputController = this.output.getComponent(OutputController);

        this._version = parseInt(Utils.getUrlParameter('version'), 10);
        if (!this._version)
            this._version = GameMgr.VERSION.FULL;
        console.log(this._version);
    }

    protected onDestroy(): void {
        this.unscheduleAllCallbacks();

        if (GameMgr._instance == this)
            GameMgr._instance = null;

        if (!this._isGameEnd)
            event_html_playable.trackExit();
    }

    public static getTutorialDirection(curPos:Vec3) {
        if (GameMgr._instance) {
            GameMgr._instance._tutorialDirection.set(GameMgr._instance._targetPos);
            GameMgr._instance._tutorialDirection.subtract(curPos);
            GameMgr._instance._tutorialDirection.y = 0;
            if (GameMgr._instance._tutorialDirection.lengthSqr() < GameMgr._tutorialRangeSqrt)
                return null;

            GameMgr._instance._tutorialDirection.normalize();

            return GameMgr._instance._tutorialDirection;
        }

        return null;
    }

    // public static assistantSellApple() {
    //     if (GameMgr._instance && GameMgr._instance._version == GameMgr.VERSION.ASSISTANT_SELL_APPLE)
    //         GameMgr._instance.gotoFirstScene();
    // }

    protected movePlayerOutRange(origin:Vec3) : boolean{
        origin.y = 0;
        if (this._player) {
            const curPos = this._player.node.getWorldPosition();
            curPos.subtract(origin);
            curPos.y = 0;
            if (curPos.lengthSqr() < GameMgr._tutorialRangeSqrt) {
                curPos.normalize();
                curPos.multiplyScalar(Math.sqrt(GameMgr._tutorialRangeSqrt));

                curPos.add(origin);
                this._player.node.setWorldPosition(curPos);

                return true;
            }
        }
        return false;
    }

    start() {
        event_html_playable.game_start();

        // this._guestIndice = Array.from({ length: 1 }, (_, index) => index);
        this._guestIndice = Array.from({ length: this.guestSamples.length }, (_, index) => index);
        Utils.shuffleArray(this._guestIndice);
        this.createGuest(false);
        this.createGuest(false);
        this.createGuest(true);

        if (this.tutorialArrow){
            const q = Quat.fromAxisAngle(new Quat(), Vec3.UNIT_Y, toRadian(180));
            tween(this.tutorialArrow).to(2, {rotation:q}, {easing:'linear'}).repeatForever().start();
        }

        if (this.playerNode)
            this._player = this.playerNode.getComponent(PlayerController);

        this.setState(GameMgr.State.CASH);

        if (event_html_playable.hideAllButton() || event_html_playable.hideSoundButton()) {
            if (this.btnSound)
                this.btnSound.active = false;
        }
    }

    protected createGuest(next:boolean) {
        if (this._guestIndice.length > 0) {
            const index = this._guestIndice.pop();
            const guest:Node = instantiate(this.guestSamples[index]);
            this.guestGroup.addChild(guest);

            guest.getComponent(GuestController).setParams(this.path2cash, this.path2output, 
                this.path2back, this.cash, this.output, this._tables,
                this.guestGroup.children.length - 1);

            if (next && this._guestIndice.length) {
                this.scheduleOnce(()=>{
                    this.createGuest(true);
                }, randomRange(this._guestArriveInterval * 0.7, this._guestArriveInterval));
            }
        }
    }

    protected setState(state:number) {
        if (state != this._state){
            this._state = state;

            if (this.tutorialArrow && this.tutorialPoints && state < this.tutorialPoints.length) {
                Tween.stopAllByTarget(this.tutorialArrow);

                this.tutorialPoints[state].getWorldPosition(this._targetPos);
                this._targetPos.y = 4;
                this._targetPos1.set(this._targetPos);
                this._targetPos1.y -= 1;
                this.tutorialArrow.setWorldPosition(this._targetPos);

                tween(this.tutorialArrow)
                .to(0.5, {position:this._targetPos1}, {easing:'quadInOut'})
                .to(0.5, {position:this._targetPos}, {easing:'quadInOut'})
                .union()
                .repeatForever()
                .start();
            }
        }
    }

    update(deltaTime: number) {
        if (this._player) {
            const tutorDirection = GameMgr.getTutorialDirection(this._player.node.getWorldPosition());
            this._player.adjustTutorArrow(tutorDirection, deltaTime);
            this.tutorialArrow.active = tutorDirection != null;

            if (this.firstPayZone) {
                const payZone:PayZone = this.firstPayZone.getComponent(PayZone);
                const remainedPrice = payZone.getRemainedPrice()
                if (!this.firstPayZone.active) {
                    if (remainedPrice <= 0) {
                        this.firstPayZone = payZone.unlockPayZone;
                        this._buyState ++;

                        if (!this.firstPayZone)
                            this.gotoFirstScene();

                    } else if (this._cashController.getDollars() >= remainedPrice) {
                        this.firstPayZone.active = true;
                    }
                }
                
                if (this.firstPayZone && this.firstPayZone.active && this._cashController.getDollars() >= remainedPrice) {
                    this.setState(this._buyState);
                    return;
                }
            }

            if (this._player.isPackEmpty()) {
                if (this._firstCook || 
                    (this._buyState <= GameMgr.State.BUY_COOK && this._outputController.hasGuest() && !this._outputController.hasItem()))
                    this.setState(GameMgr.State.COOK);
                else
                    this.setState(GameMgr.State.CASH);
            }else {
                this._firstCook = false;
                this.setState(GameMgr.State.OUTPUT);
            }
        }
    }

    public gotoFirstScene() {
        if (this._isGameEnd) return;

        this._isGameEnd = true;

        event_html_playable.game_end();

        this.scheduleOnce(()=>{
            const scheduler = director.getScheduler();
            scheduler.unscheduleAll();
            Tween.stopAll();

            this._state = GameMgr.State.SPLASH;

            this.node.destroy();

            SoundMgr.destroyMgr();
            director.loadScene("first");
        }, 2);
    }

    onToggleSound(target: Toggle) {
        SoundMgr.setPref(true, target.isChecked ? 1 : 0);
        SoundMgr.setPref(false, target.isChecked ? 1 : 0);

        event_html_playable.trackSound(target.isChecked);
    }
}


