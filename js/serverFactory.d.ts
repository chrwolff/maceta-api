export interface ServerParameters {
    componentPath: string;
    hostname?: string;
    port?: number;
}
export interface RuntimeDetails {
    baseUrl: string;
    indexUrl: string;
    shellUrl: string;
}
export interface Server {
    start(): Promise<RuntimeDetails>;
    stop(): Promise<void>;
    configuration: ServerParameters;
}
declare class Server_Impl implements Server {
    readonly serverParameters: ServerParameters;
    private stopFunction;
    constructor(serverParameters: ServerParameters);
    readonly configuration: ServerParameters;
    start(): Promise<RuntimeDetails>;
    stop(): Promise<void>;
}
export declare function createServer(params: ServerParameters): Server_Impl;
export declare function setServerMock(mock: any): void;
export {};
