import { _decorator, Component, Node, Vec3, tween, Tween, UITransform, Graphics, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('InfinitySymbolTween')
export class InfinitySymbolTween extends Component {
    @property(Node)
    public targetNode: Node | null = null;

    @property(Graphics)
    public orbitGraphics: Graphics | null = null;

    @property(Node)
    titleNode:Node | null = null;

    @property
    scaleFactor: number = 0; // Scale factor for the infinity symbol
    @property
    duration:number = 2;// Duration for one complete loop in seconds
    @property
    step:number = 0.1; // Smaller step for smoother animation

    @property
    repeatCount:number = -1;// infinite

    protected _titleScale:Vec3 = v3(1.5, 1.5, 1);

    start() {
        if (!this.targetNode)
            this.targetNode = this.node;

        if (this.scaleFactor == 0){
            const uiTransform:UITransform = this.getComponent(UITransform);
            if (uiTransform){
                this.scaleFactor = this.calculateScaleFactor(uiTransform.width);
            }
        }
        
        if (this.targetNode)
            this.targetNode.active = false;
        this.startTween();
    }

    protected onDestroy(): void {
        try {
            this.stopTween();

            if (this.titleNode)
                Tween.stopAllByTarget(this.titleNode);
        }
        catch(e) {

        }
    }

    protected calculateScaleFactor(totalWidth:number){
        return totalWidth / (2 * 1.41);
    }

    protected animateInfinitySymbol(scaleFactor: number, duration: number, repeatCount:number) {
        if (!this.targetNode || scaleFactor <= 0 || duration <= 0)
            return;

        const points: Vec3[] = [];

        for (let t = 0; t < Math.PI * 2; t += this.step) {
            const x = scaleFactor * Math.cos(t) / (1 + Math.sin(t) * Math.sin(t));
            const y = scaleFactor * Math.sin(t) * Math.cos(t) / (1 + Math.sin(t) * Math.sin(t));
            points.push(new Vec3(x, y, 0));
        }

        if (this.orbitGraphics) {
            const graphics = this.orbitGraphics;
            graphics.clear();
            graphics.moveTo(points[0].x, points[0]. y);
            for (let index = 1; index < points.length - 1; index++) {
                const element = points[index];
                graphics.lineTo(element.x, element.y);
            }

            graphics.close();
            graphics.stroke();
        }

        const pathDuration = duration / points.length;

        let currentIndex = 0;
        const moveToNextPoint = () => {
            if (currentIndex < points.length) {
                tween(this.targetNode)
                    .to(pathDuration, { position: points[currentIndex] })
                    .call(() => {
                        if (this.targetNode.active) {
                            currentIndex++;
                            moveToNextPoint();
                        }
                    })
                    .start();
            } else {
                // Repeat the animation
                if (repeatCount < 0 || repeatCount > 0) {
                    if (repeatCount > 0)
                        repeatCount --;
                    currentIndex = 0;
                    moveToNextPoint();
                }else
                    this.targetNode.active = false;
            }
        };

        moveToNextPoint();
    }

    startTween() {
        if (this.targetNode && !this.targetNode.active) {
            this.targetNode.active = true;
            this.animateInfinitySymbol(this.scaleFactor, this.duration, this.repeatCount);

            if (this.orbitGraphics)
                this.orbitGraphics.enabled = true;

            if (this.titleNode){
                this.titleNode.active = true;
                tween(this.titleNode)
                .to(0.5, {scale:this._titleScale}, {easing:'linear'})
                .to(0.5, {scale:Vec3.ONE}, {easing:'linear'})
                .union()
                .repeatForever()
                .start()
            }
        }
    }

    stopTween() {
        if (this.targetNode && this.targetNode.active){
            this.targetNode.active = false;
            Tween.stopAllByTarget(this.targetNode);

            if (this.orbitGraphics)
                this.orbitGraphics.enabled = false;
            
            if (this.titleNode) {
                Tween.stopAllByTarget(this.titleNode);
                this.titleNode.active = false;
            }
        }
    }

    public isRunning() {
        return this.targetNode && this.targetNode.active;
    }
}
