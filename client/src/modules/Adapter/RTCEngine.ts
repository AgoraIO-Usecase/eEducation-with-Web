/**
 * RTCEngine for e-Education based on Agora Web SDK 2.5.1 which
 * provide methods for holding a class without concentration
 * on original SDK.
 */

import AgoraRTC from "agora-rtc-sdk";
import merge from "lodash.merge";

import {
  ClientRole,
  VideoProfiles,
  Mode,
  Codec,
  RTCEngineConfig
} from "./types";
import { createLogger, enhanceClient, enhanceStream } from "../../utils";

const rtcEngineLog = createLogger("[RTCEngine]", "#fff", "#13c2c2", true);

class RTCEngine {
  private appId: string;
  public config: RTCEngineConfig;
  public AgoraRTC: any;
  public localClient: any;
  public localStream: any;
  public shareClient: any;
  public shareStream: any;

  public constructor(appId: string) {
    this.AgoraRTC = AgoraRTC;
    this.appId = appId;
    this.config = {
      channel: "",
      shareId: 2,
      mode: Mode.LIVE,
      codec: Codec.VP8,
      role: ClientRole.STUDENT,
      streamId: -1
    };
  }

  public initialize = async (config: RTCEngineConfig) => {
    this.config = merge(this.config, config);
    rtcEngineLog(
      `RTCEngine initialized with config ${JSON.stringify(this.config)}`
    );

    this.localClient = await this.createClient({
      mode: this.config.mode,
      codec: this.config.codec
    });

    this.shareClient = await this.createClient({
      mode: this.config.mode,
      codec: this.config.codec
    });
  };

  public async createClient(config: { mode?: Mode; codec?: Codec }) {
    const { mode, codec } = config;
    const client = enhanceClient(
      AgoraRTC.createClient({
        mode: mode || Mode.LIVE,
        codec: codec || Codec.VP8
      })
    );
    await client.init(this.appId);
    return client;
  }

  public async createStream(config: {
    streamID?: number;
    video: boolean;
    audio: boolean;
    screen?: boolean;
    cameraId?: string;
    microphoneId?: string;
    videoProfile?: string;
    [prop: string]: any;
  }) {
    const stream = enhanceStream(AgoraRTC.createStream(config));
    if (config.videoProfile) {
      stream.setVideoProfile(config.videoProfile);
    }
    await stream.init();
    return stream;
  }

  public join = async (
    token?: string | null,
    constraints?: {
      cameraId: string;
      microphoneId: string;
      videoProfile: VideoProfiles;
    }
  ) => {
    const { cameraId = "", microphoneId = "", videoProfile = "480p_2" } =
      constraints || {};
    // get related state
    const { channel, streamId, role } = this.config;

    const isAudience = role === ClientRole.AUDIENCE;

    const video = !isAudience;
    const audio = !isAudience;

    // init client
    const ClientJoinPromise = async () => {
      await this.localClient.join(token, channel, streamId);
    };
    // init stream
    const StreamInitPromise = async () => {
      this.localStream = await this.createStream({
        streamID: streamId,
        video,
        audio,
        cameraId,
        microphoneId,
        videoProfile
      });
    };

    if (!isAudience) {
      await Promise.all([ClientJoinPromise(), StreamInitPromise()]);
      await this.localClient.publish(this.localStream);
    } else {
      await ClientJoinPromise();
    }
  };

  public leave = async () => {
    try {
      const isAudience = this.config.role === ClientRole.AUDIENCE;
      if (!isAudience && this.localStream) {
        this.localStream.close();
        await this.localClient.unpublish(this.localStream);
        await this.stopScreenShare();
        await this.localClient.leave();
      }
    } catch (err) {
      rtcEngineLog("Error when try to leave class", err);
    } finally {
      this.localStream = null;
    }
  };

  public startScreenShare = async (token?: string | null) => {
    const { channel, shareId } = this.config;

    const ShareClientInitPromise = async () => {
      await this.shareClient.join(token, channel, shareId);
    };

    const ShareStreamInitPromise = async () => {
      this.shareStream = await this.createStream({
        streamID: shareId,
        video: false,
        audio: false,
        screen: true,
        extensionId: "minllpmhdgpndnkomcoccfekfegnlikg",
        mediaSource: "window"
      });
    };

    await Promise.all([ShareClientInitPromise(), ShareStreamInitPromise()]);
    this.shareStream.on("stopScreenSharing", this.stopScreenShare);
    await this.shareClient.publish(this.shareStream);
    return this.shareStream;
  };

  public stopScreenShare = async () => {
    if (!this.shareStream) {
      return;
    }
    try {
      this.shareStream.close();
      await this.shareClient.unpublish(this.shareStream);
      await this.shareClient.leave();
    } catch (err) {
      rtcEngineLog("Error when try to stop screen share", err);
    } finally {
      this.shareStream = null;
    }
  };
}

export default RTCEngine;
