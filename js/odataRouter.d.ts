export interface MacetaODataServer {
    create(): any;
    namespace: string;
}
export declare function startODataRouter({ app, path }: {
    app: any;
    path: any;
}): void;
