import Log from "../../log";
import { Module } from "../../models/module";

interface UndeclaredServiceContext {
    allModules: Module[],
    mainModules: Module[],
    baseDir: string;
    config: any;
    log: Log;
}

export default function checkUndeclaredServiceCalls(context: UndeclaredServiceContext) {
    const ignoreServices = context.config.ignoreServices || [];

    for (const module of context.mainModules) {
        console.log(module);
        const properties = module.allResources.get("properties");
        const serviceCalls = module.allServiceInjectionCalls;

        for (const fqdn of Object.keys(serviceCalls)) {
            const implementation = properties[fqdn];

            if (ignoreServices.includes(fqdn)) {
                continue;
            }

            if (!implementation) {
                for (const file of serviceCalls.get(fqdn)) {
                    context.log.error(`A service was called via ServiceLoaderFactory, but it is not declared in a ".properties" file:\n${fqdn}`, {
                        file
                    });
                }
            }
        }
    }
}

