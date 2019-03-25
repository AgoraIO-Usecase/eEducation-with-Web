const _log = (prefix: string, color: string, bgColor: string, args: any[]) => {
  return console.log(`%c${prefix}`, `color: ${color}; background: ${bgColor}`, ...args);
};

const createLogger = (prefix: string, color: string, bgColor: string, devOnly = false) => {
  return (...args: any[]) => {
    if(devOnly && process.env.NODE_ENV === 'development') {
      _log(prefix, color, bgColor, args);
    }
  };
};

export const hooksLog = createLogger("[Hooks]", "#fff", "#1890ff", true)
export const adapterLog = createLogger("[Adapter]", "#fff", "#13c2c2", true)
export default createLogger;
