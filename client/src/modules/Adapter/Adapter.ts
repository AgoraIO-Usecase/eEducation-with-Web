import RTCEngine from "./RTCEngine";
import { AdapterConfig } from "./types";
import Signal from "./Signal";

export default class Adapter {
  public initialized: boolean
  public rtcEngine: RTCEngine;
  public signal: Signal;
  public config: any;

  constructor(appId: string) {
    this.initialized = false;
    this.signal = new Signal(appId);
    this.rtcEngine = new RTCEngine(appId);
    this.config = {
      channel: "",
      shareId: 2,
      role: 0,
      streamId: -1,
    }
  }

  public async initialize(config: AdapterConfig) {
    this.config = config;
    const {channel = '', name, role, streamId} = this.config
    await this.rtcEngine.initialize(config);
    await this.signal.initialize(config);
    const {channelAttr, members} = await this.signal.join(channel, {
      role, name, streamId
    })
    this.initialized = true
    return {
      channelAttr, members
    }
  }

  public async release() {
    try {
      await this.signal.release();
      await this.rtcEngine.leave();
    } finally {
      this.initialized = false;
    }
  }
}
