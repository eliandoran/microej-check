export class Module {
    organisation: string;
    name: string;
    baseDir: string;
    dependencies: Dependency[];

    resources: Map<string, any>;
    allResources: Map<string, any>;

    serviceInjectionCalls: Map<string, Set<string>>;
    allServiceInjectionCalls: Map<string, Set<string>>;

    constructor(
        organisation: string,
        name: string,
        baseDir: string,
        dependencies: Dependency[])
    {
        this.organisation = organisation;
        this.name = name;
        this.baseDir = baseDir;
        this.dependencies = dependencies;
    }
}

export interface Dependency {
    org: string;
    name: string;
    rev: string;
}