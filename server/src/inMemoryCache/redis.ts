import redis from 'redis'
import { promisifyAll } from 'bluebird';

export interface RedisAsyncClient extends redis.RedisClient {
  [props: string]: any
};

const redisAsync = promisifyAll(redis);

const createclient = (options?: redis.ClientOpts): RedisAsyncClient => {
  return redisAsync.createClient(options)
};

export default createclient;
