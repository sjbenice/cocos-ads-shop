import { _decorator, Color, Component, gfx, MeshRenderer, Node, tween, v3, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Utils')
export class Utils {
    public static lerp(start: number, end: number, t: number): number {
        return start + t * (end - start);
    }

    public static lerpVec3(start: Vec3, end: Vec3, t: number): Vec3 {
        return v3(Utils.lerp(start.x, end.x, t), Utils.lerp(start.y, end.y, t), Utils.lerp(start.z, end.z, t));
    }

    public static parabola(t: number, startY: number, endY: number, height: number): number {
        const peak = height + Math.max(startY, endY);
        const a = startY - 2 * peak + endY;
        const b = 2 * (peak - startY);
        const c = startY;
        return a * t ** 2 + b * t + c;
    }

    public static removeChildrenDestroy(node:Node) : void {
        // node.removeAllChildren();
        for (let index = node.children.length - 1; index >= 0; index--) {
            const element = node.children[index];
            element.removeFromParent();
            element.destroy();
        }
    }

    // http://yourdomain.com/playableAd/index.html?version=1
    public static getUrlParameter(name: string): string {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(window.location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    public static shuffleArray(array: number[]): number[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
        return array;
    }

    public static setMeshNodeAlpha(node: Node, alpha_0_1: number) {
        const meshRenderer = node.getComponent(MeshRenderer);
        if (meshRenderer)
            Utils.setMeshRendererAlpha(meshRenderer, alpha_0_1);
    }

    public static setMeshRendererAlpha(meshRenderer: MeshRenderer, alpha_0_1: number) {
        const material = meshRenderer.material;
        if (material) {
            // Ensure the material supports transparency
            material.setProperty('albedo', new Color(255, 255, 255, alpha_0_1 * 255));
            
            // If the material does not initially support transparency, you might need to adjust the blend state
            // const pass = material.passes[0];
            // const blendState = pass.blendState;
            // blendState.targets[0].blend = true;
            // blendState.targets[0].blendSrc = gfx.BlendFactor.SRC_ALPHA;
            // blendState.targets[0].blendDst = gfx.BlendFactor.ONE_MINUS_SRC_ALPHA;
            // blendState.targets[0].blendSrcAlpha = gfx.BlendFactor.SRC_ALPHA;
            // blendState.targets[0].blendDstAlpha = gfx.BlendFactor.ONE_MINUS_SRC_ALPHA;

            // Apply the modified material back to the mesh renderer
            // meshRenderer.material = material;
        }
    }

    public static isPointOnLineSegment(point: Vec3, start: Vec3, end: Vec3): boolean {
        const crossProduct = (point.y - start.y) * (end.z - start.z) - (point.z - start.z) * (end.y - start.y);
        if (Math.abs(crossProduct) > Number.EPSILON) return false;
    
        const dotProduct = (point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y) + (point.z - start.z) * (end.z - start.z);
        if (dotProduct < 0) return false;
    
        const squaredLength = (end.x - start.x) ** 2 + (end.y - start.y) ** 2 + (end.z - start.z) ** 2;
        if (dotProduct > squaredLength) return false;
        
        return true;
    }
    
    protected static _point:Vec3 = Vec3.ZERO.clone();
    protected static _start:Vec3 = Vec3.ZERO.clone();
    protected static _end:Vec3 = Vec3.ZERO.clone();

    // Helper function to calculate the distance from a point to a line segment
    public static distancePointToLineSegment(point: Vec3, start: Vec3, end: Vec3): number {
        Utils._point.set(point);
        Utils._start.set(start);
        Utils._end.set(end);

        const lineLengthSquared = Utils._start.subtract(Utils._end).lengthSqr();
        if (lineLengthSquared === 0) return Utils._point.subtract(Utils._start).length();
    
        const t = Math.max(0, Math.min(1, Utils._point.subtract(Utils._start).dot(Utils._end.subtract(Utils._start)) / lineLengthSquared));
        const projection = Utils._start.add(Utils._end.subtract(Utils._start).multiplyScalar(t));
        return Utils._point.subtract(projection).length();
    }
}


