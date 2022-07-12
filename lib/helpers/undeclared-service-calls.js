import path from "path";
import glob from "fast-glob";

export default function checkUndeclaredServiceCalls(context) {
    const { mainProjects } = context.config;
    const modules = findModules(mainProjects, context.modules, context.baseDir);

    for (const module of modules) {
        console.log(module.name);
        const properties = module.allResources.properties;
        const serviceCalls = module.allServiceInjectionCalls;

        for (const serviceCall of serviceCalls) {
            const implementation = properties[serviceCall];
            console.log(`\t${serviceCall} -> ${implementation}`);
        }
    }
}

function findModules(projectPattern, allModules, baseDir) {
    const projectPaths = glob.sync(projectPattern, {
        cwd: baseDir,
        onlyDirectories: true,
        absolute: true
    });
    
    let modules = [];
    for (const projectPath of projectPaths) {
        for (const module of allModules) {
            if (module.baseDir === projectPath) {
                modules.push(module);
            }
        }
    }

    return modules;
}