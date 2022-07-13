import glob from "fast-glob";
import path from "path";
import fs from "fs";
import { XMLParser } from "fast-xml-parser";
import { Module, Dependency } from "../../models/module";
import { ProjectStructure } from "../../models/context";

export default function getIvyModules(baseDir: string): ProjectStructure {
    const filePattern = "**/module.ivy";
    const moduleIvyPattern = path.join(baseDir, filePattern);
    const moduleIvyPaths = glob.sync(moduleIvyPattern);

    const allModules: Module[] = [];
    for (const ivyModulePath of moduleIvyPaths) {
        allModules.push(parseIvyModule(ivyModulePath));
    }

    const groupedModules = groupModulesByOrganisation(allModules);    
    return {
        allModules,
        groupedModules
    };
}

function groupModulesByOrganisation(allModules: Module[]): Map<string, Map<string, Module>> {
    const result = new Map<string, Map<string, Module>>();
    for (const module of allModules) {        
        const org = module.organisation;
        if (!result.has(org)) {
            result.set(org, new Map<string, Module>());
        }
        result.get(org).set(module.name, module);
    }

    return result;
}

function parseIvyModule(ivyModulePath: string): Module {
    const ivyModuleContent = fs.readFileSync(ivyModulePath).toString("utf8");
    const parser = new XMLParser({
        ignoreAttributes: false
    });
    const ivyModuleEl = parser.parse(ivyModuleContent)["ivy-module"];

    // Parse name and organisation.
    const organisation = ivyModuleEl.info["@_organisation"];
    const name = ivyModuleEl.info["@_module"];

    // Parse dependencies.
    const dependenciesEl = ivyModuleEl.dependencies;
    const dependencies: Dependency[] = [];

    if (dependenciesEl !== undefined) {
        if (dependenciesEl.dependency.length > 0) {
            for (const dependency of dependenciesEl.dependency) {
                dependencies.push(parseDependency(dependency));
            }
        } else {
            // For modules with just one dependency.
            dependencies.push(parseDependency(dependenciesEl.dependency));
        }
    }

    // Parse resources.
    const baseDir = path.dirname(ivyModulePath);

    return new Module(organisation, name, baseDir, dependencies);
}

function parseDependency(dependency: any): Dependency {
    return {
        org: dependency["@_org"],
        name: dependency["@_name"],
        rev: dependency["@_rev"]
    };
}