import config from '../../config/index.js';

const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  if (config.env === 'production') {
    return JSON.stringify({
      timestamp,
      level,
      message,
      service: config.appName,
      ...meta,
    });
  }
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

export const logger = {
  info: (message, meta) => {
    console.log(formatLog('info', message, meta));
  },
  warn: (message, meta) => {
    console.warn(formatLog('warn', message, meta));
  },
  error: (message, meta) => {
    console.error(formatLog('error', message, meta));
  },
  debug: (message, meta) => {
    if (config.env === 'development' || process.env.DEBUG) {
      console.log(formatLog('debug', message, meta));
    }
  },
};

export default logger;
