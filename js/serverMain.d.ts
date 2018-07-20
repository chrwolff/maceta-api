export interface ServerConfiguration {
    componentPath: string;
    basePath: string;
    localLibraryPath: string;
    hostname: string;
    port: number;
    resourceMap: object;
    shellId?: string;
    oDataPath?: string;
    language?: string;
}
export interface ServerProperties {
    url: string;
    stopFunction(): Promise<void>;
}
export declare function startServer(configuration: ServerConfiguration, shellConfiguration: object): Promise<ServerProperties>;
