import redis from 'redis'
import { promisifyAll } from 'bluebird';

interface RedisAsyncClient extends redis.RedisClient {
  [props: string]: any
}

const redisAsync = promisifyAll(redis);

const client = redisAsync.createClient() as RedisAsyncClient;

export default client;
