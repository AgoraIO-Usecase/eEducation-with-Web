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
  public constructor(state?: AdapterState) {
    this._state = Object.assign({
      appId: '',
      channel: '',
      shareId: 2,
      mode: Mode.LIVE,
      codec: Codec.VP8,
      videoProfile: VideoProfiles.STANDARD,
      role: ClientRole.AUDIENCE,
      name: '',
      uid: -1,
    }, state);
  }

  // ----------------  members ----------------
  // private and public members for class Adapter

  private _state: AdapterState

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
      this.resetState();
    }
  }

  private resetState() {
    this._state = {
      role: ClientRole.AUDIENCE,
      name: '',
      uid: -1,
      appId: '',
      channel: '',
      shareId: 2,
      mode: Mode.LIVE,
      codec: Codec.VP8,
      videoProfile: VideoProfiles.STANDARD,
    };
  }

  get state() {
    return this._state;
  }

  public setState(state: Partial<AdapterState>) {
    this._state = Object.assign({}, this._state, state);
  }

  public async initClass(channel: string, userInfo: {
    name: string, role: ClientRole, uid: number
  }) {
    /** ----------------  tbd ----------------  */
    /** bloc.sink */
  }

  public async enterClass(token?: string | null) {
    // get related state
    const { 
      channel, cameraId, microphoneId,
      videoProfile, mode, codec, appId,
      uid, role
    } = this._state;
    const isAudience = role !== ClientRole.AUDIENCE
    const video = isAudience;
    const audio = isAudience;

    // initialize
    const ClientJoinPromise = (async () => {
      this.localClient = enhanceClient(
        AgoraRTC.createClient({ mode, codec })
      );
      await this.localClient.init(appId);
      // sub event 
      // to be done
      this.localClient.join(token, channel, uid)
    })();

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
    const isAudience = this._state.role === ClientRole.AUDIENCE;
    if (!isAudience) {
      await this.localClient.unpublish(this.localStream);
      this.localStream.close();
    }
    await this.localClient.leave();

    /** ---------------- tbd ----------------  */
    /** bloc.sink */
  }

  public async startScreenShare(token?: string | null) {
    const { mode, codec, appId, channel, uid } = this._state;

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

  private _streamControl<T>(action: StreamControlAction, arg: T):void {
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
    return this._streamControl(StreamControlAction.MUTE_VIDEO, uid)
  }

  public muteAudio(uid?: number | number[]) {
    return this._streamControl(StreamControlAction.MUTE_AUDIO, uid)
  }

  public unmuteVideo(uid?: number | number[]) {
    return this._streamControl(StreamControlAction.UNMUTE_VIDEO, uid)
  }

  public unmuteAudio(uid?: number | number[]) {
    return this._streamControl(StreamControlAction.UNMUTE_AUDIO, uid)
  }

  public broadcastMessage(message: string) {
    if(!message) {
      return;
    }
    /** ---------------- tbd ----------------  */
    /** bloc.sink */
  }

}

export default Adapter;