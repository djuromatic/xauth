import winston from 'winston';
import { serverConfig } from '../config/server-config.js';

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize } = format;

//Using the printf format.
const customFormat = printf(({ timestamp, level, message, label, error }) => {
  if (error) {
    return `${timestamp} [${label}] ${level}: ${message}`;
  }

  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = createLogger({
  level: serverConfig.logger.level,
  format: combine(
    colorize(),
    timestamp({
      format: 'MMM-DD-YYYY HH:mm:ss'
    }),
    customFormat
  ),
  transports: [new transports.Console()]
});

export class Logger {
  constructor(private readonly label: string) {}

  debug(message: string, payload?: object) {
    logger.debug(message, { label: this.label, payload });
  }
  info(message: string) {
    logger.info(message, { label: this.label });
  }
  warn(message: string) {
    logger.warn(message, { label: this.label });
  }

  error(err: Error) {
    logger.error(err.message, { label: this.label, error: err });
  }
}
