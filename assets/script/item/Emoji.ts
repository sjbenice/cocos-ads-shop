import { _decorator, Camera, Component, director, Mat4, Material, MeshRenderer, Node, Quat, randomRange, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Emoji')
export class Emoji extends Component {
    public static TYPE = {
        NONE:-1,
        SMILE:0,
        TIRED:1,
        CRY:2,
        ANGRY:3,
    }

    private _meshRenderer:MeshRenderer;
    private _type:number = Emoji.TYPE.NONE;
    private static SHOW_TIME:number = 2;

    protected onLoad(): void {
        if (!this._meshRenderer)
            this._meshRenderer = this.node.getComponent(MeshRenderer);    

        this.node.active = false;
    }

    protected onDestroy(): void {
        this.unscheduleAllCallbacks();
    }

    public setType(type:number){
        if (this._type != type) {
            this.unscheduleAllCallbacks();

            this._type = type;
    
            if (this._meshRenderer){
                if (Emoji.TYPE.NONE < type && type < this._meshRenderer.materials.length){
                    this.node.active = true;

                    this._meshRenderer.material = this._meshRenderer.materials[type];
                    this.scheduleHide();
                } else {
                    this.node.active = false;
                }
            }
        }
    }

    public getType() : number {
        return this._type;
    }

    protected scheduleShow() {
        this.scheduleOnce(() => {
            this.node.active = true;
            this.scheduleHide();
        }, randomRange(Emoji.SHOW_TIME, Emoji.SHOW_TIME * 1.5));
    }

    protected scheduleHide() {
        this.scheduleOnce(() => {
            this.node.active = false;
        }, Emoji.SHOW_TIME);
    }
}
