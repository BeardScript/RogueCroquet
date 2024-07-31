import * as RE from 'rogue-engine';
import * as Croquet from '@croquet/croquet';
import { RootModel } from './RootModel';
import { RootView } from './RootView';
import { RogueCroquet } from '.';

@RE.registerComponent
export default class CroquetConfig extends RE.Component {
  static apiKey = "";
  static appId = "";

  @RE.props.text() appName = "";
  @RE.props.num(0) autoSleep = 30;
  @RE.props.num(0) rejoinLimit = 1000;

  time = 0;

  async awake() {
    Croquet.App.root = RE.Runtime.rogueDOMContainer;

    const config = await this.fetchConfig();

    RogueCroquet.mainSession = await Croquet.Session.join({
      apiKey: config.apiKey,
      appId: config.appId,
      name: this.appName,
      password: "secret",
      autoSleep: this.autoSleep,
      rejoinLimit: this.rejoinLimit,
      model: RootModel,
      view: RootView,
      step: "manual",
    });

    RogueCroquet.activeSession = RogueCroquet.mainSession;

    RogueCroquet.sessions.set(RogueCroquet.mainSession["id"], RogueCroquet.mainSession);

    RE.Runtime.onStop(() => {
      RogueCroquet.sessions.forEach(session => {
        session["view"]?.unsubscribeAll();
        session["view"]?.detach();
        session["leave"]();
      });

      (RogueCroquet.mainSession as any) = undefined;
      (RogueCroquet.activeSession as any) = undefined;
      RogueCroquet.sessions.clear();
    });
  }

  beforeUpdate() {
    this.time += RE.Runtime.deltaTime;
    RogueCroquet.sessions.forEach(session => {
      session["step"](this.time);
    });
  }

  async fetchConfig() {
    const res = await fetch(RE.getStaticPath("croquet.json"));
    const config = await res.json();

    CroquetConfig.apiKey = config.apiKey;
    CroquetConfig.appId = config.appId;

    return config;
  }
}
