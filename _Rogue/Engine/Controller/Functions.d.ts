import { Object3D } from 'three';
import * as THREE from 'three';
export declare function isDev(): boolean;
export declare function getStaticPath(path: string): string;
export declare function loadComponentsRecursive(object: Object3D): void;
export declare function loadAudioListeners(object: Object3D): void;
export declare function dispose(object: Object3D): void;
export declare function isEnabled(object: Object3D): boolean;
export declare function isActive(object: Object3D): boolean;
export declare function setEnabled(object: Object3D, enabled: boolean): void;
export declare function enable(object: Object3D): void;
export declare function disable(object: Object3D): void;
export declare function pick(targets: Object3D[]): Object3D | undefined;
export declare function getNormalizedDeviceCoordinates(x: number, y: number): {
    x: number;
    y: number;
};
export declare function getNearestWithTag(obj: Object3D, tag: string): Object3D | undefined;
export declare function getNearestGroup(obj: Object3D): THREE.Group | undefined;
