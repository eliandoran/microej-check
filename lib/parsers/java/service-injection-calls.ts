import fs from "fs";
import path from "path";
import glob from "fast-glob";
import { Module } from "../../models/module";
import { ProjectStructure } from "../../models/context";

export function getServiceInjectionCalls(module: Module) {
    const filePattern = "**/src/*/java/**/*.java";
    const javaPattern = path.join(module.baseDir, filePattern);
    const javaPaths = glob.sync(javaPattern);

    let serviceInjectionCalls = new Map<string, Set<string>>();
    for (const javaPath of javaPaths) {
        processJavaFile(javaPath, serviceInjectionCalls);
    }

    return serviceInjectionCalls;
}

export function mergeServiceInjectionCalls(projectStructure: ProjectStructure) {
    for (const module of projectStructure.allModules) {
        mergeModuleServiceInjectionCalls(module, projectStructure.groupedModules);
    }
}

function mergeModuleServiceInjectionCalls(module: Module, groupedModules: Map<string, Map<string, Module>>) {
    if (module.allServiceInjectionCalls) {
        return;
    }

    module.allServiceInjectionCalls = new Map<string, Set<string>>(module.serviceInjectionCalls)

    for (const dependency of module.dependencies) {
        const org = dependency.org;
        if (!groupedModules.has(org)) {
            continue;
        }

        const name = dependency.name;
        const dependencyModule = groupedModules.get(org).get(name);
        if (!dependencyModule) {
            continue;
        }

        if (dependencyModule.dependencies) {
            mergeModuleServiceInjectionCalls(dependencyModule, groupedModules);
        }

        for (const fqdn of Object.keys(dependencyModule.allServiceInjectionCalls)) {
            if (module.allServiceInjectionCalls.has(fqdn)) {
                module.allServiceInjectionCalls.set(fqdn, new Set([
                    ...module.allServiceInjectionCalls.get(fqdn),
                    ...dependencyModule.allServiceInjectionCalls.get(fqdn)
                ]));
            } else {
                module.allServiceInjectionCalls.set(fqdn, dependencyModule.allServiceInjectionCalls.get(fqdn));
            }
        }        
    }
}

function processJavaFile(javaFilePath: string, serviceInjectionCalls: Map<string, Set<string>>): Map<string, Set<string>> {
    const javaContent = fs.readFileSync(javaFilePath).toString("utf-8");
    const importMap = buildImportMap(javaContent);

    const pattern = /(Services.of|ServiceLoaderFactory.getServiceLoader().getService)\((\w*)\.class/g;
    let match;

    while (match = pattern.exec(javaContent)) {
        const serviceName = match[3];
        let serviceFqdn = importMap.get(serviceName);

        if (!serviceFqdn) {
            const packageName = getPackageName(javaContent);
            serviceFqdn = getFqdn(packageName, serviceName);
        }

        if (!serviceInjectionCalls.has(serviceFqdn)) {
            serviceInjectionCalls.set(serviceFqdn, new Set());
        }

        serviceInjectionCalls.get(serviceFqdn).add(javaFilePath);
    }    

    return serviceInjectionCalls;
}

function getFqdn(packageName: string, serviceName: string): string {
    if (packageName && packageName.length > 0) {
        return `${packageName}.${serviceName}`;
    } else {
        return serviceName;
    }
}

function getPackageName(javaContent: string): string {
    const packagePattern = /package\s*([\w\.]*)/g;
    const packageMatch = packagePattern.exec(javaContent);
    if (packageMatch && packageMatch.length == 2) {
        return packageMatch[1];
    } else {
        return "";
    }
}

function buildImportMap(javaContent: string): Map<string, string> {
    const importPattern = /^\s*import\s*([\w\.]*)/gm;
    let match;
    let result = new Map<string, string>();

    while (match = importPattern.exec(javaContent)) {
        const fqdn = match[1];
        const segments = fqdn.split(".");
        const name = segments[segments.length - 1];
        result.set(name, fqdn);
    }

    return result;
}
