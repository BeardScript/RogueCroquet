import * as Croquet from '@croquet/croquet';
import { RootView } from './RootView';
import { RootModel } from './RootModel';

export class RogueCroquet {
  static mainSession: Croquet.Session;
  static activeSession: Croquet.Session;
  static sessions = new Map<string, Croquet.Session>();

  static get rootView() {
    return this.activeSession?.["view"] as RootView;
  }

  static get rootModel() {
    return this.activeSession?.["model"] as RootModel;
  }

  static get activeSessionId() {
    return this.activeSession?.["id"] as string;
  }

  static get mainSessionId() {
    return this.mainSession?.["id"] as string;
  }

  static Model(constructor: typeof Croquet.Model) {
    constructor.register(constructor.name);
    RootModel.modelClasses.set(constructor.name, constructor);
  }
}
