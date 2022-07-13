import process from "process";
import fs from "fs";
import path from "path";
import PoChecker from "../lib/checks/po/po";
import Log from "../lib/log";
import ConsoleTableLogFormatter from "../lib/logFormatters/console-table";
import GitHubWorkflowFormatter from "../lib/logFormatters/github-workflow";
import ServiceResourceChecker from "../lib/checks/services/index";
import { time, timeEnd } from "console";
import parseJavaProjects from "../lib/parsers/java/index";
import { Context } from "../lib/models/context";
import Formatter from "../lib/logFormatters/formatter";

function getConfiguration(baseDir: string, configPath: string) {
  const fileContent = fs.readFileSync(configPath).toString("utf-8");
  const config = JSON.parse(fileContent);
  config.baseDir = baseDir;
  return config; 
}

function showUsage() {
  console.info("MicroEJ Checker");
  console.info(`Usage: ${process.argv[0]} ${process.argv[1]} project_directory [config_file]`);
}

function getFormatter(context: Context): Formatter {
  // If running under GitHub Actions, use the corresponding format.
  if (process.env["GITHUB_RUN_ID"]) {
    return new GitHubWorkflowFormatter(context);
  }

  // Otherwise, use the more friendlier console version.
  return new ConsoleTableLogFormatter(context);
}

function readConfig(projectDir: string) {
  let configPath = ".microej_check";

  if (process.argv.length == 4) {
    configPath = process.argv[3];
  }

  configPath = path.resolve(projectDir, configPath);
  console.log(`Using configuration file: ${configPath}`);

  // Try reading the configuration file.  
  try {
    return getConfiguration(projectDir, configPath);
  } catch (e) {
    console.error(`Unable to load configuration file.`);
    if (e instanceof Error) {
      console.info(e.message);
    }
    return;
  }
}

function main() {
  // Check command line arguments.
  if (process.argv.length < 3 || process.argv.length > 4) {
    showUsage();
    return;
  }

  // Determine configuration file path.
  const config = readConfig(process.argv[2]);

  // Process the project structure.
  const baseDir = config.baseDir;
  const projectStructure = parseJavaProjects(baseDir);

  // Start the checkers.
  const log = new Log();
  const context: Context = {
    projectStructure,
    baseDir,
    log
  };

  const checks = [
    new ServiceResourceChecker(context, config.serviceCheck),
    new PoChecker(context, config.poCheck)
  ];

  for (const check of checks) {
    const name = `[${check.getName()}]`;

    time(name);
    check.startCheck();
    timeEnd(name);
  }

  // Format and display the output.
  const formatter = getFormatter(context);
  formatter.format(log);
  formatter.beforeExit();
}

main();