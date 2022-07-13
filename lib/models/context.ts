import Log from "../log";
import { Module } from "./module";

export interface Context {

    projectStructure: ProjectStructure;
    baseDir: string;
    log: Log

}

export interface ProjectStructure {
    allModules: Module[];
    groupedModules: Map<string, Map<string, Module>>;
}