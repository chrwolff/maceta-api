import * as fsExtra from "fs-extra";
import * as path from "path";

let fs = fsExtra;
let serverStartUp;

export enum ServerErrors {
  manifestNotFound = "manifest.json not found",
  manifestContainsNoId = "manifest contains no id"
}

export interface ServerConfiguration {
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
  configuration: ServerConfiguration;
  errorPromise: Promise<boolean>;
}

class Server_Impl implements Server {
  private stopFunction = null;
  private componentId: string;
  readonly errorPromise: Promise<boolean>;
  constructor(readonly serverConfiguration: ServerConfiguration) {
    this.errorPromise = this.runChecks();
  }

  private runChecks(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      const manifestPath = path.join(
        process.cwd(),
        this.serverConfiguration.componentPath,
        "manifest.json"
      );
      try {
        let manifest = await fs.readJson(manifestPath);
        if ("sap.app" in manifest && "id" in manifest["sap.app"]) {
          this.componentId = manifest["sap.app"].id;
        } else {
          return reject(ServerErrors.manifestContainsNoId);
        }
      } catch (e) {
        return reject(ServerErrors.manifestNotFound);
      }
      return resolve(false);
    });
  }

  get configuration(): ServerConfiguration {
    return this.serverConfiguration;
  }

  start(): Promise<RuntimeDetails> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.errorPromise;
        let {
          baseUrl,
          indexUrl,
          shellUrl,
          serverStopFunction
        } = await serverStartUp();
        const runtimeDetails = {
          baseUrl,
          indexUrl,
          shellUrl
        };
        this.stopFunction = serverStopFunction;
        return resolve(runtimeDetails);
      } catch (e) {
        return reject(e);
      }
    });
  }

  stop(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.stopFunction();
        return resolve();
      } catch (e) {
        return reject(e);
      }
    });
  }
}

export function createServer(params: ServerConfiguration) {
  return new Server_Impl(params);
}

export function setServerMock(mock) {
  serverStartUp = mock;
}

export function setFilesystemMock(mock) {
  fs = mock;
}
