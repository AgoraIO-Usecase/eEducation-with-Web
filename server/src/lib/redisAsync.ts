import redis from 'redis'
import { promisifyAll } from 'bluebird';

export interface RedisAsyncClient extends redis.RedisClient {
  [props: string]: any
};

const redisAsync = promisifyAll(redis);

const createclient = (clientOpts?: redis.ClientOpts): RedisAsyncClient => {
  return redisAsync.createClient(clientOpts);
};

export default createclient;