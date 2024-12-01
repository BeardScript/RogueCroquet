import * as RE from 'rogue-engine';
import * as Croquet from '@croquet/croquet';
import { BaseModel } from './BaseModel';
import { RogueCroquet } from '.';
import CroquetPawn from './CroquetPawn.re';
import CroquetComponent from './CroquetComponent.re';

@RE.registerComponent
export default class CroquetView extends CroquetComponent {
  @CroquetPawn.require(true)
  parentPawn: CroquetPawn | undefined;

  beforeUpdate() {
    if (!this.initialized && RogueCroquet.rootView && !this.readySubscribed) {
      this.sessionId = this.sessionId || RogueCroquet.activeSessionId;
      this.view = this.view || RogueCroquet.rootView;

      if (this.parentPawn && !this.parentPawn.model) return;

      if (this.parentPawn && this.parentPawn.model) {
        this.model = this.parentPawn.model.models.get(this.name) as BaseModel;

        if (this.model) {
          this.onModelCreated({model: this.model, viewId: this.model.viewId});
          return;
        }
        if (this.view.viewId !== this.parentPawn.viewId) return;
      }

      this.view.subscribe(this.sessionId + this.constructor.name + "Model", "ready", this.onModelCreated.bind(this));

      const params = {};

      this.constructor["binds"]?.forEach(key => {
        params[key] = this[key];
      });

      this.constructor["propConfigs"] && 
      Object.entries(this.constructor["propConfigs"]).forEach(([key, value]) => {
        this["_propConfigs"][key] = {updateTime: 0, rate: value as number};
      });

      this.view.publish(this.sessionId, "createModel", {
        parentActor: this.parentPawn?.model?.id,
        modelName: this.constructor.name + "Model",
        componentName: this.name,
        viewId: this.view.viewId,
        isStatic: this.isStaticModel,
        params
      });

      this.readySubscribed = true;
    }
  }

  onModelCreated(params: {model: Croquet.Model, viewId: string}) {
    if (this.initialized) return;

    this.model = params.model as BaseModel;
    this.viewId = this.isStaticModel ? this.view.viewId : params.viewId;

    if (!this.view) this.view = RogueCroquet.rootView;

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
