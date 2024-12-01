import * as RE from 'rogue-engine';
import * as Croquet from '@croquet/croquet';
import { RogueCroquet } from '@RE/RogueEngine/rogue-croquet';
import { BaseModel } from '@RE/RogueEngine/rogue-croquet/BaseModel';
import CroquetView from './CroquetView.re';
import CroquetConfig from './CroquetConfig.re';

type Room = {name: string, views: string[], started?: boolean, scene: string}

@RogueCroquet.Model
export class CroquetLobbyModel extends BaseModel {
  isStaticModel = true;
  rooms: Room[] = [];
  views: {[viewId: string]: string} = {};

  autoMatch = true;
  allowJoinStarted = true;
  deleteEmptyRoom = true;
  roomMinPlayers = 1;
  roomMaxPlayers = 8;

  onInit() {
    this.subscribe(this.id, "playerJoined", this.onPlayerJoined);
    this.subscribe(this.id, "createRoom", this.onCreateRoom);
    this.subscribe(this.sessionId, "view-exit", this.leave);
  }

  onPlayerJoined(params: {viewId: string}) {
    this.views[params.viewId] = params.viewId;
    if (this.autoMatch) this.match(params.viewId);
  }

  onCreateRoom(params: {viewId: string, scene: string}) {
    const room = this.createRoom(params.viewId, params.scene);
    this.joinRoom(params.viewId, room);
  }

  match(viewId: string) {
    let room = this.rooms.find(r => {
      if (r.started && !this.allowJoinStarted) return false;
      if (r.views.length >= this.roomMaxPlayers) return false;
      return true;
    });

    if (!room) {
      // room = this.createRoom(viewId, "");
      this.publish(viewId, "noAvailableRooms");
      return;
    }

    this.joinRoom(viewId, room);
  }

  createRoom(name: string, scene: string) {
    this.rooms.push({name, views: [], scene});
    this.rooms = this.rooms;

    return this.rooms[this.rooms.length - 1];
  }

  deleteRoom(name: string) {
    const roomIndex = this.rooms.findIndex(r => r.name === name);
    if (roomIndex < 0) return;

    this.rooms.splice(roomIndex, 1);
    this.rooms = this.rooms;
  }

  joinRoom(viewId: string, room: Room) {
    if (!room) return;
    if (room.views.length >= this.roomMaxPlayers) return;
    room.views.push(viewId);
    this.rooms = this.rooms;
    
    this.publish(viewId, "joinedRoom", {name: room.name, scene: room.scene, started: room.started});

    if (!room.started && room.views.length >= this.roomMinPlayers) {
      this.startRoom(room);
    }
  }

  startRoom(room: Room) {
    if (!room) return;
    room.started = true;

    room.views.forEach(v => {
      this.publish(v, "roomStarted", {name: room.name, scene: room.scene});
    });

    if (!this.allowJoinStarted) {
      const roomIndex = this.rooms.findIndex(r => r.name === room.name);
      if (roomIndex >= 0) this.rooms.splice(roomIndex, 1);
    }

    this.rooms = this.rooms;
  }

  leaveRoom(viewId: string) {
    const roomDeleteQueue: Room[] = [];
    for (let room of this.rooms) {
      const viewIndex = room.views.indexOf(viewId);
      if (viewIndex < 0) continue;
      room.views.splice(viewIndex, 1);

      if (this.deleteEmptyRoom && room.views.length <= 0) {
        roomDeleteQueue.push(room);
      }
    }

    roomDeleteQueue.forEach(room => this.deleteRoom(room.name));

    if (roomDeleteQueue.length <= 0) this.rooms = this.rooms;
  }

  leave(viewId: string) {
    this.leaveRoom(viewId);
    delete this.views[viewId];
    this.views = this.views;
  }
}

@RE.registerComponent
export class CroquetLobby extends CroquetView {
  isStaticModel = true;

  lobbyScene = "";
  roomScene = "";

  static gameStarted = false;
  static sessionId: string;
  static model: BaseModel;
  static view: Croquet.View;

  init() {
    if (!CroquetLobby.gameStarted) this.view.publish(this.model.id, "playerJoined", {viewId: this.viewId});

    this.view.subscribe(this.viewId, "joinedRoom", this._onJoinedRoom.bind(this));
    this.view.subscribe(this.viewId, "noAvailableRooms", this.onNoAvailableRooms.bind(this));
    this.view.subscribe(this.viewId, "roomStarted", this._onRoomStarted.bind(this));
    this.view.subscribe(this.viewId, "roomEnded", this._onRoomEnded.bind(this));

    this.onJoinedLobby();
  }

  beforeUpdate() {
    if (!this.initialized && RogueCroquet.rootView && CroquetLobby.sessionId) {
      console.log("Lobby Init");
      this.sessionId = CroquetLobby.sessionId;
      this.view = CroquetLobby.view;

      if (this.parentPawn && !this.parentPawn.model) return;

      if (this.parentPawn && this.parentPawn.model) {
        this.model = this.parentPawn.model.models.get(this.name) as BaseModel;

        if (this.model) {
          this.onModelCreated({model: this.model, viewId: this.model.viewId});
          return;
        }

        if (this.view.viewId !== this.parentPawn.viewId) return;
      }

      const params = {};

      this.constructor["binds"]?.forEach(key => {
        params[key] = this[key];
      });

      this.constructor["propConfigs"] && 
      Object.entries(this.constructor["propConfigs"]).forEach(([key, value]) => {
        this["_propConfigs"][key] = {updateTime: 0, rate: value as number};
      });

      this.onModelCreated({model: CroquetLobby.model, viewId: CroquetLobby.view.viewId});
      return;
    }

    super.beforeUpdate();
  }

  onModelCreated(params: { model: Croquet.Model; viewId: string; }) {
    super.onModelCreated(params);
    CroquetLobby.view = this.view;
    CroquetLobby.model = this.model;
    CroquetLobby.sessionId = RogueCroquet.mainSessionId;
  }

  createRoom() {
    console.log("Creating Room...");
    this.view.publish(this.model.id, "createRoom", {viewId: this.viewId, scene: this.roomScene});
  }

  onJoinedLobby() {}
  onJoinedRoom(room: {name: string, scene: string, started: boolean}) {}
  onBeforeRoomStarted(room: {name: string, scene: string}) {}
  onBeforeRoomEnded() {}

  onNoAvailableRooms() {
    this.createRoom();
  }

  _onJoinedRoom(room: {name: string, scene: string, started: boolean}) {
    if (CroquetConfig.sessionName === room.name) return;
    CroquetConfig.sessionName = room.name;
    this.onJoinedRoom(room);

    if (room.started) {
      this._onRoomStarted(room);
    }
  }

  _onRoomStarted(room: {name: string, scene: string}) {
    this.onBeforeRoomStarted(room);
    if (room.name === CroquetConfig.sessionName) {
      CroquetLobby.gameStarted = true;
      (RogueCroquet.activeSession as any) = undefined;
      console.log("Loading Scene");
      RE.Runtime.stop();
      RE.App.loadScene(room.scene || this.roomScene || RE.App.scenes.find(s => s.uuid === RE.App.currentScene.uuid)?.name as string);
    }
  }

  _onRoomEnded() {
    this.onBeforeRoomEnded();
    CroquetConfig.sessionName = undefined;
    CroquetLobby.gameStarted = false;

    RogueCroquet.disconnect();

    (RogueCroquet.activeSession as any) = undefined;
    RE.Runtime.stop();
    RE.App.loadScene(this.lobbyScene || RE.App.scenes.find(s => s.uuid === RE.App.currentScene.uuid)?.name as string);
  }
}
