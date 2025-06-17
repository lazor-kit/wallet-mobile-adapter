/**
 * Enhanced logging utility for LazorKit wallet operations
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LoggerConfig {
  level: LogLevel;
  prefix: string;
  enableTimestamp: boolean;
}

class Logger {
  private config: LoggerConfig = {
    level: LogLevel.INFO,
    prefix: '[LazorKit]',
    enableTimestamp: true,
  };

  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, error?: unknown, ...args: any[]): void {
    if (error) {
      this.log(LogLevel.ERROR, message, error, ...args);
    } else {
      this.log(LogLevel.ERROR, message, ...args);
    }
  }

  log(level: LogLevel, message: string, ...args: any[]): void {
    if (level < this.config.level) {
      return;
    }

    const timestamp = this.config.enableTimestamp 
      ? new Date().toISOString() 
      : '';
    
    const levelStr = LogLevel[level];
    const prefix = `${this.config.prefix}${timestamp ? ` ${timestamp}` : ''} [${levelStr}]`;
    const fullMessage = `${prefix} ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(fullMessage, ...args);
        break;
      case LogLevel.INFO:
        console.info(fullMessage, ...args);
        break;
      case LogLevel.WARN:
        console.warn(fullMessage, ...args);
        break;
      case LogLevel.ERROR:
        console.error(fullMessage, ...args);
        break;
    }
  }

  /**
   * Create a scoped logger with additional context
   */
  scope(context: string): Logger {
    const scopedLogger = new Logger();
    scopedLogger.configure({
      ...this.config,
      prefix: `${this.config.prefix}[${context}]`,
    });
    return scopedLogger;
  }
}

// Export singleton logger instance
export const logger = new Logger();

// Configure based on environment
if (process.env.NODE_ENV === 'development') {
  logger.configure({ level: LogLevel.DEBUG });
} else {
  logger.configure({ level: LogLevel.WARN });
} 