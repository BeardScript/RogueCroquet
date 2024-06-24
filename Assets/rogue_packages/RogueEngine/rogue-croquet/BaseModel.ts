import * as Croquet from '@croquet/croquet';

export class BaseModel extends Croquet.Model {
  viewId: string;
  isStaticModel = false;

  init(params: {viewId: string}) {
    super.init(params);
    this.viewId = params.viewId;

    this["constructor"]["binds"]?.forEach(key => {
      if (!this["constructor"]["twoWayBinds"]?.[key]) return;
      this.subscribe(this.id, key, this.handleBinds);
    });

    this["constructor"]["actions"]?.forEach(key => {
      this.subscribe(this.id, key, this.handleActions);
    });

    this.onInit();
  }

  private handleBinds(data: {key: string, value: any, viewId: string}) {
    this.onBeforeUpdateProp(data.key, data.value);
    this["_" + data.key] = data.value;
    this.publish(this.id, data.key + "View", {[data.key]: data.value, viewId: data.viewId});
  }

  private handleActions(data: {key: string, args: any[]}) {
    this[data.key](...data.args);
  }

  onBeforeUpdateProp(key: string, value: any) {}

  onInit() {}

  remove() {
    this.publish(this.sessionId, "removeModel", {modelId: this.id, viewId: this.viewId});
    this.onRemoved();
    this.destroy();
    this.unsubscribeAll();
  }

  onRemoved() {}

  static prop(twoWay = false) {
    return (target: Object, key: string, descriptor?: PropertyDescriptor) => {
      Object.defineProperty(this.prototype, key, {
        get: function() { return this["_" + key] },
        set: function(value) {
          this["_" + key] = value;
          if (!this.id) return;
          this.publish(this.id, key + "View", {[key]: value});
        }
      });

      if (!this["binds"]) this["binds"] = [];
      this["binds"].push(key);

      if (!target.constructor["binds"]) target.constructor["binds"] = [];
      target.constructor["binds"].push(key);

      if (!this["twoWayBinds"]) this["twoWayBinds"] = {};

      if (twoWay) {
        this["twoWayBinds"][key] = true;
      }
    }
  }

  static action() {
    return (target: Object, key: string, descriptor: PropertyDescriptor) => {
      const func = descriptor.value;

      this.prototype[key] = function(...args: []) {
        (func as Function).call(this, ...args);
      }

      descriptor.value = function(...args: []) {
        (func as Function).call(this, ...args);
        this["view"].publish(this["model"].id, key, {key, args});
      }

      if (!this["actions"]) this["actions"] = [];

      this["actions"].push(key);
    }
  }
}
