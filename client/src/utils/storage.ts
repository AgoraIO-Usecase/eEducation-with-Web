class StorageManager {
  storage: Storage
  constructor(type = 'localStorage') {
    if (type === 'localStorage') {
      this.storage = window.localStorage;
    } else if (type === 'sessionStorage') {
      this.storage = window.sessionStorage;
    } else {
      throw new Error('Type can only be session/local storage');
    }
  }

  save(key: string, value: string) {
    this.storage.setItem(key, value);
  }

  saveMulti(datas: {[key: string]: string} | Array<{[key: string]: any}>) {
    if (datas instanceof Array) {
      for (const item of datas) {
        this.save(item.key, item.value);
      }
    } else {
      const keys = Object.keys(datas);
      for (const key of keys) {
        this.save(key, datas[key]);
      }
    }
  }

  read(key: string) {
    return this.storage.getItem(key);
  }

  readMulti(keys: string[]) {
    return keys.map(key => this.read(key));
  }

  clear(key: string, clearAll = false) {
    if (clearAll) {
      this.storage.clear();
    } else {
      this.storage.removeItem(key);
    }
  }

  clearMulti(keys: string[]) {
    for (const key of keys) {
      this.clear(key);
    }
  }
}

export const sessionStorage = new StorageManager('sessionStorage');
export const localStorage = new StorageManager('localStorage');