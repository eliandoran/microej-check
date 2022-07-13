export enum LogLevel {
  ERROR,
  WARNING,
  INFO
}

export interface LogData {
  file?: string;
  line?: string;
}

export interface LogMessage {
  level: LogLevel;
  message: string;
  data: LogData;  
}

export default class Log {

  private _log: LogMessage[];

  constructor() {
    this._log = [];
  }

  log(level: LogLevel, message: string, data: LogData) {
    this._log.push({
      level,
      message,
      data
    });
  }

  error(message: string, data: LogData) {
    this.log(LogLevel.ERROR, message, data);
  }

  warn(message: string, data: LogData) {
    this.log(LogLevel.WARNING, message, data);
  }

  get allMessages(): LogMessage[] {
    return Array.from(this._log);
  }

}