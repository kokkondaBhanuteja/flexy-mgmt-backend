import { transports, format } from 'winston';
import 'winston-daily-rotate-file';

const isProduction = process.env.NODE_ENV === 'production';

// Common console transport for both environments
const consoleTransport = new transports.Console({
  format: format.combine(
    format.timestamp(),
    format.ms(),
    format.colorize({ all: true }),
    format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
  ),
});

// Create the config object conditionally
export const winstonConfig = {
  transports: isProduction
    ? [consoleTransport] // In production, ONLY use the console
    : [
        // In development, use console AND file transports
        consoleTransport,
        new transports.DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: format.combine(format.timestamp(), format.json()),
        }),
        new transports.DailyRotateFile({
          level: 'error',
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          format: format.combine(format.timestamp(), format.json()),
        }),
      ],
};