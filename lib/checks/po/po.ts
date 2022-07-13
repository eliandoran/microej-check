import glob from "fast-glob";
import path from "path";
import gettext from "gettext-parser";
import fs from "fs";
import checkForMissingTranslations from "./missing-translations";
import checkForStructuralIssues from "./raw";
import { Context } from "../../models/context";
import Log from "../../log";

export interface Message {
  msgstr: string;
  comments: string;
}

export interface PoFile {
  path: string;
  languageCode: string;
  messages: Map<string, Message>;
}

export default class PoChecker {

  private context: Context;
  private config: any;
  private log: Log;
  private poFiles: PoFile[];

  constructor(context: Context, config: any) {
    this.context = context;
    this.config = config;
    this.log = context.log;

    if (!context.log) {
      throw "Missing log in context.";
    }

    if (!config.filePattern) {
      throw "Missing configuration field: filePattern";
    }
  }

  getName() {
    return ".po checker";
  }

  startCheck() {
    this.poFiles = [];

    const baseDir = this.context.baseDir;
    const poFilePattern = path.join(baseDir, this.config.filePattern);
    const poFilePaths = glob.sync(poFilePattern);
    
    for (const poFilePath of poFilePaths) {
      const parsedPoFile = this.processSingleTranslationFile(poFilePath);
      if (parsedPoFile) {
        this.poFiles.push(parsedPoFile);
      }
    }

    checkForMissingTranslations({
      poFiles: this.poFiles,
      log: this.log,
      logLevel: this.config.missingTranslationLogLevel || "warning"
    });
  }

  processSingleTranslationFile(poPath: string) {
    const poFileContent = fs.readFileSync(poPath).toString("utf8");

    checkForStructuralIssues({
      poFilePath: poPath,
      poFileContents: poFileContent,
      log: this.log,
      logLevel: this.config.missingTranslationLogLevel || "warning"
    });

    try {
      const poFile = gettext.po.parse(poFileContent);
      const messages: Map<string, Message> = new Map();
      const rawMessages = poFile.translations[''];
      const languageCode = poFile.headers.Language;

      for (const msgid of Object.keys(rawMessages)) {
        const rawMessage = rawMessages[msgid];
        messages.set(msgid, {
          msgstr: rawMessage.msgstr[0],
          comments: rawMessage.comments?.translator
        });
      }

      return {
        path: poPath,
        messages,
        languageCode
      };
    } catch (e) {
      if (e instanceof SyntaxError) {
        // Syntax errors are an issue of the .po file, and not a runtime errors.
        // As such, they must be reported to the user via the log.
        this.log.error(e.message, {
          file: poPath
        });
        return;
      }

      throw e;
    }
  }

}