import * as Croquet from "@croquet/croquet";
import * as THREE from "three";
import { Actor } from "./Actor";
import { BaseModel } from "./BaseModel";

export class RootModel extends Croquet.Model {
  static modelClasses = new Map<string, typeof Croquet.Model>();
  actors = new Map<string, {viewId: string, pawnPrefab: string, model: Actor}>();

  static types() {
    return {
      "THREE.Vector3": {
        cls: THREE.Vector3,
        write: v => [v.x, v.y, v.z],        // serialized as '[...,...,...]' which is shorter than the default above
        read: v => new THREE.Vector3(v[0], v[1], v[2]),
      },
      "THREE.Quaternion": {
        cls: THREE.Quaternion,
        write: v => [v.x, v.y, v.z, v.w],        // serialized as '[...,...,...]' which is shorter than the default above
        read: v => new THREE.Quaternion(v[0], v[1], v[2], v[3]),
      },
      "THREE.Euler": THREE.Euler,
    };
  }

  init() {
    this.subscribe(this.sessionId, "removeModel", this.removeModel);
    this.subscribe(this.sessionId, "createModel", this.createModel);
    this.subscribe(this.sessionId, "createActor", this.createActor);
    this.subscribe(this.sessionId, "view-exit", this.handleViewExit);
  }

  handleViewExit(viewId: string) {
    const removed: string[] = [];
    this.actors.forEach(actor => {
      if (actor.model.isStaticModel) return;
      if (actor.viewId !== viewId) return;
      actor.model.remove();
      removed.push(actor.model.id);
    });

    removed.forEach(modelId => {
      this.actors.delete(modelId);
    });
  }

  createActor(params: {modelName: string, viewId: string, pawnPrefab: string, params: any}) {
    if (!params.viewId) return;
    if (!params.pawnPrefab) return;

    const modelClass = RootModel.modelClasses.get(params.modelName);
    if (!modelClass) return;

    const model = modelClass.create({viewId: params.viewId}) as Actor;

    this.actors.set(model.id, {viewId: params.viewId, pawnPrefab: params.pawnPrefab, model});
    model.publish(this.sessionId, "actorCreated", {model: model, viewId: params.viewId, pawnPrefab: params.pawnPrefab});
  }

  removeModel(params: {modelId: string, viewId: string}) {
    this.actors.forEach(actor => {
      const remove: string[] = [];
      actor.model.models.forEach((model, key) => {
        if (model.id === params.modelId) remove.push(key);
      });
      remove.forEach(key => actor.model.models.delete(key));
    });

    const removed = this.actors.delete(params.modelId);

    if (removed) {
      this.publish(this.sessionId, "actorRemoved", params.modelId);
    }
  }

  createModel(params: {parentActor: string, modelName: string, componentName: string, viewId: string, isStatic: boolean, params: any}) {
    if (!params.viewId) return;

    if (params.isStatic) {
      const existingModel = this.wellKnownModel(params.componentName) as BaseModel;

      if (existingModel) {
        existingModel.publish(this.sessionId + params.modelName, "ready", {model: existingModel, viewId: existingModel.viewId, sessionId: this.sessionId});
        return;
      }
    }

    const modelClass = RootModel.modelClasses.get(params.modelName);
    if (!modelClass) return;

    const model = modelClass.create({viewId: params.viewId}) as BaseModel;

    if (params.isStatic) {
      model.beWellKnownAs(params.componentName);
    }

    if (params.parentActor) {
      const parent = this.getModel(params.parentActor) as Actor;
      if (parent) {
        model.viewId = parent.viewId;
        parent.models.set(params.componentName, model as BaseModel);
      }
    }

    model.publish(this.sessionId + params.modelName, "ready", {model: model, viewId: params.viewId});
  }
}

RootModel.register("RootModel");
