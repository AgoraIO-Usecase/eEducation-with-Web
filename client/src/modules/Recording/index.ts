/**
 * Recording API depending on Agora Recording SDK.
 * Sample code for this service can be found under `/Service_Recording`.
 *
 * By Hao Yang on Feb 2019
 */

import axios from 'axios';

/**
 * ==== WARNING ====
 * This is only used for demo!!!
 * DO NOT USE IT IN PRODUCTION ENVIRONMENT!!!
 */
const RECORDING_SERVICE = 'https://webdemo.agora.io/edu_recording';

export const STATUS_RECORDING = Symbol('recording'); // doing recording
export const STATUS_PENDING = Symbol('pending'); // posting request for start/stop
export const STATUS_IDLE = Symbol('idle'); // recording service is in idle

class RecordingAPIClass {
  constructor() {
    this.status = STATUS_IDLE;
  }

  public status:
    | typeof STATUS_RECORDING
    | typeof STATUS_PENDING
    | typeof STATUS_IDLE;

  public start(appId: string, channel: string, token?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.status = STATUS_PENDING;
      axios
        .post(`${RECORDING_SERVICE}/v1/recording/start`, {
          appid: appId,
          channel: channel,
          key: token
        })
        .then(() => {
          this.status = STATUS_RECORDING;
          resolve()
        })
        .catch((err) => {
          this.status = STATUS_IDLE;
          reject(err)
        });
    })

  }

  public stop(appId: string, channel: string, token?: string): Promise<any> {
    return axios
      .post(`${RECORDING_SERVICE}/v1/recording/stop`, {
        appid: appId,
        channel: channel,
        key: token
      })
      .then(() => {
        this.status = STATUS_IDLE;
      })
      .catch(() => {
        this.status = STATUS_IDLE;
      });
  }
}

const RecordingAPI = new RecordingAPIClass();

export default RecordingAPI;
