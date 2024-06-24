import { BaseModel } from "./BaseModel";

export class Actor extends BaseModel {
  models = new Map<string, BaseModel>();

  remove() {
    this.models.forEach(model => model.remove());
    super.remove();
  }
}
