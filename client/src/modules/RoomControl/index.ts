/**
 * Provide actions and method to send actions
 * ```
 * request(JOIN(123, 2, 'TeacherA'))
 *
 * ```
 */
import axios from "axios";

import createLogger from '../../utils/logger';

const ROOM_CONTROL_SERVICE = "http://localhost:8080";
const rtmLog = createLogger('[RTM]', '#FFF', '#eb2f96',true)

export default class RoomControlClient {
  private appId: string;
  private client: any;
  private channel: any;
  private sentryId: string;

  constructor(appId: string) {
    this.appId = appId;
    // @ts-ignore
    this.client = window.AgoraRTM.createInstance(appId);
    // @ts-ignore
    this.channel = {};
    this.sentryId = "";
  }

  public async init(uid: string, channel: string) {
    await this.client.login({
      uid
    });
    this.channel = this.client.createChannel(channel);
    await this.channel.join();
    const {data} = await axios.get(`${ROOM_CONTROL_SERVICE}/`);
    rtmLog(`Get response from sentry ${data}`)
    this.sentryId = data;
  }

  public request(commandStr: string) {
    if (this.sentryId) {
      rtmLog(`Send request ${commandStr} to sentry ${this.sentryId}`)
      this.client.sendMessageToPeer({text: commandStr}, this.sentryId);
    }
  }

  public onResponse(callback: (responseStr: string) => void) {
    this.client.on("MessageFromPeer", (message: {
      text: string,
      [props: string]: any
    }, peerId: string) => {
      if (peerId === this.sentryId) {
        callback(message.text);
      }
    });
  }

  public join(
    channel: string,
    userAttr: RoomControl.UserAttr,
    channelAttr?: RoomControl.ChannelAttr
  ) {
    this.request(JSON.stringify({
      name: 'Join',
      args: {
        channel, userAttr, channelAttr
      }
    }))
  }
}
