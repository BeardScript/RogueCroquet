import * as Croquet from '@croquet/croquet';

export class BaseModel extends Croquet.Model {
  viewId: string;
  isStaticModel = false;

  _propConfigs: Record<string, {updateTime: number, rate: number}> = {};

  init(params: {viewId: string}) {
    super.init(params);
    this.viewId = params.viewId;

    this.constructor["propConfigs"] && 
    Object.entries(this.constructor["propConfigs"]).forEach(([key, value]) => {
      this["_propConfigs"][key] = {updateTime: 0, rate: value as number};
    });

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
    const value = this.onBeforeUpdateProp(data.key, data.value);
    const changed = value !== undefined;
    this["_" + data.key] = changed ? value : data.value;
    this.publish(this.id, data.key + "View", {[data.key]: this["_" + data.key], viewId: data.viewId, changed});
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

  static prop(twoWay: boolean | number = false) {
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

      if (!target.constructor["propConfigs"]) target.constructor["propConfigs"] = {};

      if (twoWay) {
        this["twoWayBinds"][key] = true;
        if (typeof twoWay === "number" && twoWay > 0) {
          target.constructor["propConfigs"][key] = twoWay;
        }
      }
    }
  }

  static action(rate?: number) {
    return (target: Object, key: string, descriptor: PropertyDescriptor) => {
      const func = descriptor.value;

      this.prototype[key] = function(...args: []) {
        const propConfig = this["_propConfigs"][key];

        if (propConfig !== undefined) {
          const now = this.now();
          const dt = now - propConfig.updateTime;
          if (dt >= propConfig.rate) {
            propConfig.updateTime = now;
          } else {
            return;
          }
        }

        (func as Function).call(this, ...args);
      }

      descriptor.value = function(...args: []) {
        const propConfig = this["_propConfigs"][key];

        if (propConfig !== undefined) {
          const now = Date.now();
          const dt = now - propConfig.updateTime;
          if (dt >= propConfig.rate) {
            propConfig.updateTime = now;
          } else {
            return;
          }
        }

        (func as Function).call(this, ...args);
        this["view"].publish(this["model"].id, key, {key, args});
      }

      if (!this["actions"]) this["actions"] = [];

      this["actions"].push(key);

      if (!target.constructor["propConfigs"]) target.constructor["propConfigs"] = {};

      if (typeof rate === "number" && rate > 0) {
        target.constructor["propConfigs"][key] = rate;
      }
    }
  }
}
