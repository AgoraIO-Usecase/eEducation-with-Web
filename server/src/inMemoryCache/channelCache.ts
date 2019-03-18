import cacheClient from './redis';

export default class Channel {
  uid: string;
  hash: string;
  memberHash: string;
  constructor(uid: string) {
    this.uid = uid;
    this.hash = `c-${uid}`;
    this.memberHash = `cm-${uid}`
  }

  public async getAttr(keys: string[]) {
    return await cacheClient.hmgetAsync(this.hash, keys);
  }

  public async getAllAttr() {
    return await cacheClient.hgetallAsync(this.hash);
  }

  public async setAttr(kvs: {[key: string]: string|number}) {
    return await cacheClient.hmsetAsync(this.hash, kvs);
  }

  public async addMember(userHash: string) {
    return await cacheClient.lpushAsync(userHash);
  }

  public async removeMember(userHash: string) {
    return await cacheClient.lremAsync(this.memberHash, 1, userHash);
  }

  public async clear() {
    await cacheClient.hdelAsync(this.hash);
    await cacheClient.hdelAsync(this.memberHash);
  }
}