import path from "path";
import Log, { LogMessage, LogLevel } from "../log";
import { Context } from "../models/context";
import Formatter from "./formatter";

const LOG_LEVEL_MAPPINGS = new Map<LogLevel, string>();
LOG_LEVEL_MAPPINGS.set(LogLevel.ERROR, "error");
LOG_LEVEL_MAPPINGS.set(LogLevel.WARNING, "warning");
LOG_LEVEL_MAPPINGS.set(LogLevel.INFO, "notice");

export default class GitHubWorkflowFormatter implements Formatter {

  private context: Context;
  private numErrors: number;

  constructor(context: Context) {
    this.context = context;
    this.numErrors = 0;
  }

  format(log: Log) {
    this.numErrors = 0;

    for (const entry of log.allMessages) {
      const logLevel = LOG_LEVEL_MAPPINGS.get(entry.level) || LOG_LEVEL_MAPPINGS.get(LogLevel.INFO);
      const file = entry.data.file;
      
      const messageFile = this._formatFileNameWithLine(entry);
      let message = `${entry.message}\nFile: ${messageFile}`;
      message = message.replace(/\n/g, "%0A");  // Handle newlines in GitHub Actions  
      console.log(`::${logLevel} file=${file}::${message}`);

      if (logLevel === "error") {
        this.numErrors++;
      }
    }
  }

  _formatFileNameWithLine(logEntry: LogMessage): string {
    const baseDir = this.context.baseDir;
    const { file, line } = logEntry.data;

    if (!file) {
      return "";
    }

    const relPath = path.relative(baseDir, file);
  
    if (line) {
      return `${relPath}:${line}`; 
    } else {
      return `${relPath}`;
    }
  }

  beforeExit() {
    if (this.numErrors > 0) {
      process.exit(-this.numErrors);
    }
  }

}
