export type TouchInteraction = {
    id: string;
    touch: Touch;
    x: number;
    y: number;
    viewX: number;
    viewY: number;
    deltaX: number;
    deltaY: number;
    movedX: number;
    movedY: number;
    originX: number;
    originY: number;
};
export declare class TouchButton {
    elem: HTMLDivElement;
    isDown: boolean;
    isPressed: boolean;
    isUp: boolean;
    onButtonDown: () => void;
    onButtonUp: () => void;
    constructor(elem: HTMLDivElement, stopPropagation?: boolean);
}
export declare class TouchController {
    startTouches: TouchInteraction[];
    endTouches: TouchInteraction[];
    touches: TouchInteraction[];
    enabled: boolean;
    leftStartTouches: TouchInteraction[];
    leftEndTouches: TouchInteraction[];
    leftTouches: TouchInteraction[];
    rightStartTouches: TouchInteraction[];
    rightEndTouches: TouchInteraction[];
    rightTouches: TouchInteraction[];
    buttons: TouchButton[];
    init(): void;
    createButton(elem: HTMLDivElement, stopPropagation?: boolean): TouchButton;
    private onTouchStart;
    private onTouchEnd;
    private onTouchMove;
    private getCurrentTouchIndexById;
    private setTouchValues;
    private isTouchingLeft;
}
