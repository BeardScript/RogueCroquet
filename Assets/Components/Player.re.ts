import * as RE from 'rogue-engine';
import * as THREE from 'three';
import { Actor } from '@RE/RogueEngine/rogue-croquet/Actor';
import CroquetPawn from '@RE/RogueEngine/rogue-croquet/CroquetPawn.re';
import { RogueCroquet } from '@RE/RogueEngine/rogue-croquet';
import { GameModel } from './Game.re';

// To create an Actor Model we extend the Actor class.
// The name must follow the format [component class name]Model.
// We use the @RogueCroquet.Model decorator to register it.
@RogueCroquet.Model
export class PlayerModel extends Actor {
  /*
    Here we can set the common interface with the component,
    and all the Model-specific props and functions.
  */
  position = new THREE.Vector3();
  normalizedInputDir = new THREE.Vector3();
  speed = 1;

  onInit() {
    // Get the stati GameModel
    const gameLogicModel = this.wellKnownModel("Game") as GameModel;
    // Use it to get a random spawn point
    const spawnPoint = gameLogicModel.selectSpawnPoint();
    this.position.fromArray(spawnPoint);
  }
}

// We extend the CroquetPawn Component to generate the Pawn View
// that will be interconnected with the PlayerModel Actor.
@RE.registerComponent
export default class Player extends CroquetPawn {
  // If using Typescript we can define the subtype of our model this way.
  model: PlayerModel;

  // We use the ModelClass.prop() decorator to bind this property to one
  // with the same name in the Model.
  @PlayerModel.prop()
  position = new THREE.Vector3();

  inputDirection = new THREE.Vector3();
  normalizedInputDir = new THREE.Vector3();
  localPos = new THREE.Vector3();
  speed = 1;

  // This is called when both the Model and View are initialized.
  init() {
    // If this view 'isMe' meaning, this is our Pawn
    if (this.isMe && this.object3d instanceof THREE.Mesh) {
      // we update our object3d's material to recognize it
      this.object3d.material = new THREE.MeshStandardMaterial({color: 0x5599cc});
    }

    // Copy the initial position from the fresh image of the model
    this.localPos.copy(this.model.position);
    this.object3d.position.copy(this.model.position);
  }

  update() {
    // If this is is the Pawn under our control...
    if (this.isMe) {
      // we get the user input.
      let {x: hAxis, y: vAxis} = RE.Input.getAxes("Move");
      this.inputDirection.set(hAxis, 0, vAxis);
      // and call our sharedLoop function passing the inputDirection.
      this.sharedLoop(this.inputDirection);
    }

    // Define which position we want to interpolate every frame
    const pos = this.isMe ? this.localPos : this.position;
    // Interpolate the position.
    this.dampV3(this.object3d.position, pos, 20);
  }

  @PlayerModel.action(55)
  sharedLoop(inputDirection: THREE.Vector3) {
    let length = inputDirection.length();
    // we normize the vector and multiply the length (we make sure it's not greater than 1)
    this.normalizedInputDir.copy(inputDirection).normalize().multiplyScalar(length > 1 ? 1 : length);
    // If we're executing this method in the model...
    if (this instanceof PlayerModel) {
      // we add the normalized vector scaled by the speed to the prop this.position
      // which will be broadcasted to all clients.
      this.position = this.position.addScaledVector(this.normalizedInputDir, this.speed);
    } else {
      // otherwise we do the same with this.localPos so that we can react to input immediately.
      this.localPos.addScaledVector(this.normalizedInputDir, this.speed);
    }
  }
}
