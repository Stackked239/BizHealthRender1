/**
 * Centralized logging configuration using Pino
 */

import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

/**
 * Main application logger
 */
export const logger = pino({
  level: logLevel,
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Create child logger for specific module
 */
export function createLogger(module: string) {
  return logger.child({ module });
}

/**
 * Log levels:
 * - trace: Very detailed, typically not enabled in production
 * - debug: Debugging information
 * - info: Informational messages
 * - warn: Warning messages
 * - error: Error messages
 * - fatal: Fatal errors that require immediate attention
 */

export default logger;
