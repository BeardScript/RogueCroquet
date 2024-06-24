import * as RE from 'rogue-engine';
import * as THREE from 'three';
import { Actor } from '@RE/RogueEngine/rogue-croquet/Actor';
import CroquetPawn from '@RE/RogueEngine/rogue-croquet/CroquetPawn.re';
import { RogueCroquet } from '@RE/RogueEngine/rogue-croquet';

// To create an Actor Model we extend the Actor class.
// The name must follow the format [component class name]Model.
// We use the @RogueCroquet.Model decorator to register it.
@RogueCroquet.Model
export class PlayerModel extends Actor {
  inputDirection = new THREE.Vector3();
  normalizedInputDir = new THREE.Vector3();
  position = new THREE.Vector3();
  speed = 0.5;

  // This is called as shown in the GameModel.
  update() {
    // If we receive an inputDirection
    if (this.inputDirection.length() > 0) {
      // we normize the vector
      this.normalizedInputDir.copy(this.inputDirection).normalize();
      // and we add the normalized speed to our current position scaled by the speed.
      this.position = this.position.addScaledVector(this.normalizedInputDir, this.speed);
    }
  }
}

// We extend the CroquetPawn Component to generate the Pawn View
// that will be interconnected with the PlayerModel Actor.
@RE.registerComponent
export default class Player extends CroquetPawn {
  // We use the ModelClass.prop() decorator to bind this property to one
  // with the same name in the Model.
  @PlayerModel.prop()
  position = new THREE.Vector3();

  // When we pass 'true' as a parameter, we create a two-way bind. Which means we can
  // send updates to the prop in the model using this.updateProp("propName")
  @PlayerModel.prop(true)
  inputDirection = new THREE.Vector3();

  // This is called when both the Model and View are initialized.
  init() {
    // If this view 'isMe' meaning, this is our Pawn
    if (this.isMe && this.object3d instanceof THREE.Mesh) {
      // we update our object3d's material to recognize it
      this.object3d.material = new THREE.MeshStandardMaterial({color: 0x5599cc});
    }

    this.object3d.position.copy(this.position);
  }

  update() {
    // On every frame we interpolate our object3d's current position towards 
    // the received position, using THREE.MathUtils.damp()
    this.dampV3(this.object3d.position, this.position, 20);

    // If this is our Pawn we want to get the user input.
    if (this.isMe) this.getInput();
  }

  getInput() {
    // We get the values in the predevined "Move" Input Axis.
    let {x: hAxis, y: vAxis} = RE.Input.getAxes("Move");

    // If we provide moement input
    if (hAxis !== this.inputDirection.x || vAxis !== this.inputDirection.z) {
      // we set the inputDirection and use this.updateProp() to tell the Model
      // that we need to move.
      this.inputDirection.set(hAxis, 0, vAxis);
      this.updateProp("inputDirection");
    }
  }
}
