import winston from 'winston';
import { config } from '../config';

// Define custom log levels with colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

// Determine log level based on environment
const level = () => {
  const env = config.nodeEnv || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Safe JSON stringify that handles circular references
const safeStringify = (obj: any, indent?: number): string => {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      // Convert Error objects to plain objects with message and stack
      if (value instanceof Error) {
        return {
          message: value.message,
          stack: value.stack,
          name: value.name,
          ...(value as any), // Include any custom properties
        };
      }
      return value;
    },
    indent
  );
};

// Define format for development (colorful, human-readable)
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, service, ...meta } = info;
    const metaStr = Object.keys(meta).length ? `\n${safeStringify(meta, 2)}` : '';
    const serviceStr = service ? `[${service}]` : '';
    return `${timestamp} ${level} ${serviceStr}: ${message}${metaStr}`;
  })
);

// Define format for production (JSON, structured)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    return safeStringify(info);
  })
);

// Create the winston logger
const logger = winston.createLogger({
  level: level(),
  levels: logLevels,
  format: config.nodeEnv === 'production' ? productionFormat : developmentFormat,
  defaultMeta: { service: 'backend' },
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

// Create a child logger with specific context
export const createLogger = (context: string) => {
  return logger.child({ service: context });
};

// Export default logger
export default logger;

// Export typed logger interface
export interface Logger {
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  http(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}
