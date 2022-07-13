import getIvyModules from "./ivy-modules";
import { default as getResourceLists, mergeResources } from "./module-lists";
import { getServiceInjectionCalls, mergeServiceInjectionCalls } from "./service-injection-calls";

export default function parseJavaProjects(baseDir: string) {    
    const projectStructure = getIvyModules(baseDir);

    for (const module of projectStructure.allModules) {
        module.resources = getResourceLists(module);                    
        module.serviceInjectionCalls = getServiceInjectionCalls(module);
    }

    mergeResources(projectStructure);    
    mergeServiceInjectionCalls(projectStructure);

    return projectStructure;
}