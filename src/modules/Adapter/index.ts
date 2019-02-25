/**
 * Adapter for e-Education based on Agora Web SDK 2.5.1 which
 * provide methods for holding a class without concentration
 * on original SDK.
 *
 * Use public method of class Adapter as sink,
 * And register event listener with methods like Adapater.localClient.on as stream
 * === public methods like init class ===> | Adapter | === emit event ===>
 *
 * By Hao Yang on Feb 2019
 */

import AgoraRTC from 'agora-rtc-sdk';

import {
  ClientRole,
  VideoProfiles,
  Mode,
  Codec,
  StreamControlAction,
  // MediaDevice,
  AdapterState
} from './types';
import { enhanceClient, enhanceStream } from '../AgoraProxy';

class Adapter {
  public constructor(state: AdapterState) {
    this._state = Object.assign(
      {
        appId: '',
        channel: '',
        shareId: 2,
        mode: Mode.LIVE,
        codec: Codec.VP8,
        videoProfile: VideoProfiles.STANDARD,
        role: ClientRole.AUDIENCE,
        name: '',
        uid: -1
      },
      state
    );
    this._rtcEngine = AgoraRTC;
    this.localClient = this.$createClient({
      mode: this._state.mode,
      codec: this._state.codec
    });
    this.shareClient = this.$createClient({
      mode: this._state.mode,
      codec: this._state.codec
    });
  }

  // ----------------  members ----------------
  // private and public members for class Adapter

  private _state: AdapterState;

  public _rtcEngine: any;
  public localClient: any;
  public localStream: any;
  public shareClient: any;
  public shareStream: any;

  // ----------------  methods ----------------
  // implement methods for class Adapter
  private _resetState() {
    this._state = Object.assign(this._state, {
      role: ClientRole.AUDIENCE,
      name: '',
      uid: -1,
      channel: ''
    });
  }

  get state() {
    return this._state;
  }

  public setState(state: {
    channel: string;
    uid: number;
    name: string;
    role: ClientRole;
  }) {
    this._state = Object.assign({}, this._state, state);
  }

  public $createClient(config: { mode?: Mode; codec?: Codec }) {
    const { mode, codec } = config;
    const client = enhanceClient(
      AgoraRTC.createClient({
        mode: mode || Mode.LIVE,
        codec: codec || Codec.VP8
      })
    );
    return client;
  }

  public async $createStream(config: {
    streamID?: number;
    video: boolean;
    audio: boolean;
    screen?: boolean;
    cameraId?: string;
    microphoneId?: string;
    videoProfile?: string;
    [propName: string]: any;
  }) {
    const stream = enhanceStream(AgoraRTC.createStream(config));
    if (config.videoProfile) {
      stream.setVideoProfile(config.videoProfile);
    }
    await stream.init();
    return stream;
  }

  public async initClass(
    channel: string,
    userInfo: {
      name: string;
      role: ClientRole;
      uid: number;
    }
  ) {
    /** ----------------  tbd ----------------  */
    /** bloc.sink */
  }

  public async enterClass(token?: string | null) {
    // get related state
    const {
      channel,
      cameraId,
      microphoneId,
      videoProfile,
      appId,
      uid,
      role
    } = this._state;
    const isAudience = role !== ClientRole.AUDIENCE;
    const video = isAudience;
    const audio = isAudience;

    // initialize
    const ClientJoinPromise = (async () => {
      await this.localClient.init(appId);
      // sub event
      // to be done
      await this.localClient.join(token, channel, uid);
    })();

    const StreamInitPromise = (async () => {
      this.localStream = await this.$createStream({
        streamID: uid,
        video,
        audio,
        cameraId,
        microphoneId,
        videoProfile
      });
    })();

    await Promise.all([ClientJoinPromise, StreamInitPromise]);
    if (!isAudience) {
      await this.localClient.publish(this.localStream);
    }

    /** ---------------- tbd ----------------  */
    /** bloc.sink */
  }

  public async leaveClass() {
    const _leaveClass = async () => {
      const isAudience = this._state.role === ClientRole.AUDIENCE;
      if (!isAudience) {
        await this.localClient.unpublish(this.localStream);
        this.localStream.close();
      }
      await this.localClient.leave();
    };
    return Promise.all([_leaveClass, this.stopScreenShare]);

    /** ---------------- tbd ----------------  */
    /** bloc.sink */
  }

  public async startScreenShare(token?: string | null) {
    const { appId, channel, uid } = this._state;

    const ShareClientInitPromise = (async () => {
      await this.shareClient.init(appId);
      await this.shareClient.join(token, channel, uid);
    })();

    const ShareStreamInitPromise = (async () => {
      this.shareStream = await this.$createStream({
        streamID: uid,
        video: false,
        audio: false,
        screen: true,
        extensionId: 'minllpmhdgpndnkomcoccfekfegnlikg',
        mediaSource: 'window'
      });
    })();

    await Promise.all([ShareClientInitPromise, ShareStreamInitPromise]);
    this.shareStream.on('stopScreenSharing', this.stopScreenShare);
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

  private _streamControl<T>(action: StreamControlAction, arg: T): void {
    if (arg === undefined) {
    }

    if (typeof arg === 'number') {
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
    return this._streamControl(StreamControlAction.MUTE_VIDEO, uid);
  }

  public muteAudio(uid?: number | number[]) {
    return this._streamControl(StreamControlAction.MUTE_AUDIO, uid);
  }

  public unmuteVideo(uid?: number | number[]) {
    return this._streamControl(StreamControlAction.UNMUTE_VIDEO, uid);
  }

  public unmuteAudio(uid?: number | number[]) {
    return this._streamControl(StreamControlAction.UNMUTE_AUDIO, uid);
  }

  public broadcastMessage(message: string) {
    if (!message) {
      return;
    }
    /** ---------------- tbd ----------------  */
    /** bloc.sink */
  }
}

export default Adapter;
