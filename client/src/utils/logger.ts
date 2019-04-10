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

export default createLogger;
