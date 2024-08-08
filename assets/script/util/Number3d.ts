import { _decorator, Component, MeshRenderer, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Number3d')
export class Number3d extends Component {
    @property(MeshRenderer)
    mesh10:MeshRenderer = null;
    @property(MeshRenderer)
    mesh01:MeshRenderer = null;
    @property(MeshRenderer)
    mesh1:MeshRenderer = null;

    protected _value:number = 0;

    start() {
        this.setValue(this._value);
    }

    public getValue() : number {
        return this._value;
    }

    public setValue(value:number) {
        if (this._value != value) {
            this._value = value;
            const digit10 = Math.floor(value / 10);
            const digit01 = value % 10;
            if (digit10 > 0) {
                this.mesh1.node.active = false;
                this.mesh10.node.active = true;
                this.mesh01.node.active = true;
                this.setMatherial(this.mesh10, digit10);
                this.setMatherial(this.mesh01, digit01);
            } else {
                this.mesh1.node.active = true;
                this.mesh10.node.active = false;
                this.mesh01.node.active = false;
                this.setMatherial(this.mesh1, digit01);
            }
        }
    }

    protected setMatherial(mesh:MeshRenderer, value:number) {
        if (mesh && value >= 0 && value < mesh.materials.length)
            mesh.material = mesh.materials[value];
    }
}


