import * as RE from 'rogue-engine';
import * as Croquet from '@croquet/croquet';
import { RootModel } from './RootModel';
import { RootView } from './RootView';
import { RogueCroquet } from '.';

@RE.registerComponent
export default class CroquetConfig extends RE.Component {
  static apiKey = "";
  static appId = "";
  static sessionName?: string;

  @RE.props.text() appName = "";
  @RE.props.num(0) autoSleep = 30;
  @RE.props.num(0) rejoinLimit = 1000;

  time = 0;

  async awake() {
    Croquet.App.root = RE.Runtime.rogueDOMContainer;

    const config = await this.fetchConfig();

    RogueCroquet.activeSession = await Croquet.Session.join({
      apiKey: config.apiKey,
      appId: config.appId,
      name: CroquetConfig.sessionName || this.appName,
      password: "secret",
      autoSleep: this.autoSleep,
      rejoinLimit: this.rejoinLimit,
      model: RootModel,
      view: RootView,
      step: "manual",
    });

    if (!RogueCroquet.mainSession) {
      RogueCroquet.mainSession = RogueCroquet.activeSession;
    }

    RogueCroquet.sessions.set(RogueCroquet.activeSession["id"], RogueCroquet.activeSession);

    const onPlay = window["rogue-editor"]?.editorRuntime?.onPlay(() => {
      onPlay?.stop();
      console.log("disconnecting...");
      RogueCroquet.disconnect();
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
