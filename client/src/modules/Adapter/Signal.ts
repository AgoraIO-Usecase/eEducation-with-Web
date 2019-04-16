import axios from "axios";
import EventEmitter from "wolfy87-eventemitter";
import { UserAttr, ChannelAttr, SignalConfig } from "./types";

import createLogger from "../../utils/logger";
// for demo only:wq
const ROOM_CONTROL_SERVICE = "https://webdemo.agora.io/edu_control";
const signalLog = createLogger("[Signal]", "#FFF", "#eb2f96", true);
const reponseArray = [
  "JoinSuccess",
  "JoinFailure",
  "MemberLeft",
  "MemberJoined",
  "ChannelMessage",
  "Muted",
  "Unmuted",
  "Ringing",
  "CustomRequest",
  "UserAttrUpdated",
  "ChannelAttrUpdated",
  "Error"
];

export default class Signal extends EventEmitter {
  private appId: string;
  private client: any;
  private channel: any;
  private sentryId: string;
  private online: boolean;

  constructor(appId: string) {
    super();
    this.appId = appId;
    // @ts-ignore
    this.client = window.AgoraRTM.createInstance(this.appId);
    this.sentryId = "";
    this.online = false;
  }

  public async initialize(config: SignalConfig) {
    const { channel, uid } = config;
    if (!this.online) {
      await this.client.login({
        uid: uid
      });
      this.channel = this.client.createChannel(channel);
      await this.channel.join();
      this.online = true;
      const { data } = await axios.get(`${ROOM_CONTROL_SERVICE}/sentry`);
      signalLog(`Get response from sentry ${data}`);
      this.sentryId = data;
      this.client.on(
        "MessageFromPeer",
        (
          message: {
            text: string;
          },
          peerId: string
        ) => {
          signalLog("Got p2p message", message.text, peerId);
          if (peerId !== this.sentryId) {
            return;
          }
          try {
            const response = JSON.parse(message.text);
            const { name, args } = response;
            if (reponseArray.includes(name)) {
              signalLog("Emit Signal Event", name, args)
              this.emit(name, args);
            }
          } catch (err) {
            signalLog("Invalid format for response", err);
          }
        }
      );
    }
  }

  public request(commandStr: string) {
    if (this.sentryId) {
      signalLog(`Send request ${commandStr} to sentry ${this.sentryId}`);
      this.client.sendMessageToPeer({ text: commandStr }, this.sentryId);
    }
  }

  public join(
    channel: string,
    userAttr: UserAttr,
    channelAttr?: Partial<ChannelAttr>,
    timeout = 15000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.request(
        JSON.stringify({
          name: "Join",
          args: {
            channel,
            userAttr,
            channelAttr
          }
        })
      );
      this.once("JoinSuccess", (args: any) => {
        resolve(args);
      });
      this.once("JoinFailure", (args: any) => {
        reject(args);
      });
      setTimeout(() => {
        reject(new Error("Timeout for join request"));
      }, timeout);
    });
  }

  public async release() {
    if (this.online) {
      try {
        await this.client.logout();
        this.removeAllListeners();
      } catch (err) {
        signalLog('Error when try to logout signal', err)
      } finally {
        this.online = false;
        // @ts-ignore
        this.client = window.AgoraRTM.createInstance(this.appId);
        this.channel = null;
      }
    }
  }
}
