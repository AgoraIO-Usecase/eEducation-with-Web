import createRedisClient, { RedisAsyncClient } from "./redis";

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
  private redisClient: RedisAsyncClient;
  private channelsHash: string;
  // private usersHash: string;
  // private gcInterval: number;
  // private cleanupSchedule?: NodeJS.Timeout;
  constructor() {
    this.redisClient = createRedisClient();
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
    return await this.redisClient.hmgetAsync(hashUser(uid), ...keys);
  };

  getAllUserAttr = async (uid: string) => {
    return await this.redisClient.hgetallAsync(hashUser(uid));
  };

  setUserAttr = async (uid: string, kvs: Partial<RoomControl.UserAttr>) => {
    return await this.redisClient.hmsetAsync(hashUser(uid), kvs);
  };

  clearUserAttr = async (uid: string) => {
    return await this.redisClient.delAsync(hashUser(uid));
  };

  // private flushUser = (uid: string) => {
  //   this.setUserAttr(uid, {
  //     lastmodified: new Date().getTime()
  //   });
  // };

  // ---------------- Channel Attr Operation ----------------

  getChannelAttr = async (
    channel: string,
    keys: string[]
  ): Promise<RoomControl.ChannelAttr> => {
    return await this.redisClient.hmgetAsync(hashChannel(channel), ...keys);
  };

  getAllChannelAttr = async (
    channel: string
  ): Promise<RoomControl.ChannelAttr> => {
    return await this.redisClient.hgetallAsync(hashChannel(channel));
  };

  setChannelAttr = async (
    channel: string,
    kvs: Partial<RoomControl.ChannelAttr>
  ) => {
    return await this.redisClient.hmsetAsync(hashChannel(channel), kvs);
  };

  clearChannelAttr = async (channel: string) => {
    await this.redisClient.delAsync(hashChannel(channel));
    await this.redisClient.delAsync(hashChannelMembers(channel));
  };

  addChannelMember = async (channel: string, uid: string | string[]) => {
    if (Array.isArray(uid)) {
      return await this.redisClient.saddAsync(
        hashChannelMembers(channel),
        ...uid
      );
    } else {
      return await this.redisClient.saddAsync(
        hashChannelMembers(channel),
        uid
      );
    }

  };

  getChannelMembers = async (channel: string): Promise<string[]> => {
    return await this.redisClient.smembersAsync(hashChannelMembers(channel));
  };

  removeChannelMember = async (channel: string, uid: string) => {
    return await this.redisClient.sremAsync(
      hashChannelMembers(channel),
      uid
    );
  };

  // private flushChannel = (channel: string) => {
  //   this.setChannelAttr(channel, {
  //     lastmodified: new Date().getTime()
  //   });
  // };
}
