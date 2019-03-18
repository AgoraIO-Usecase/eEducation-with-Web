/**
 * User usually has these attr: role, streamId, name
 */

import redisClient from './redis';

export default class User {
  uid: string;
  hash: string;
  constructor(uid: string) {
    this.uid = uid;
    this.hash = `u-${uid}`;
  }

  public async getAttr(keys: string[]) {
    return await redisClient.hmgetAsync(this.hash, keys);
  }

  public async getAllAttr() {
    return await redisClient.hgetallAsync(this.hash);
  }

  public async setAttr(kvs: {[key: string]: number|string}) {
    return await redisClient.hmsetAsync(this.hash, kvs);
  }

  public async clear() {
    await redisClient.hdelAsync(this.hash);
  }
}