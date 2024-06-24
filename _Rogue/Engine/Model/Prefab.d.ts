import * as THREE from 'three';
export declare class Prefab {
    private _uuid;
    constructor(uuid: any);
    get uuid(): string;
    get path(): string;
    get name(): string;
    instantiate(parent?: THREE.Object3D): THREE.Object3D;
}
