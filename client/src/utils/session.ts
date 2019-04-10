import { sessionStorage } from './storage';

const save = (key: string, data: {[prop: string]: any}) => {
  return sessionStorage.save(key, JSON.stringify(data));
}

const load = (key: string) => {
  const rstString = sessionStorage.read(key);

  if (!rstString) {
    return undefined
  }

  try {
    const rst = JSON.parse(rstString);
    return rst;
  } catch(err) {
    return undefined
  }
}

const clear = (key: string) => {
  return sessionStorage.clear(key);
}

export default {
  save, load, clear
}

