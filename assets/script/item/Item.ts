import { _decorator, BoxCollider, CapsuleCollider, Collider, Component, EAxisDirection, Node, RigidBody, SphereCollider, Tween, tween, v3, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Item')
export class Item extends Component {
    private _halfDimension:Vec3 = null;
    private _orgScale:Vec3 = null;

    private _animating:boolean = false;

    public isAnimating(): boolean {
        return this._animating;
    }

    public getHalfDimension(force:boolean = false) : Vec3 {
        if (force || this._halfDimension == null){
            let ret:Vec3 = null;
            const collider: Collider = this.node.getComponent(Collider);
            if (collider) {
                if (collider instanceof BoxCollider){
                    const box:BoxCollider = collider as BoxCollider;
                    ret = box.size.clone();
                    ret.x /= 2;
                    ret.y /= 2;
                    ret.z /= 2;
                }else if (collider instanceof CapsuleCollider){
                    const capsule:CapsuleCollider = collider as CapsuleCollider;
                    const longSide:number = capsule.cylinderHeight / 2 + capsule.radius;
                    switch (capsule.direction) {
                        case EAxisDirection.X_AXIS:
                            ret = v3(longSide, capsule.radius, capsule.radius);
                            break;
                        case EAxisDirection.Y_AXIS:
                            ret = v3(capsule.radius, longSide, capsule.radius);
                            break;
                        case EAxisDirection.Z_AXIS:
                            ret = v3(capsule.radius, capsule.radius, longSide);
                            break;
                    }
                } else if (collider instanceof SphereCollider) {
                    const sphere:SphereCollider = collider as SphereCollider;
                    ret = v3(sphere.radius, sphere.radius, sphere.radius);
                }
                else{
                    ret = collider.worldBounds.halfExtents.clone();
                }
            }

            ret.x *= collider.node.scale.x;
            ret.y *= collider.node.scale.y;
            ret.z *= collider.node.scale.z;

            const currentRotation = this.node.eulerAngles;
            if (currentRotation.z == 90) {
                const temp = ret.y;
                ret.y = ret.x;
                ret.x = temp;
            }

            this._halfDimension = ret;
        }
        return this._halfDimension;
    }

    public rotateIfColumn() : boolean {
        if (this._halfDimension == null)
            this.getHalfDimension();

        let ret = false;
        const currentRotation = this.node.eulerAngles;
        if (this._halfDimension.y > this._halfDimension.x) {
            const temp = this._halfDimension.y;
            this._halfDimension.y = this._halfDimension.x;
            this._halfDimension.x = temp;

            this.node.setRotationFromEuler(0, currentRotation.y, 90);
            ret = true;
        }else
            this.node.setRotationFromEuler(0, currentRotation.y, 0);

        return ret;
    }

    public prepareForProduct() {
        const currentRotation = this.node.eulerAngles;
        this.node.setRotationFromEuler(0, 0, currentRotation.z);
        // this.getHalfDimension(true);
    }

    public scaleEffect(period:number) {
        this._animating = true;

        this._orgScale = this.node.scale.clone();
        this.node.setScale(Vec3.ZERO);
        tween(this.node)
            .to(period, {scale:this._orgScale}, {easing:'bounceOut',
                onComplete: (target?: object) => {
                    this._orgScale = null;
                    this._animating = false;
                }
            })
            .start();
    }

    public stopScaleEffect() {
        if (this._orgScale) {
            Tween.stopAllByTarget(this.node);
            this.node.setScale(this._orgScale);
            this._orgScale = null;
            this._animating = false;
        }
    }
}


