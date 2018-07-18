import { ServerConfiguration } from "./serverMain";
export declare enum ServerErrors {
    manifestNotFound = "manifest.json not found",
    manifestContainsNoId = "manifest contains no id",
    noShellConfiguration = "No shell configuration created or loaded in constructor",
    shellConfigurationKeyAlreadyExists = "The shell configuration key already exists",
    shellConfigurationKeyNotExist = "The shell configuration key does not exist",
    pathForNamespaceNotSet = "Path for namespace was not set"
}
export interface ServerParameters {
    componentPath: string;
    localLibraryPath: string;
    shellConfiguration: boolean;
    oDataPath?: string;
    hostname?: string;
    port?: number;
}
export interface Server {
    start(): Promise<string>;
    stop(): Promise<void>;
    createResourcePath(path: ResourcePath): void;
    setShellLanguages(languages: string[]): object;
    setStartLanguage(language: string): void;
    createShellConfigurationKey(key: string): void;
    setShellConfigurationKey(key: string): void;
    shellConfiguration: object;
    serverConfiguration: ServerConfiguration;
    errorPromise: Promise<boolean>;
}
export interface ResourcePath {
    namespace: string;
    path: string;
    shellConfigurationKey?: string;
    sapServer?: boolean;
}
export declare function createServer(params: ServerParameters): Promise<Server>;
export declare function setServerMock(mock: any): void;
export declare function setFilesystemMock(mock: any): void;
