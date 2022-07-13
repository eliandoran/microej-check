import { table } from "table";
import path from "path";
import { Context } from "../models/context";
import Log, { LogLevel, LogMessage } from "../log";
import Formatter from "./formatter";

interface GroupedLogData {
  level: LogLevel;
  message: string;
  files: string[]
}

export default class ConsoleTableLogFormatter implements Formatter {

  private context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  format(log: Log) {
    const data: string[][] = [];
    data.push([
      "#",
      "Level",
      "Message",
      "Source"
    ]);

    let index = 1;
    const groupedLogs = this._groupData(log);
    for (const entry of groupedLogs) {
      index++;
      data.push([
        index.toString(),
        formatLogLevel(entry.level),
        entry.message,
        entry.files.join("\n")
      ]);
    }

    const output = table(data);
  }

  beforeExit() {
    // No action needed.
  }

  _groupData(log: Log): GroupedLogData[] {
    const groupedData = new Map<string, GroupedLogData>();
    for (const entry of log.allMessages) {
      const { level, message } = entry;      
      const file = this._formatFileNameWithLine(entry);

      if (!groupedData.has(message)) {
        groupedData.set(message, {
          level,
          message,
          files: [ file ]
        });
      } else {        
        const messageData = groupedData.get(message);
        messageData.files.push(file);

        // Remove possible duplicates.
        if (messageData.files.length > 1) {
          messageData.files = Array.from(new Set(messageData.files));
        }
      }
    }

    return Object.values(groupedData);
  }

  _formatFileNameWithLine(logEntry: LogMessage) {
    const baseDir = this.context.baseDir;

    if (!logEntry.data.file) {
      return "";
    }

    const relPath = path.relative(baseDir, logEntry.data.file);
  
    if (logEntry.data.line) {
      return `${relPath}:${logEntry.data.line}`; 
    } else {
      return `${relPath}`;
    }
  }

}

function formatLogLevel(level: LogLevel): string {
  switch (level) {
    case LogLevel.ERROR:
      return "ERR"
    case LogLevel.INFO:
      return "INFO"
    case LogLevel.WARNING:
      return "WARN";
    default:
      return level;
  }
}