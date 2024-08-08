import { _decorator, Collider, Component, ITriggerEvent, Node, sys } from 'cc';
import { PHY_GROUP } from '../manager/Layers';
const { ccclass, property } = _decorator;

@ccclass('ActionTableController')
export class ActionTableController extends Component {
    @property(Collider)
    inTrigger:Collider;

    protected _inputPlayers:Node[] = [];
    protected _inputTimers:number[] = [];
    protected _dropInterval:number = 500;

    protected onLoad(): void {
        if (this.inTrigger) {
            this.inTrigger.on('onTriggerEnter', this.onInTriggerEnter, this);
            this.inTrigger.on('onTriggerExit', this.onInTriggerExit, this);
        }
    }

    protected onDestroy(): void {
        try {
            // this.inputPos's components is null!
            if (this.inTrigger) {
                this.inTrigger.off('onTriggerEnter', this.onInTriggerEnter, this);
                this.inTrigger.off('onTriggerExit', this.onInTriggerExit, this);
            }
        }catch(e){

        }
    }

    public static registerPlayer(player:Node, players:Node[], timers:number[], isRegister:boolean) {
        if (player){
            let index = players.indexOf(player);
            if (index < 0) {
                players.push(player);
                timers.push(0);
                index = timers.length - 1;
            }
            timers[index] = isRegister ? sys.now() : 0;
        }
    }

    protected processPlayers(players:Node[], timers:number[]) {
        for (let index = 0; index < players.length; index++) {
            const time = timers[index];
            if (time > 0 && sys.now() >= this._dropInterval + time) {
                const player = players[index];
                if (player) {
                    if (this.onProcessPlayer(player)) {
                        timers[index] = sys.now();
                        break;
                    }
                }
            }
        }
    }

    update(deltaTime: number) {
        this.processPlayers(this._inputPlayers, this._inputTimers);
    }
    
    onInTriggerEnter(event: ITriggerEvent) {
        const player:Node = ActionTableController.checkPlayer(event.otherCollider);
        if (player){
            if (this.onEnter(player, true))
                ActionTableController.registerPlayer(player, this._inputPlayers, this._inputTimers, true);
        }
    }

    onInTriggerExit(event: ITriggerEvent) {
        const player:Node = ActionTableController.checkPlayer(event.otherCollider);
        if (player){
            ActionTableController.registerPlayer(player, this._inputPlayers, this._inputTimers, false);

            this.onEnter(player, false);
        }
    }

    public static checkPlayer(otherCollider: Collider) : Node {
        if (otherCollider) {
            const otherNode = otherCollider.node;
            if (otherNode) {
                if (otherCollider.getGroup() == PHY_GROUP.PLAYER) {
                    return otherNode;
                }
            }
        }
        return null;
    }

    protected onProcessPlayer(player:Node):boolean {
        return false;
    }

    protected onEnter(player:Node, enter:boolean):boolean {
        return false;
    }
}


