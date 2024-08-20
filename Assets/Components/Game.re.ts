import * as RE from 'rogue-engine';
import CroquetView from '@RE/RogueEngine/rogue-croquet/CroquetView.re';
import { BaseModel } from '@RE/RogueEngine/rogue-croquet/BaseModel';
import { RogueCroquet } from '@RE/RogueEngine/rogue-croquet';

// To create a regular Model we extend the BaseModel class.
// The name must follow the format [component class name]Model.
// We use the @RogueCroquet.Model decorator to register it.
@RogueCroquet.Model
export class GameModel extends BaseModel {
  // A static model makes sure that there's only one instance of
  // this model for everyone. Ideal for Game Logic and simmilar.
  isStaticModel = true;

  spawnPoints = [
    [0, 0, 5], [5, 0, 5], [5, 0, 0], 
    [0, 0, -5], [-3, 0, -5], [-5, 0, 0],
    [5, 0, -5], [-5, 0, 5],
  ];

  selectSpawnPoint() {
    // We get a random spawn point from the list using Croquet's Model.random()
    // which lets all clients compute the exact same number in their copy of the model.
    return this.spawnPoints[(Math.floor(this.random() * this.spawnPoints.length))];
  }
}

// We extend the CroquetView Component to generate the View
// that will be interconnected with the GameModel.
@RE.registerComponent
export default class Game extends CroquetView {
  isStaticModel = true;
  // We create a field to drop the Prefab containing
  // our Player Actor.
  @RE.props.prefab() player: RE.Prefab;

  // This is called when both the Model and View are initialized.
  init() {
    // We instantiate our Player Actor.
    this.player.instantiate();
  }
}
