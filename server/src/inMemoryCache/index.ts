import redisClient from "./redis";

const hashUser = (uid: string) => {
  return `u-${uid}`;
};

const hashChannel = (channel: string) => {
  return `c-${channel}`;
};

const hashChannelMembers = (channel: string) => {
  return `cm-${channel}`;
};

class ChannelManager {
  private namespace: string;
  private channelsHash: string;
  private usersHash: string;
  private gcInterval: number;
  private cleanupSchedule?: NodeJS.Timeout;
  constructor(namespace: string, gcInterval = 10000) {
    this.namespace = namespace;
    this.channelsHash = `${this.namespace}-channels`;
    this.usersHash = `${this.namespace}-users`;
    this.gcInterval = gcInterval;
  }

  // User/Channel List
  addUser = async (uid: string) => {
    return await redisClient.saddAsync(this.usersHash, uid);
  };

  removeUser = async (uid: string) => {
    return await redisClient.sremAsync(this.usersHash, uid);
  };

  includeUser = async (uid: string) => {
    return await redisClient.sismemberAsync(this.usersHash, uid);
  };

  addChannel = async (channel: string) => {
    return await redisClient.saddAsync(this.channelsHash, channel);
  };

  removeChannel = async (channel: string) => {
    return await redisClient.sremAsync(this.channelsHash, channel);
  };

  includeChannel = async (channel: string) => {
    return await redisClient.sismemberAsync(this.channelsHash, channel);
  };

  // ---------------- Garbage Collector ----------------
  initCleanupSchedule = () => {
    this.cleanupSchedule = setInterval(async () => {
      const now = new Date().getTime();
      const channels: string[] = await redisClient.smembersAsync(this.channelsHash);
      for (const channel of channels) { 
        const getLtnPromise = this.getChannelAttr(channel, ['lastmodified']);
        const getMembersPromise = this.getChannelMembers(channel);
        Promise.all([getLtnPromise, getMembersPromise])
          .then(([ltn, members]) => {
            if ((now - ltn > 1.5*this.gcInterval) && members.length) {
            
            }
          })
      }
    }, this.gcInterval);
  };

  // ---------------- User Attr Operation ----------------

  getUserAttr = async (uid: string, keys: string[]) => {
    this.flushUser(uid);
    return await redisClient.hmgetAsync(hashUser(uid), keys);
  };

  getAllUserAttr = async (uid: string) => {
    this.flushUser(uid);
    return await redisClient.hgetallAsync(hashUser(uid));
  };

  setUserAttr = async (
    uid: string,
    kvs: { [key: string]: number | string }
  ) => {
    this.flushUser(uid);
    return await redisClient.hmsetAsync(hashUser(uid), kvs);
  };

  clearUserAttr = async (uid: string) => {
    this.flushUser(uid);
    return await redisClient.hdelAsync(hashUser(uid));
  };

  private flushUser = (uid: string) => {
    this.setUserAttr(uid, {
      lastmodified: new Date().getTime()
    });
  };

  // ---------------- Channel Attr Operation ----------------

  getChannelAttr = async (channel: string, keys: string[]) => {
    this.flushChannel(channel);
    return await redisClient.hmgetAsync(hashChannel(channel), keys);
  };

  getAllChannelAttr = async (channel: string) => {
    this.flushChannel(channel);
    return await redisClient.hgetallAsync(hashChannel(channel));
  };

  setChannelAttr = async (
    channel: string,
    kvs: { [key: string]: number | string }
  ) => {
    this.flushChannel(channel);
    return await redisClient.hmsetAsync(hashChannel(channel), kvs);
  };

  clearChannelAttr = async (channel: string) => {
    this.flushChannel(channel);
    await redisClient.hdelAsync(hashChannel(channel));
    await redisClient.hdelAsync(hashChannelMembers(channel));
  };

  addChannelMember = async (channel: string, uid: string) => {
    this.flushChannel(channel);
    return await redisClient.saddAsync(
      hashChannelMembers(channel),
      hashUser(uid)
    );
  };

  getChannelMembers = async (channel: string) => {
    this.flushChannel(channel);
    return await redisClient.smembersAsync(channel);
  }

  removeChannelMember = async (channel: string, uid: string) => {
    this.flushChannel(channel);
    return await redisClient.sremAsync(
      hashChannelMembers(channel),
      hashUser(uid)
    );
  };

  private flushChannel = (channel: string) => {
    this.setChannelAttr(channel, {
      lastmodified: new Date().getTime()
    });
  };
}
