import path from 'path';
import winston from 'winston';

import { ensureWritableDir } from './pathUtils.js';

const logDir = ensureWritableDir({ envVar: 'LOG_DIR', defaultSubdir: 'logs' });

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => `${timestamp} [${level}] ${message}`)
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'app.log') })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}
