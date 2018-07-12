import { ServerConfiguration } from "./serverMain";
export declare enum ServerErrors {
    manifestNotFound = "manifest.json not found",
    manifestContainsNoId = "manifest contains no id"
}
export interface ServerParameters {
    componentPath: string;
    localLibraryPath: string;
    oDataPath?: string;
    hostname?: string;
    port?: number;
    createShellConfig?: boolean;
}
export interface Server {
    start(): Promise<string>;
    stop(): Promise<void>;
    addResourcePath(ResourcePath: any): void;
    setShellLanguages(Array: any): object;
    shellConfiguration: object;
    serverConfiguration: ServerConfiguration;
    errorPromise: Promise<boolean>;
}
export interface ResourcePath {
    namespace: string;
    path: string;
}
export declare function createServer(params: ServerParameters): Promise<Server>;
export declare function setServerMock(mock: any): void;
export declare function setFilesystemMock(mock: any): void;
