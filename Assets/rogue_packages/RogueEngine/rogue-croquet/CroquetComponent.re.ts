import * as RE from 'rogue-engine';
import * as THREE from 'three';
import * as Croquet from '@croquet/croquet';
import { BaseModel } from './BaseModel';

export default class CroquetComponent extends RE.Component {
  isCroquetComponent = true;
  isStaticModel = false;

  model: BaseModel;
  view: Croquet.View;
  viewId: string;
  sessionId: string;
  initialized = false;

  readySubscribed = false;

  get isMe() {
    if (!this.view) return false;
    if (!this.view.viewId || !this.viewId) return false;
    return this.view.viewId === this.viewId;
  }

  onModelCreated = (params: {model: Croquet.Model, viewId: string}) => {}

  init() {}

  onBeforeUpdateProp(key: string, value: any) {}

  updateProp(key: string) {
    this.view.publish(this.model.id, key, {
      key,
      value: this[key],
      viewId: this.view.viewId,
    });
  }

  dampV3(from: THREE.Vector3, to: THREE.Vector3, lambda: number) {
    from.x = THREE.MathUtils.damp(from.x, to.x, lambda, RE.Runtime.deltaTime);
    from.y = THREE.MathUtils.damp(from.y, to.y, lambda, RE.Runtime.deltaTime);
    from.z = THREE.MathUtils.damp(from.z, to.z, lambda, RE.Runtime.deltaTime);
  }
}

RE.registerComponent(CroquetComponent);
        