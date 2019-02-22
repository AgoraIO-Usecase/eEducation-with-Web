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
const RECORDING_SERVICE = 'http://123.155.153.85:3233';

const RECORDING = Symbol('recording'); // doing recording
const PENDING = Symbol('pending'); // posting request for start/stop
const IDLE = Symbol('idle'); // recording service is in idle

class RecordingAPIClass {
  constructor() {
    this.status = IDLE;
  }

  public status: typeof RECORDING | typeof PENDING | typeof IDLE;

  public start(appId: string, channel: string, token?: string): Promise<any> {
    this.status = PENDING;
    return axios
      .post(`${RECORDING_SERVICE}/v1/recording/start`, {
        appid: appId,
        channel: channel,
        key: token
      })
      .then(() => {
        this.status = RECORDING;
      })
      .catch(() => {
        this.status = IDLE;
      });
  }

  public stop(appId: string, channel: string, token?: string): Promise<any> {
    return axios
      .post(`${RECORDING_SERVICE}/v1/recording/stop`, {
        appid: appId,
        channel: channel,
        key: token
      })
      .then(() => {
        this.status = IDLE;
      })
      .catch(() => {
        this.status = IDLE;
      });
  }
}

const RecordingAPI = new RecordingAPIClass();

export default RecordingAPI;
