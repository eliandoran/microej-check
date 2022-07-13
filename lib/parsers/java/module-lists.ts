import glob from "fast-glob";
import path from "path";
import fs from "fs";
import { Module } from "../../models/module";
import { ProjectStructure } from "../../models/context";

export default function getResourceLists(module: Module): Map<string, any> {
    const filePattern = "src/main/resources/**/*.list";
    const listPattern = path.join(module.baseDir, filePattern);
    const listPaths = glob.sync(listPattern);

    const lists = new Map<string, any>();
    for (const listPath of listPaths) {
        const domain = getListDomain(listPath);
        if (!lists.has(domain)) {
            lists.set(domain, []);
        }

        const parsedList = parseList(listPath);
        lists.set(domain, [ ...lists.get(domain), ...parsedList ]);
    }    

    //console.log(lists);

    return lists;
}

export function mergeResources(projectStructure: ProjectStructure) {
    for (const module of projectStructure.allModules) {        
        mergeModuleResources(module, projectStructure.groupedModules);
    }

    for (const module of projectStructure.allModules) {
        processLists(module.allResources);
    }
}

function mergeModuleResources(module: Module, groupedModules: Map<string, Map<string, Module>>) {
    if (module.allResources) {
        return;
    }    

    module.allResources = new Map<string, any>(module.resources);

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
            mergeModuleResources(dependencyModule, groupedModules);
        }                

        for (const resourceType of Object.keys(dependencyModule.resources)) {
            if (!module.allResources.has(resourceType)) {
                module.allResources.set(resourceType, []);
            }            

            module.allResources.set(resourceType, [
                ...module.allResources.get(resourceType),
                ...dependencyModule.allResources.get(resourceType)
            ]);
        }
    }
}

function getListDomain(listPath: string): string {
    const segments = listPath.split(".");
    return segments[segments.length - 2];
}

function parseList(listPath: string): string[] {
    return fs.readFileSync(listPath)
        .toString("utf-8")
        .split("\n")
        .filter((line) => {
            return(line.trim().length > 0 && !line.startsWith("#"))
        });
}

function processLists(lists: Map<string, any>) {
    const domainMappings = new Map<string, Function>();
    domainMappings.set("properties", parsePropertiesList);

    for (const domain of Object.keys(lists)) {
        const mappedDomain = domainMappings.get(domain);
        if (mappedDomain) {
            lists.set(domain, mappedDomain(lists.get(domain)));
        }
    }
}

function parsePropertiesList(listContent: string[]): Map<string, string> {
    const result = new Map<string, string>();
    for (const line of listContent) {
        const segments = line.split("=", 2);
        result.set(segments[0], segments[1]);
    }
    return result;
}