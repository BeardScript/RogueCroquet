import { Mouse } from './Mouse';
import { Keyboard } from './Keyboard';
import { TouchController } from './Touch';
import { GamepadController } from './GamepadController';
type GamepadAxesObj = {
    x?: number;
    y?: number;
    mult?: [x: number, y: number];
};
type GamepadAxesArray = [up?: number, down?: number, left?: number, right?: number, mult?: [xMult: number, yMult: number]];
type TouchAxesObj = {
    area: "left" | "right" | "view";
    mult?: [x: number, y: number];
    normalize?: [radiusX: number, radiusY: number];
};
type TouchAxesArray = [up?: number, down?: number, left?: number, right?: number, mult?: [xMult: number, yMult: number]];
type GamepadAxes = GamepadAxesObj | GamepadAxesArray;
type KeyboardAxes = [up?: string, down?: string, left?: string, right?: string, mult?: [xMult: number, yMult: number]];
type MouseAxes = [xMult: number, yMult: number];
type TouchAxes = TouchAxesObj | TouchAxesArray;
type InputAxesBinds = {
    type: "Axes";
    Keyboard?: KeyboardAxes;
    Mouse?: MouseAxes;
    Gamepad?: GamepadAxes;
    Touch?: TouchAxes;
};
type InputBinds = {
    type: "Button";
    Keyboard?: string;
    Mouse?: number | "WheelUp" | "WheelDown";
    Gamepad?: number;
    Touch?: number | "Tap";
};
type InputAction = {
    [name: string]: InputAxesBinds | InputBinds;
};
export declare abstract class Input {
    private static _mouse;
    private static _keyboard;
    private static _touch;
    private static _gamepads;
    static get mouse(): Mouse;
    static get keyboard(): Keyboard;
    static get touch(): TouchController;
    static get gamepads(): GamepadController[];
    static playerInputs: {
        MouseAndKeyboard: number;
        Gamepads: number[];
    };
    private static actionMap;
    private static inputMaps;
    static setActionMap(bindings: InputAction): void;
    private static getGamepadKey;
    private static copyGamepadConfig;
    static bindAxes(actionName: string, bind: {
        Gamepad?: GamepadAxes;
        Keyboard?: KeyboardAxes;
        Mouse?: MouseAxes;
        Touch?: TouchAxes;
    }, player?: number): void;
    private static dedupeKeyboardInput;
    private static dedupeGamepadInput;
    private static dedupeTouchInput;
    static bindButton(actionName: string, bind: {
        Gamepad?: number;
        Keyboard?: string;
        Mouse?: number | "WheelUp" | "WheelDown";
        Touch?: number | "Tap";
    }, player?: number): void;
    private static getMapping;
    static getBindings(actionName: string): any;
    static getAxes(name: string, player?: number): {
        x: number;
        y: number;
    };
    static getDown(name: string, player?: number): boolean;
    static getUp(name: string, player?: number): boolean;
    static getPressed(name: string, player?: number): number | true;
    static getPlayerConfig(player?: number): {
        gamepadIndex: number | undefined;
        useMouseAndKeyboard: boolean;
    };
    private static getButtonConfig;
}
export {};
