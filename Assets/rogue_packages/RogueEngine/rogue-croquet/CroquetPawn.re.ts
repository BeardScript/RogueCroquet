import * as RE from 'rogue-engine';
import { RogueCroquet } from '.';
import { Actor } from './Actor';
import CroquetComponent from './CroquetComponent.re';

@RE.registerComponent
export default class CroquetPawn extends CroquetComponent {
  @RE.props.prefab() pawnPrefab: RE.Prefab;
  model: Actor;

  beforeUpdate() {
    if (!this.initialized && RogueCroquet.rootView && !this.readySubscribed) {
      this.sessionId = this.sessionId || RogueCroquet.activeSessionId;
      this.view = this.view || RogueCroquet.rootView;

      this.view.subscribe(this.sessionId, "actorCreated", this.onModelCreated.bind(this));

      const params = {};

      this.constructor["binds"]?.forEach(key => {
        params[key] = this[key];
      });

      this.constructor["propConfigs"] && 
      Object.entries(this.constructor["propConfigs"]).forEach(([key, value]) => {
        this["_propConfigs"][key] = {updateTime: 0, rate: value as number};
      });

      this.view.publish(this.sessionId, "createActor", {
        pawnPrefab: this.pawnPrefab?.uuid || this.object3d.userData.__ASSET__,
        modelName: this.constructor.name + "Model",
        viewId: this.view.viewId,
        params
      });

      this.readySubscribed = true;
    }
  }

  onModelCreated(params: {model: Actor, viewId: string}) {
    if (this.initialized || this.model) return;

    this.model = params.model as Actor;
    this.viewId = this.isStaticModel ? this.view.viewId : params.viewId;

    if (!this.view) this.view = RogueCroquet.rootView;
    this.sessionId = this.view.session.id;

    this.initialized = true;

    this.constructor["binds"]?.forEach(key => {
      this.view.subscribe(this.model.id, key + "View", (data) => {
        if (data.viewId === this.view.viewId && !data.changed) return;
        this.onBeforeUpdateProp(key, data[key]);
        this[key] = data[key];
      });
    });

    this.init();
  }
}
