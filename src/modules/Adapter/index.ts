/**
 * Adapter for e-Education based on Agora Web SDK 2.5.1 which
 * provide methods for holding a class without concentration 
 * on original SDK.
 * 
 * By Hao Yang on Feb 2019
 */
/// <reference types="./index" />

import EventEmitter from 'wolfy87-eventemitter';
import AgoraRTC from 'agora-rtc-sdk';
import { enhanceClient, enhanceStream } from '../AgoraProxy';

class Adapter extends EventEmitter {
  public constructor() {
    super();
    this.localUserInfo = {
      role: ClientRole.AUDIENCE,
      name: '',
      uid: '',
    };
    this.localConfig = {
      appId: '',
      channel: '',
      shareId: 2,
      mode: Mode.LIVE,
      codec: Codec.VP8,
      videoProfile: VideoProfiles.STANDARD,
    };
  }

  // ----------------  members ----------------
  // private and public members for class Adapter

  private localUserInfo: UserInfo
  private localConfig: AdapterConfig

  public localClient: any
  public localStream: any
  public shareClient: any
  public shareStream: any

  // ----------------  methods ---------------- 
  // implement methods for class Adapter

  private async resetClient() {
    try {
      await Promise.all([this.leaveClass(), this.stopScreenShare()])
    } finally {
      this.resetStatus();
    }
  }

  private resetStatus() {
    this.localUserInfo = {
      role: ClientRole.AUDIENCE,
      name: '',
      uid: '',
    };
    this.localConfig = {
      appId: '',
      channel: '',
      shareId: 2,
      mode: Mode.LIVE,
      codec: Codec.VP8,
      videoProfile: VideoProfiles.STANDARD,
    };
  }

  public initProfile(config: AdapterConfig) {
    this.localConfig = Object.assign({}, this.localConfig, config);
  }

  public async initClass(appId: string, channel: string, userInfo: UserInfo) {
    // update localConfig and localUserInfo
    const rand = Number(String(new Date().getTime()).slice(7))
    this.localConfig = Object.assign({}, this.localConfig, {
      appId, channel
    });
    this.localUserInfo = Object.assign({
      role: ClientRole.AUDIENCE,
      name: `guest${rand}`,
      uid: rand,
    }, this.localUserInfo, userInfo);

    // init client
    const { mode, codec } = this.localConfig;
    this.localClient = enhanceClient(AgoraRTC.createClient({mode, codec}));
    await this.localClient.init(this.localConfig.appId);

    /** ----------------  tbd ----------------  */
    /** bloc.sink */
  }

  public async enterClass(token?: string | null) {
    // get related config
    const { channel, cameraId, microphoneId, videoProfile } = this.localConfig;
    const { uid, role } = this.localUserInfo;
    const isAudience = role !== ClientRole.AUDIENCE
    const video = isAudience;
    const audio = isAudience;

    // initialize
    const ClientJoinPromise = this.localClient.join(token, channel, uid);
    const StreamInitPromise = (async () => {
      this.localStream = enhanceStream(AgoraRTC.createStream({
        streamID: uid,
        video,
        audio,
        cameraId,
        microphoneId
      }));
      this.localStream.setVideoProfile(videoProfile);
      await this.localStream.init();
    })();

    await Promise.all([ClientJoinPromise, StreamInitPromise]);
    if (!isAudience) {
      await this.localClient.publish(this.localStream);
    }

    /** ---------------- tbd ----------------  */
    /** bloc.sink */
  }

  public async leaveClass() {
    const isAudience = this.localUserInfo.role === ClientRole.AUDIENCE;
    if (!isAudience) {
      await this.localClient.unpublish(this.localStream);
      this.localStream.close();
    }
    await this.localClient.leave();

    /** ---------------- tbd ----------------  */
    /** bloc.sink */
  }

  public async startScreenShare(token?: string | null) {
    const { mode, codec, appId, channel } = this.localConfig;
    const { uid } = this.localUserInfo;

    const ShareClientInitPromise = (async () => {
      this.shareClient = enhanceClient(AgoraRTC.createClient({
        mode, codec
      }));
      await this.shareClient.init(appId);
      await this.shareClient.join(token, channel, uid);
    })();

    const ShareStreamInitPromise = (async () => {
      this.shareStream = enhanceStream(AgoraRTC.createStream({
        streamID: uid,
        video: false,
        audio: false,
        screen: true,
        extensionId: 'minllpmhdgpndnkomcoccfekfegnlikg',
        mediaSource: 'window'
      }));
      await this.shareStream.init();
    })();

    await Promise.all([ShareClientInitPromise, ShareStreamInitPromise]);
    this.shareStream.on('stopScreenSharing', this.stopScreenShare)
    await this.shareClient.publish(this.shareStream);

    /** ---------------- tbd ----------------  */
    /** bloc.sink */
  }

  public async stopScreenShare() {
    await this.shareClient.unpublish(this.shareStream);
    this.shareStream.close();
    await this.shareClient.leave();

    /** ---------------- tbd ----------------  */
    /** bloc.sink */
  }

  private streamControl<T>(action: StreamControlAction, arg: T):void {
    if(arg === undefined) {
      
    }

    if (typeof(arg) === 'number') {
      /** ---------------- tbd ----------------  */
      /** bloc.sink */
      return;
    }

    if (arg instanceof Array) {
      /** ---------------- tbd ----------------  */
      /** bloc.sink */
      return;
    }
  }

  public muteVideo(uid?: number | number[]) {
    return this.streamControl(StreamControlAction.MUTE_VIDEO, uid)
  }

  public muteAudio(uid?: number | number[]) {
    return this.streamControl(StreamControlAction.MUTE_AUDIO, uid)
  }

  public unmuteVideo(uid?: number | number[]) {
    return this.streamControl(StreamControlAction.UNMUTE_VIDEO, uid)
  }

  public unmuteAudio(uid?: number | number[]) {
    return this.streamControl(StreamControlAction.UNMUTE_AUDIO, uid)
  }

  public broadcastMessage(message: string) {
    if(!message) {
      return;
    }
    /** ---------------- tbd ----------------  */
    /** bloc.sink */
  }

}