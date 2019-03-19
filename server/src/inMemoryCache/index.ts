import createRedisClient, {RedisAsyncClient} from "./redis";

const hashUser = (uid: string) => {
  return `u-${uid}`;
};

const hashChannel = (channel: string) => {
  return `c-${channel}`;
};

const hashChannelMembers = (channel: string) => {
  return `cm-${channel}`;
};

export default class ChannelCache {
  private redisClient: RedisAsyncClient
  private channelsHash: string;
  // private usersHash: string;
  // private gcInterval: number;
  // private cleanupSchedule?: NodeJS.Timeout;
  constructor(namespace: string) {
    this.redisClient = createRedisClient({
      prefix: namespace
    })
    this.channelsHash = `channels`;
    // this.usersHash = `${this.namespace}-users`;
    // this.gcInterval = gcInterval;
  }

  // User/Channel List
  // addUser = async (uid: string) => {
  //   return await this.redisClient.saddAsync(this.usersHash, uid);
  // };

  // removeUser = async (uid: string) => {
  //   return await this.redisClient.sremAsync(this.usersHash, uid);
  // };

  // includeUser = async (uid: string) => {
  //   return await this.redisClient.sismemberAsync(this.usersHash, uid);
  // };

  addChannel = async (channel: string) => {
    return await this.redisClient.saddAsync(this.channelsHash, channel);
  };

  removeChannel = async (channel: string) => {
    return await this.redisClient.sremAsync(this.channelsHash, channel);
  };

  getChannels = async (): Promise<string[]> => {
    return await this.redisClient.smembersAsync(this.channelsHash);
  };

  // ---------------- Garbage Collector ----------------
  // initCleanupSchedule = () => {
  //   this.cleanupSchedule = setInterval(async () => {
  //     const now = new Date().getTime();
  //     const channels: string[] = await this.redisClient.smembersAsync(this.channelsHash);
  //     for (const channel of channels) { 
  //       const getLtnPromise = this.getChannelAttr(channel, ['lastmodified']);
  //       const getMembersPromise = this.getChannelMembers(channel);
  //       Promise.all([getLtnPromise, getMembersPromise])
  //         .then(([ltn, members]) => {
  //           if ((now - ltn > 1.5*this.gcInterval) && members.length) {
            
  //           }
  //         })
  //     }
  //   }, this.gcInterval);
  // };

  // ---------------- User Attr Operation ----------------

  getUserAttr = async (uid: string, keys: string[]) => {
    this.flushUser(uid);
    return await this.redisClient.hmgetAsync(hashUser(uid), keys);
  };

  getAllUserAttr = async (uid: string) => {
    this.flushUser(uid);
    return await this.redisClient.hgetallAsync(hashUser(uid));
  };

  setUserAttr = async (
    uid: string,
    kvs: Partial<RoomControl.UserAttr>
  ) => {
    this.flushUser(uid);
    return await this.redisClient.hmsetAsync(hashUser(uid), kvs);
  };

  clearUserAttr = async (uid: string) => {
    this.flushUser(uid);
    return await this.redisClient.hdelAsync(hashUser(uid));
  };

  private flushUser = (uid: string) => {
    this.setUserAttr(uid, {
      lastmodified: new Date().getTime()
    });
  };

  // ---------------- Channel Attr Operation ----------------

  getChannelAttr = async (channel: string, keys: string[]): Promise<RoomControl.ChannelAttr> => {
    this.flushChannel(channel);
    return await this.redisClient.hmgetAsync(hashChannel(channel), keys);
  };

  getAllChannelAttr = async (channel: string): Promise<RoomControl.ChannelAttr> => {
    this.flushChannel(channel);
    return await this.redisClient.hgetallAsync(hashChannel(channel));
  };

  setChannelAttr = async (
    channel: string,
    kvs: Partial<RoomControl.ChannelAttr>
  ) => {
    this.flushChannel(channel);
    return await this.redisClient.hmsetAsync(hashChannel(channel), kvs);
  };

  clearChannelAttr = async (channel: string) => {
    this.flushChannel(channel);
    await this.redisClient.hdelAsync(hashChannel(channel));
    await this.redisClient.hdelAsync(hashChannelMembers(channel));
  };

  addChannelMember = async (channel: string, uid: string | string[]) => {
    this.flushChannel(channel);
    if (uid instanceof Array) {
      const uids = uid.map(item => hashUser(item));
      return await this.redisClient.sadd(
        hashChannelMembers(channel),
        uids
      );
    } else {
      return await this.redisClient.saddAsync(
        hashChannelMembers(channel),
        hashUser(uid)
      );
    }
  };

  getChannelMembers = async (channel: string): Promise<string[]> => {
    this.flushChannel(channel);
    return await this.redisClient.smembersAsync(channel);
  }

  removeChannelMember = async (channel: string, uid: string) => {
    this.flushChannel(channel);
    return await this.redisClient.sremAsync(
      hashChannelMembers(channel),
      hashUser(uid)
    );
  };

  private flushChannel = (channel: string) => {
    this.setChannelAttr(channel, {
      lastmodified: new Date().getTime()
    });
  };
};