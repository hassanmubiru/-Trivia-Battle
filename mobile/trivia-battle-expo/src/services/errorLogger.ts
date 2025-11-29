/**
 * Error Handler & Logger Service
 * Comprehensive error tracking and logging for wallet operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export enum ErrorSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface LogEntry {
  timestamp: number;
  level: ErrorSeverity;
  tag: string;
  message: string;
  data?: any;
  stack?: string;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  lastError: LogEntry | null;
  connectionFailures: number;
}

class ErrorLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 500;
  private enablePersistence: boolean = true;
  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByType: {},
    lastError: null,
    connectionFailures: 0,
  };

  constructor(enablePersistence: boolean = true) {
    this.enablePersistence = enablePersistence;
    this.loadLogsFromStorage();
  }

  /**
   * Log entry
   */
  log(tag: string, message: string, severity: ErrorSeverity = ErrorSeverity.INFO, data?: any): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level: severity,
      tag,
      message,
      data,
      stack: new Error().stack,
    };

    this.logs.push(entry);

    // Keep logs array size manageable
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Update metrics
    if (severity === ErrorSeverity.ERROR || severity === ErrorSeverity.CRITICAL) {
      this.metrics.totalErrors++;
      this.metrics.errorsByType[tag] = (this.metrics.errorsByType[tag] || 0) + 1;
      this.metrics.lastError = entry;

      if (tag.includes('Connection')) {
        this.metrics.connectionFailures++;
      }
    }

    // Log to console
    this.logToConsole(entry);

    // Persist to storage
    if (this.enablePersistence) {
      this.persistLog(entry);
    }
  }

  /**
   * Log info level
   */
  info(tag: string, message: string, data?: any): void {
    this.log(tag, message, ErrorSeverity.INFO, data);
  }

  /**
   * Log warning level
   */
  warn(tag: string, message: string, data?: any): void {
    this.log(tag, message, ErrorSeverity.WARNING, data);
  }

  /**
   * Log error level
   */
  error(tag: string, message: string, error?: any): void {
    const data = error instanceof Error ? { name: error.name, message: error.message } : error;
    this.log(tag, message, ErrorSeverity.ERROR, data);
  }

  /**
   * Log critical error
   */
  critical(tag: string, message: string, error?: any): void {
    const data = error instanceof Error ? { name: error.name, message: error.message } : error;
    this.log(tag, message, ErrorSeverity.CRITICAL, data);
  }

  /**
   * Log to console with color coding
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.level}] [${entry.tag}]`;

    switch (entry.level) {
      case ErrorSeverity.INFO:
        console.log(prefix, entry.message, entry.data || '');
        break;
      case ErrorSeverity.WARNING:
        console.warn(prefix, entry.message, entry.data || '');
        break;
      case ErrorSeverity.ERROR:
        console.error(prefix, entry.message, entry.data || '');
        break;
      case ErrorSeverity.CRITICAL:
        console.error(`🚨 ${prefix}`, entry.message, entry.data || '');
        break;
    }
  }

  /**
   * Persist log to AsyncStorage
   */
  private async persistLog(entry: LogEntry): Promise<void> {
    try {
      const key = `log_${Date.now()}_${Math.random()}`;
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to persist log:', error);
    }
  }

  /**
   * Load logs from storage
   */
  private async loadLogsFromStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const logKeys = keys.filter(k => k.startsWith('log_'));

      const recentLogs = logKeys.slice(-100); // Get last 100 logs
      const items = await AsyncStorage.multiGet(recentLogs);

      items.forEach(([, value]) => {
        if (value) {
          try {
            const entry = JSON.parse(value) as LogEntry;
            this.logs.push(entry);
          } catch (e) {
            console.warn('Failed to parse log entry:', e);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to load logs from storage:', error);
    }
  }

  /**
   * Get all logs
   */
  getLogs(filter?: { tag?: string; level?: ErrorSeverity }): LogEntry[] {
    return this.logs.filter(log => {
      if (filter?.tag && log.tag !== filter.tag) return false;
      if (filter?.level && log.level !== filter.level) return false;
      return true;
    });
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get error metrics
   */
  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear logs
   */
  async clearLogs(): Promise<void> {
    this.logs = [];
    this.metrics = {
      totalErrors: 0,
      errorsByType: {},
      lastError: null,
      connectionFailures: 0,
    };

    if (this.enablePersistence) {
      const keys = await AsyncStorage.getAllKeys();
      const logKeys = keys.filter(k => k.startsWith('log_'));
      await AsyncStorage.multiRemove(logKeys);
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        metrics: this.metrics,
        logs: this.logs,
      },
      null,
      2
    );
  }

  /**
   * Get error summary
   */
  getErrorSummary(): string {
    const total = this.metrics.totalErrors;
    const types = Object.entries(this.metrics.errorsByType)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');

    return `Total Errors: ${total}\nBy Type: ${types || 'None'}\nConnection Failures: ${this.metrics.connectionFailures}`;
  }
}

// Singleton instance
let loggerInstance: ErrorLogger | null = null;

export function getErrorLogger(enablePersistence: boolean = true): ErrorLogger {
  if (!loggerInstance) {
    loggerInstance = new ErrorLogger(enablePersistence);
  }
  return loggerInstance;
}

export default ErrorLogger;
