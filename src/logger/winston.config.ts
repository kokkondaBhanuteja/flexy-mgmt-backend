import { transports, format } from 'winston';
import 'winston-daily-rotate-file';

// Create a base console transport.
const consoleTransport = new transports.Console({
  format: format.combine(
    format.timestamp(),
    format.ms(),
    format.colorize({ all: true }),
    format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
  ),
});

// Define transports based on the environment.
const fileTransports = [
  // File transport for all logs (rotated daily)
  new transports.DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: format.combine(format.timestamp(), format.json()),
  }),
  // File transport for error logs (rotated daily)
  new transports.DailyRotateFile({
    level: 'error',
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: format.combine(format.timestamp(), format.json()),
  }),
];

export const winstonConfig = {
  transports: process.env.NODE_ENV !== 'production' 
    ? [consoleTransport, ...fileTransports] 
    : [consoleTransport],
};