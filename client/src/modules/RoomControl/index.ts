import axios from "axios";
import EventEmitter from 'wolfy87-eventemitter';

import createLogger from '../../utils/logger';

const ROOM_CONTROL_SERVICE = "http://localhost:8080";
const rtmLog = createLogger('[RTM]', '#FFF', '#eb2f96',true)
const reponseArray = [
  'JoinSuccess', 'JoinFailure', 'MemberLeft', 'MemberJoined',
  'ChannelMessage', 'Muted', 'Unmuted', 'Ringing', 'CustomRequest',
  'UserAttrUpdated', 'ChannelAttrUpdated', 'Error'
]


export default class RoomControlClient extends EventEmitter{
  private appId: string;
  private client: any;
  private channel: any;
  private sentryId: string;
  private online: boolean;

  constructor(appId: string) {
    super();
    this.appId = appId;
    // @ts-ignore
    this.client = window.AgoraRTM.createInstance(appId);
    // @ts-ignore
    this.channel = {};
    this.sentryId = "";
    this.online = false;
  }

  public async init(uid: string, channel: string) {
    if (!this.online) {
      await this.client.login({
        uid
      });
      this.channel = this.client.createChannel(channel);
      await this.channel.join();
      this.online = true;
      const {data} = await axios.get(`${ROOM_CONTROL_SERVICE}/`);
      rtmLog(`Get response from sentry ${data}`)
      this.sentryId = data;
      this.client.on("MessageFromPeer", (message: {
        text: string,
      }, peerId: string) => {
        rtmLog('Got p2p message', message.text, peerId)
        if (peerId !== this.sentryId) {
          return;
        }
        try {
          const response = JSON.parse(message.text)
          const {name, args} = response;
          if (reponseArray.includes(name)) {
            this.emit(name, args);
          }
        } catch(err) {
          rtmLog('Invalid format for response', err)
        }
      });
    }
  }

  public request(commandStr: string) {
    if (this.sentryId) {
      rtmLog(`Send request ${commandStr} to sentry ${this.sentryId}`)
      this.client.sendMessageToPeer({text: commandStr}, this.sentryId);
    }
  }

  public join(
    channel: string,
    userAttr: RoomControl.UserAttr,
    channelAttr?: RoomControl.ChannelAttr,
    timeout = 15000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.request(JSON.stringify({
        name: 'Join',
        args: {
          channel, userAttr, channelAttr
        }
      }))
      this.once('JoinSuccess', (args: any) => {
        resolve(args);
      })
      this.once('JoinFailure', (args: any) => {
        reject(args);
      })
      setTimeout(() => {
        reject(new Error('Timeout for join request'))
      }, timeout)
    })
  }
}
