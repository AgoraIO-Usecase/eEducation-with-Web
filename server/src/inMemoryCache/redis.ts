import redis from 'redis'
import { promisifyAll } from 'bluebird';

export interface RedisAsyncClient extends redis.RedisClient {
  [props: string]: any
};

const redisAsync = promisifyAll(redis);

const createclient = (): RedisAsyncClient => {
  return redisAsync.createClient({
    prefix: process.env.AGORA_APPID,
    url: process.env.REDIS_URL
  })
};

export default createclient;
