export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void; 
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

class ConsoleLogger implements Logger {
  private minLevel: LogLevel;

  constructor(minLevel: LogLevel = LogLevel.DEBUG) {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level}: ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }
}

// Determine log level based on environment
const getLogLevel = (): LogLevel => {
  // For now, always use DEBUG level. 
  // TODO: In future, implement environment-based log level detection
  // that works with both Vite and Jest environments
  return LogLevel.DEBUG;
};

// Create and export the default logger instance
export const logger: Logger = new ConsoleLogger(getLogLevel());

// Export the class for testing purposes
export { ConsoleLogger };