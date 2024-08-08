import { _decorator, Collider, Component, Enum, ERigidBodyType, ICollisionEvent, Node, Prefab, Quat, randomRange, randomRangeInt, RigidBody, sys, Vec3, View } from 'cc';
import { AvatarController } from './AvatarController';
import { Emoji } from '../item/Emoji';
import { CashController } from './CashController';
import { OutputController } from './OutputController';
import { PHY_GROUP } from '../manager/Layers';
import { Item } from '../item/Item';
import { BackPack } from './BackPack';
import { TableController } from './TableController';
import { Utils } from '../util/Utils';
const { ccclass, property } = _decorator;

@ccclass('GuestController')
export class GuestController extends AvatarController {
    @property(Emoji)
    emoji:Emoji = null;
    
    protected _backPack: BackPack;

    static State = {
        WAIT: 0,
        // PREPARE: 1,
        WALK2CASH: 2,
        CASH: 3,
        WALK2OUTPUT: 4,
        OUTPUT: 5,
        WALK2TABLE: 6,
        TABLE: 7,
        STANDUP: 8,
        WALK2BACK: 9,
    };

    maxDelay:number = 3;
    baseSpeedVar:number = 0.1;

    speed:number = 0;

    private _path2cash:Node = null;
    private _path2poutput:Node = null;
    private _path2back:Node = null;

    private _traceIndex:number = 0;
    private _startPos:Vec3 = Vec3.ZERO.clone();
    private _endPos:Vec3 = Vec3.ZERO.clone();
    private _curPos:Vec3 = Vec3.ZERO.clone();

    private _moveTarget:Vec3 = Vec3.ZERO.clone();
    private _curWorldPos:Vec3 = Vec3.ZERO.clone();

    private _moveInput:Vec3 = Vec3.ZERO.clone();
    private _tempPos1:Vec3 = Vec3.ZERO.clone();
    private _tempPos2:Vec3 = Vec3.ZERO.clone();

    private _cash:CashController = null;
    private _output:OutputController = null;

    private _state:number = GuestController.State.WAIT;
    private _orderCount:number = 1;
    private _waitTime:number = 0;
    private _maxWaitTime:number = 0;
    private static MAX_WAIT_TIME:number = 60;

    private _parentInRange:GuestController = null;
    private _moving:boolean = false;

    protected _sleepMoveTimer: number = 0;
    protected _sleepMoveInterval: number = 0;
    private _tables:TableController[] = null;
    private _rigidBody:RigidBody = null;

    public setParams(path2cash:Node, path2poutput:Node, path2back:Node, 
            cash:Node, output:Node, tables:TableController[], index:number){
        this._traceIndex = index < 3 ? 1 : 0;

        this._path2cash = path2cash;
        this._path2poutput = path2poutput;
        this._path2back = path2back;
        this._tables = tables;

        this._cash = cash.getComponent(CashController);
        this._output = output.getComponent(OutputController);

        this.node.setPosition(path2cash.children[this._traceIndex].getPosition(this._startPos));
    }

    protected getCurrentPath() : Node {
        let path:Node = null;
        switch(this._state) {
            case GuestController.State.WALK2CASH:
                path = this._path2cash;
                break;
            case GuestController.State.WALK2OUTPUT:
                path = this._path2poutput;
                break;
            case GuestController.State.WALK2BACK:
                path = this._path2back;
                break;
        }

        return path;
    }

    protected getTraceSegmentCount() {
        const path = this.getCurrentPath();
        if (path)
            return path.children.length;

        return 0;
    }

    protected getPositionOfTrace(index:number, startPos:Vec3, endPos:Vec3) : boolean {
        const path = this.getCurrentPath();
        if (path && index >= 0 && index < path.children.length - 1) {
            path.children[index].getPosition(startPos);
            path.children[index + 1].getPosition(endPos);
            return true;
        }
        
        return false;
    }

    protected moveTraceSegment() : boolean {
        this._moving = this.getPositionOfTrace(this._traceIndex ++, this._startPos, this._endPos);
        return this._moving;
    }

    protected calcMoveInput(endPos:Vec3){
        if (endPos){
            this._moveInput.set(endPos);
            this._moveInput.subtract(this.node.position);
            this._moveInput = this._moveInput.normalize();
            this._moveInput.multiplyScalar(randomRange(0.98, 1));
        }else{
            this._moveInput.set(Vec3.ZERO);
        }
    }

    protected calcSpeed() {
        this.speed = super.getMaxSpeed() * (1 + Math.random() * this.baseSpeedVar);
    }

    protected getMaxSpeed(){
        return this.speed;
    }

    protected fetchMovementInput() : Vec3{
        return this.inArrange() ? null : this._moveInput;
    }

    start () {
        super.start();

        this._backPack = this.addComponent(BackPack);
        this._rigidBody = this.getComponent(RigidBody);

        this.prepareParams();

        this._state = GuestController.State.WALK2CASH;
        this.moveTraceSegment();
    }

    update(deltaTime: number) {
        this._moveInput.set(Vec3.ZERO);

        if (this._moving){
            if (!this.checkInArrange()) {
                this.node.getPosition(this._curPos);
                if (this._curPos.subtract(this._endPos).lengthSqr() < 0.1){
                    // this.stopAvatar(true);
                    this.node.setPosition(this._endPos);
                    this._moving = false;
                } else {
                    // this.node.getPosition(this._curWorldPos);

                    // const path = this.getCurrentPath();
                    // if (path && this._traceIndex > 0)
                    //     this.findNearestPointOnPath(this._curWorldPos, path, this._traceIndex - 1, this._moveTarget)
                    // else {
                    //     console.log(path, this._traceIndex);
                    //     this._moveTarget.set(this._endPos);
                    // }

                    // this.calcMoveInput(this._moveTarget);
                    this.calcMoveInput(this._endPos);
                }
            } else 
                this.updateEmojiTime(deltaTime);
        } else {
            switch (this._state) {
                case GuestController.State.WALK2CASH:
                    if (!this.moveTraceSegment()) {
                        this._state = GuestController.State.CASH;
                        this._cash.arrivedGuest(this);
                        this.changePhysicsType(false);
                    }
                    break;
                case GuestController.State.CASH:
                    if (this._orderCount == 0) {
                        this._cash.arrivedGuest(null);
                        this.changePhysicsType(true);

                        this._state = GuestController.State.WALK2OUTPUT;

                        this._traceIndex = 0;
                        this.moveTraceSegment();
                    } else
                        this.updateEmojiTime(deltaTime);
                    break;
                case GuestController.State.WALK2OUTPUT:
                    if (!this.moveTraceSegment()) {
                        this._output.arrivedGuest(this);
                        this.changePhysicsType(false);
                        this._state = GuestController.State.OUTPUT;
                    }
                    break;
                case GuestController.State.OUTPUT:
                    if (this._orderCount < 0) {
                        this._output.arrivedGuest(null);
                        this.changePhysicsType(true);

                        this._state = GuestController.State.WALK2TABLE;

                        this._traceIndex = 0;
                        this.moveTraceSegment();
                    } else
                        this.updateEmojiTime(deltaTime);
                    break;
                case GuestController.State.WALK2TABLE:
                    this.calcMoveInput(this.findEmptyTablePosition());
                    break;
                case GuestController.State.STANDUP:
                    this.calcMoveInput(this._endPos);
                    this.node.getPosition(this._startPos);
                    this._startPos.subtract(this._endPos);
                    if (this._startPos.lengthSqr() < 0.5){
                        this._state = GuestController.State.WALK2BACK;
                        this._traceIndex = 0;
                        this.moveTraceSegment();
                    }
                    break;
                case GuestController.State.WALK2BACK:
                    if (!this.moveTraceSegment()) {
                        this._state = GuestController.State.WALK2CASH;

                        this.prepareParams();
    
                        this._traceIndex = 0;
                        this.moveTraceSegment();
                    }
                    break;
            }
        }

        super.update(deltaTime);
    }

    protected findNearestPointOnPath(point: Vec3, path: Node, lineIndex:number, out:Vec3) {
        let minDistance = Infinity;
    
        console.log(`findNearestPointOnPath for ${point}, start line ${lineIndex}`);

        for (let i = lineIndex; i < path.children.length - 1; i++) {
            const start = path.children[i].position;
            const end = path.children[i + 1].position;
    
            const distance = Utils.distancePointToLineSegment(point, start, end);
            console.log(`distance ${i}, ${distance}, ${start}, ${end}`);

            if (Utils.isPointOnLineSegment(point, start, end)) {
                out.set(end);  // Return the end point of the line if the point is on the line
                console.log(`in line ${i}, ${out}`);
                return;
            }
    
            if (distance < minDistance) {
                minDistance = distance;
                out.set(end);
            }
        }
        console.log(`short distance ${out}`);
    }

    protected updateEmojiTime(deltaTime:number) {
        if (this._state <= GuestController.State.OUTPUT) {
            this._waitTime += deltaTime;

            const emojiType = Math.floor(this._waitTime * (Emoji.TYPE.ANGRY - Emoji.TYPE.TIRED + 1) / this._maxWaitTime);
            if (emojiType >= Emoji.TYPE.TIRED)
                this.emoji.setType(emojiType);
        }
    }

    protected prepareParams() {
        this._orderCount = 1;

        this._waitTime = 0;
        this.emoji.setType(Emoji.TYPE.NONE);
        this._maxWaitTime = randomRange(GuestController.MAX_WAIT_TIME * 0.5, GuestController.MAX_WAIT_TIME);
        
        this.calcSpeed();
    }

    protected changePhysicsType(movable:boolean) {
        if (this._rigidBody)
            this._rigidBody.type = movable ? ERigidBodyType.DYNAMIC : ERigidBodyType.STATIC;
    }

    protected onCollision(other:GuestController) {
        if (this._state < GuestController.State.OUTPUT &&
            (this._state == other._state || this._state == other._state - 1) &&
            !this.inArrange() && other.inArrange()) {
                let valid:boolean = true;
                let parent = other;
                while(parent) {
                    if (parent._parentInRange == this) {
                        valid = false;
                        // console.log('invalid chain');
                        break;
                    }
                    if (!parent._parentInRange) {
                        valid = parent.inArrange();
                        // if (!valid)
                        //     console.log('invalid top chain');
                    }
                    parent = parent._parentInRange;
                }
                if (valid)
                    this._parentInRange = other;
        }else{
            if (this.checkFar(other)) {
                const baseTime = 3000 / this.getMaxSpeed();
                this.sleepMove(randomRangeInt(baseTime, baseTime * 1.5));
            }
        }
    }

    protected doCollisionStay(event: ICollisionEvent){
        super.doCollisionEnter(event);

        const guest = this.getGuestFromColliderEvent(event);
        if (guest) {
            this.onCollision(guest);
        }
    }
    
    protected doCollisionEnter(event: ICollisionEvent){
        super.doCollisionEnter(event);

        const guest = this.getGuestFromColliderEvent(event);
        if (guest) {
            this.onCollision(guest);
        }
    }

    protected checkFar(other:GuestController) : boolean {
        let ret : boolean = false;
        if (this._state < other._state)
            ret = true;
        else if (this._state == other._state) {
            const path = this.getCurrentPath();
            if (path) {
                path.children[path.children.length - 1].getPosition(this._tempPos1);
                this._tempPos2.set(this._tempPos1);
                const myLength = this._tempPos2.subtract(this.node.position).lengthSqr();
                this._tempPos2.set(this._tempPos1);
                const otherLength = this._tempPos2.subtract(other.node.position).lengthSqr();
    
                ret = (myLength > otherLength);
            }
        }

        return ret;
    }

    // protected doCollisionExit(event: ICollisionEvent){
    //     super.doCollisionExit(event);

    //     const guest = this.getGuestFromColliderEvent(event);
    //     if (guest && this._parentInRange == guest) {
    //         this._parentInRange = null;
    //     }
    // }

    protected getGuestFromColliderEvent(event: ICollisionEvent) : GuestController {
        const otherCollider = event.otherCollider;
        if (otherCollider && otherCollider.getGroup() == PHY_GROUP.PLAYER) {
            const otherNode = otherCollider.node;
            if (otherNode) {
                const guest:GuestController = otherNode.getComponent(GuestController);
                return guest;
            }
        }

        return null;
    }

    protected inArrange() : boolean {
        return this._parentInRange != null || 
            this._state == GuestController.State.CASH || 
            this._state == GuestController.State.OUTPUT;
    }

    protected checkInArrange() : boolean {
        if (this.inArrange()) {
            if (this._parentInRange) {
                if (!this._parentInRange.inArrange()) {
                    let parentSleepMoveInterval:number = this._parentInRange._sleepMoveInterval;
                    this.sleepMove(parentSleepMoveInterval + 200);
                    this._parentInRange = null;
                }
            }
        }

        const ret = this.inArrange();
        this.changePhysicsType(!ret);

        return ret;
    }

    public paid(){
        this._orderCount = 0;
    }

    public received() {
        this._orderCount = -1;
    }

    protected canMove() {
        if (super.canMove()){
            if (this._sleepMoveTimer > 0){
                if (sys.now() < this._sleepMoveTimer + this._sleepMoveInterval)
                    return false;
    
                this._sleepMoveTimer = 0;
                this._sleepMoveInterval = 0;
            }
            return this._state != GuestController.State.TABLE;
        }

        return false;
    }

    public sleepMove(sleepMilliseconds:number):void {
        this._sleepMoveTimer = sys.now();
        this._sleepMoveInterval = sleepMilliseconds;
    }
    
    public catchItem(item:Item): boolean {
        if (this._backPack && this._orderCount == 0){
            if (this._backPack.addItem(item)) {
                this.received();

                if (this.emoji.getType() <= Emoji.TYPE.TIRED)
                    this.emoji.setType(Emoji.TYPE.SMILE);
                
                return true;
            }
        }
        return false;
    }

    protected findEmptyTablePosition() {
        if (this._tables) {
            let index:number = 0;
            // for (let i = 0; i < this._tables.length * 3; i++) {
            //     const j = randomRangeInt(0, this._tables.length);
            //     const element = this._tables[j];
            //     if (element && element.getEmptyPlace()) {
            //         index = j;
            //         break;
            //     }
            // }
            for (index = this._tables.length - 1; index > 0; index--) {
                const element = this._tables[index];
                if (element && element.getEmptyPlace()) {
                    break;
                }
            }

            this._tables[index].node.getPosition(this._endPos);

            return this._endPos;
        }

        return null;
    }

    protected getIdleAnimationName(): string {
        if (this._state == GuestController.State.TABLE)
            return 'sitting_idle';

        return this._backPack.isEmpty() ? super.getIdleAnimationName() : 'carrying';
    }

    protected getWalkAnimationName(): string {
        return this._backPack.isEmpty() ? super.getWalkAnimationName() : 'walk_01_Tray';
    }

    public onSitdown(place:Node) : boolean {
        if (this._backPack.isEmpty())
            return false;

        const orgPos = this.node.getPosition();
        const orgParent = this.node.parent;
        const frontPos = this._backPack.frontPos.getPosition();

        const newFrontPos = frontPos.clone();
        newFrontPos.y -= 0.35;
        newFrontPos.z += 0.1;

        this.node.setParent(place);
        this.node.setPosition(Vec3.ZERO);
        this._backPack.frontPos.setPosition(newFrontPos);

        this._startPos.set(this.node.forward);
        this._startPos.y = 0;
        this._startPos.normalize();

        this._endPos.set(place.forward);
        this._endPos.y = 0;
        this._endPos.normalize();

        const rotation = Quat.rotationTo(new Quat(), this._startPos, this._endPos);
        this.node.rotate(rotation);

        if (this._rigidBody)
            this._rigidBody.enabled = false;
        if (this.getComponent(Collider))
            this.getComponent(Collider).enabled = false;

        this._state = GuestController.State.TABLE;

        const baseDelay = 70 / this.getMaxSpeed();
        this.scheduleOnce(()=>{
            this._path2back.children[0].getPosition(this._endPos);
            this._state = GuestController.State.STANDUP;

            this.node.setParent(orgParent);
            this.node.setPosition(orgPos);
            this._backPack.frontPos.setPosition(frontPos);

            if (this._rigidBody)
                this._rigidBody.enabled = true;
            if (this.getComponent(Collider))
                this.getComponent(Collider).enabled = true;

            const item = this._backPack.dropOne();
            if (item)
                item.destroy();
        }, randomRange(baseDelay, baseDelay * 1.5));

        return true;
    }
}


