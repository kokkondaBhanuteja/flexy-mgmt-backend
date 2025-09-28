import { transports, format } from 'winston';
import 'winston-daily-rotate-file';

export const winstonConfig = {
  transports: [
    // Console transport for development
    new transports.Console({
      format: format.combine(
        format.timestamp(),
        format.ms(),
        format.colorize({ all: true }),
        format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`,
        ),
      ),
    }),
    
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
  ],
};