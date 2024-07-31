## Rogue Croquet

<img src="/Static/rogue-croquet.webp" alt="RogueCroquet" title="RogueCroquet"/> 

This is an integration package of [Croquet](https://croquet.io/index.html) for [Rogue Engine](https://rogueengine.io/) to provide networking capabilities without the need for a server.

The package is an early beta and may be missing some features, that said, given how Croquet itself is very mature and production ready, you should be safe to us this package in production. This project is open source and open for contributions.

This repo includes a skeleton project to act as a basic guide, along with the package itself in its corresponding folder.

### Instructions

**The First thing** you need to do is [sign up for Croquet](https://croquet.io/account/) and get your **App ID** and **API Key**. Then create a file in `YourProject/Static` called `croquet.json` with the following content:

```json
{
  "appId": "[your app ID here]",
  "apiKey": "[your API key here]"
}
```

These are public so don't worry about writing them down there. Still, it's highly recommended to add `Static/croquet.json` to your .gitignore if your project is open-source.

**To install the package** in your project, search for "Rogue Croquet" in the Marketplace within the Rogue Editor and hit *install*.

Then in the Editor you need to add the **CroquetConfig** component to an object in your scene, preferably the scene root itself.

Now you're ready to start creating your own Models and Views to synchronize your players.

**To use this project** simply clone it and open it with Rogue Engine. Open the project in two browser windows side by side. When you move the blue ball on one of them using WASD, you'll see the white ball moving on the other.

### How it works

Croquet has a Model-View pattern, where clients running the exact same Model are synchronized through the use of [Multisynq](https://multisynq.io/) reflectors.

In a regular client-server application the Model would be the equivalent of the net code, only in this case, it runs on the client. Since only those running the same Model can be synchronized within a Session, we can make client-side **authoritative** computations.

The Views will provide the purely client-side code tied to the visuals.

In this dynamic the View can read the Model but the Model can't read the View, although, they can receive messages from each other through a publish/subscribe mechanism.

For more info on this check out the [Croquet docs](https://croquet.io/docs/croquet/).

### The Rogue Croquet Model-View

Rogue Croquet works some magic under the hood to get rid of a lot of boilerplate and simplify the communications between Models and Views.

For the view we'll make a regular Rogue Engine component extend the **CroquetView** component and above it we'll create a class that extends **BaseModel**. Our Model class must follow the naming format [component name]Model.

```typescript
import * as RE from 'rogue-engine';
import CroquetView from '@RE/RogueEngine/rogue-croquet/CroquetView.re';
import { BaseModel } from '@RE/RogueEngine/rogue-croquet/BaseModel';
import { RogueCroquet } from '@RE/RogueEngine/rogue-croquet';

@RogueCroquet.Model
export class MyViewModel extends BaseModel {}

@RE.registerComponent
export default class MyView extends CroquetView {}

```

Check out `Assets/Components/Game.re.ts` in this repo for a full example

### The Rogue Croquet Actor-Pawn

In Rogue Croquet an Actor represents the Model of an object controlled by a user and the Pawn is the View of that Actor.

We use Prefabs to tell the view what an Actor looks like for you and the rest of the players. The Prefab must contain the Actor-Pawn component on its root.

To create the Actor-Pawn component  we'll make a regular Rogue Engine component extend **CroquetPawn** and above it we'll create a class that extends the **Actor** Model class. Our actor class must follow the naming format [component name]Model same as any other model.

```typescript
import * as RE from 'rogue-engine';
import CroquetPawn from '@RE/RogueEngine/rogue-croquet/CroquetPawn.re';
import { Actor } from '@RE/RogueEngine/rogue-croquet/Actor';
import { RogueCroquet } from '@RE/RogueEngine/rogue-croquet';

@RogueCroquet.Model
export class MyPawnModel extends Actor {}

@RE.registerComponent
export default class MyPawn extends CroquetPawn {}

```

Check out `Assets/Components/Player.re.ts` in this repo for a full example

#### Actor Child Models

An Actor-Pawn can have multiple Model-View children. These will be created and destroyed together with their parent Actor.

The child models can be anywhere in the prefab structure

```
- PrefabRoot (Actor, ChildModel1, ChildModel2)
  - ChildObject (ChildModel3)
    - DeepNestedObject (childModel4, childModel5)
```

This helps you syncronize multiple elements of a player separately while still within the context of the same Actor. An example of this would be a Player actor with a child Model that handles transforms and a deep nested one that handles a weapon instantiated by a prefab.

### Static Models

Certain models need to have only one instance synchronized between clients. To achieve this we need to give both the Model and View, the property `isStaticModel = true`. A good example of this would be a Model handling the Game Logic as seen in the Game component in this repo.

```typescript
@RogueCroquet.Model
export class MyViewModel extends BaseModel {
  isStaticModel = true;
}

@RE.registerComponent
export default class MyView extends CroquetView {
  isStaticModel = true;
}

```

### Synchronize Properties

To communicate between Model and a View, Rogue Croquet provides a simple way to bind properties with the same name between them using the decorator `@MyModel.prop()`. This creates a one-way bind, so whenever the given property is updated in the Model, it'll be updated in the View.

You can also pass in `true` as a parameter to create a two-way bind, allowing the View to update the given property using `this.updateProp("myProp")`.

It works both with regular Model-Views and Actor-Pawns.

```typescript
@RogueCroquet.Model
export class MyViewModel extends BaseModel {
  counter = 0;

  onInit() {
    this.update();
  }

  update() {
    this.counter += 1; // this will update MyView.counter
    this.future(50).update()
  }
}

@RE.registerComponent
export default class MyView extends CroquetView {
  @MyViewModel.prop()
  counter = 0;

  // You're not required to add props to the Model unless you
  // need to use it there. they'll be defined there for you.
  @MyViewModel.prop(true)
  myName = "";

  init() {
    if (this.isMe) {
      this.myName = "My Name";
      // this will update myName in the Model and will 
      // broadcast to all clients
      this.updateProp("myName");
    }
  }
}

```

### Synchronize Actions

Another way to "communicate" between Model and View is to create methods that will be executed in both. You can achieve this using the `@MyModel.action()` decorator.

It works both with regular Model-Views and Actor-Pawns.

```typescript
@RogueCroquet.Model
export class MyPawnModel extends Actor {}

@RE.registerComponent
export default class MyPawn extends CroquetPawn {
  @MyPawnModel.action()
  myAction() {
    // Do something in both the Model and View using common API
    if (this instanceof MyPawnModel) {
      // Do something only in the Model
    } else {
      // Do something only in the View
    }
  }
}

```

### API

#### BaseModel

##### Properties

`viewId: string`

The ID of the view related to this Model.

`isStaticModel: boolean`

When true, the model will have a single instance synchronized between all clients.

##### Methods

`onInit()`

This will be exectuted when this Model is initialized.

`onRemoved()`

This will be executed when this Model is removed an destroyed.

`onBeforeUpdateProp(key: string, value: any)`

This will be executed before a property **key** is updated with the given **value** by the View, using **updateProp()**. If you return a non-undefined value, it will use that to override the incoming value. This is especially useful to perform authoritative checks on the model.

`remove()`

This will handle the removal and destruction of this Model.

##### Decorators

`prop(twoWayBind?: boolean | number)`

Used on the View's propertis to generate a bind between properties of the same name in the Model. You can pass in `true` as a parameter to give write access to the prop using **updateProp**. You can pass in a number to throttle the updateProp for that property. This helps you manage the amount of messages you're sending per second. You shouldn't send more than 20.

`action()`

Use it on a Method in the View's code to make it run on both the Model and the View.

#### Actor

`extends BaseModel`

##### Properties

`models: Map<string, BaseModel>`

A collection of all child models of this Actor.

#### CroquetComponent

This is used internally to provide common API for **CroquetView** and **CroquetPawn**

##### Properties

`isStaticModel: boolean`

Tells this View that the related model is Static, so we'll be synchronized to its ony instance.

`model: BaseModel`

This is the last received version of the model related to this view. It's been serialized and parsed along the way so it doesn't hold any references.

`view: Croquet.View`

This is the View of our local client.

`viewId: string`

This is the ID of the view managing this Model-View.

`sessionId: string`

The ID of the session where this View was created.

`initialized: boolean`

This tells us whether both Model and View of this component have been initialized

`isMe: boolean`

This tells us whether this Model-View is being managed by the local client.

##### Methods

`init()`

Runs when both the Model and View have been initialized.

`onBeforeUpdateProp(key: string, value: any)`

Runs right before the property **key** is updated with the given **value** by the Model.

`updateProp(key: string, force = false)`

Updates the two-way bound prop with the given **key** in the Model with its current value. You can optionally use the second parameter to **force** an update, regardless of the update rate set in the **prop()** decorator.

If the update is sent, the return value will be true. If on the countrary the update is not sent, the return value will be false. If there's not update rate set on the property, this will always return true.

`dampV3(from: THREE.Vector3, to: THREE.Vector3, lambda: number)`

Frame independent, smooth interpolation **from** vector **to** vector. A higher **lambda** value will make the movement more sudden, and a lower value will make the movement more gradual. Interpolation will be applied directly to the **from** vector.

#### CroquetView

`extends CroquetComponent`

##### Properties

`parentPawn: CroquetPawn | undefined`

The parent Actor-Pawn of this Model-View if any.

#### CroquetPawn

`extends CroquetComponent`

##### Properties

`pawnPrefab: RE.Prefab`

The Prefab to instantiate in other clients for this Actor-Pawn. Can be the same one as the local client.

`model: Actor`

Same as CroquetComponent.model only this will be an instance of Actor.
