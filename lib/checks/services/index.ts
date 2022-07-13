import glob from "fast-glob";
import { Context, ProjectStructure } from "../../models/context";
import checkUndeclaredServiceCalls from "./undeclared-service-calls";

export default class ServiceResourceChecker {

    private context: Context;
    private config: any;

    constructor(context: Context, config: any) {
        this.context = context;
        this.config = config;

        if (!context.log) {
            throw "Missing log in context.";
        }
    }

    getName() {
        return "Service loading checker";
    }

    startCheck() {
        const { baseDir, projectStructure } = this.context;
        const mainModules = findModules(this.config.mainProjects, projectStructure, baseDir);

        checkUndeclaredServiceCalls({
            allModules: projectStructure.allModules,        
            mainModules: mainModules,
            baseDir,
            config: this.config,
            log: this.context.log
        });
    }

}

function findModules(projectPattern: string, projectStructure: ProjectStructure, baseDir: string) {
    const projectPaths = glob.sync(projectPattern, {
        cwd: baseDir,
        onlyDirectories: true,
        absolute: true
    });
    
    let modules = [];
    for (const projectPath of projectPaths) {
        for (const module of projectStructure.allModules) {
            if (module.baseDir === projectPath) {
                modules.push(module);
            }
        }
    }

    return modules;
}