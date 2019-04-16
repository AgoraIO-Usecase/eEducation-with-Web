import { WhiteWebSdk, Room } from 'white-web-sdk';
import axios from 'axios';
import EventEmitter from 'wolfy87-eventemitter';

/**
 * ==== WARNING ====
 * This is only used for demo!!!
 * DO NOT USE IT IN PRODUCTION ENVIRONMENT!!!
 */
const WHITEBOARD_URL = 'https://webdemo.agora.io/edu_whiteboard';
const Ajax = axios.create({
  baseURL: WHITEBOARD_URL
});

class White extends EventEmitter {
  constructor() {
    super();
    this.sdk = new WhiteWebSdk();
    this.room = undefined;
    this.roomToken = undefined;
    this.uuid = '';
    this.readyState = false;
  }

  public sdk: WhiteWebSdk;
  public room?: Room;
  public roomToken?: string;
  public uuid: string;
  public readyState: boolean;

  initialize(
    channel: string,
    options?: {
      limit?: number;
      uuid: string;
    }
  ) {
    return new Promise((resolve, reject) => {
      const opts: {[prop: string]: any} = options || {}
      const { uuid } = opts;
      if (!uuid) {
        Ajax.post('/v1/room', {
          name: channel,
          limit: opts.limit || 100
        })
          .then(response => {
            const { data } = response;
            const { code, msg } = data;
            if (code === 200) {
              this.roomToken = msg.roomToken;
              return resolve(msg);
            }
            throw new Error(msg);
          })
          .catch(e => {
            reject(e);
          });
      } else {
        Ajax.post('/v1/room/join', {
          uuid
        })
          .then(response => {
            const { data } = response;
            const { code, msg } = data;
            if (code === 200) {
              this.room = msg.room;
              this.roomToken = msg.roomToken;
              return resolve(msg);
            }
            throw new Error(msg);
          })
          .catch(e => {
            reject(e);
          });
      }
    });
  }

  join(uuid: string, token: string) {
    return new Promise((resolve, reject) => {
      console.log('join in... [uuid: %s, token: %s]', uuid, token);
      this.sdk
        .joinRoom(
          {
            uuid,
            roomToken: token
          },
          {
            onRoomStateChanged: modifyState => {
              this.emit('roomStateChanged', modifyState);
            }
          }
        )
        .then(room => {
          this.room = room;
          this.readyState = true;
          this.emit('whiteStateChanged', this);
          return resolve();
        })
        .catch(e => {
          return reject(e);
        });
    });
  }
}

const WhiteboardAPI = new White();

export default WhiteboardAPI;
