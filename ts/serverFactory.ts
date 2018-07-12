import * as fsExtra from "fs-extra";
import * as path from "path";
import {
  ServerConfiguration,
  startServer,
  ServerProperties
} from "./serverMain";

let fs = fsExtra;
let serverStartUp = startServer;

export enum ServerErrors {
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
  addResourcePath(ResourcePath): void;
  setShellLanguages(Array): object;
  shellConfiguration: object;
  serverConfiguration: ServerConfiguration;
  errorPromise: Promise<boolean>;
}

export interface ResourcePath {
  namespace: string;
  path: string;
}

class Server_Impl implements Server {
  private _stopFunction = null;
  private _componentId: string;
  private _shellConfiguration = null;
  private _serverConfiguration: ServerConfiguration;
  readonly errorPromise: Promise<boolean>;

  constructor(serverConfiguration: ServerParameters) {
    this._serverConfiguration = {
      hostname: serverConfiguration.hostname || "localhost",
      port: serverConfiguration.port || 3000,
      componentPath: this.makePathAbolute(serverConfiguration.componentPath),
      localLibraryPath: this.makePathAbolute(
        serverConfiguration.localLibraryPath
      ),
      oDataPath: this.makePathAbolute(serverConfiguration.oDataPath),
      shellId: null,
      resourceMap: {},
      language: null
    };
    this.errorPromise = this.prepareConfig(serverConfiguration);
  }

  private makePathAbolute(dir: string): string {
    if (dir == undefined) {
      return null;
    } else if (path.isAbsolute(dir)) {
      return dir;
    }
    return path.join(process.cwd(), dir);
  }

  private prepareConfig(serverParameters: ServerParameters): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      const manifestPath = path.join(
        this._serverConfiguration.componentPath,
        "manifest.json"
      );
      try {
        let manifest = await fs.readJson(manifestPath);
        if ("sap.app" in manifest && "id" in manifest["sap.app"]) {
          this._componentId = manifest["sap.app"].id;
        } else {
          return reject(ServerErrors.manifestContainsNoId);
        }
        await this.createShellConfig(serverParameters.createShellConfig);
        this.addResourcePath({
          namespace: this._componentId,
          path: this._serverConfiguration.componentPath
        });
      } catch (e) {
        return reject(ServerErrors.manifestNotFound);
      }
      return resolve(false);
    });
  }

  get shellConfiguration(): object {
    return this._shellConfiguration;
  }

  get serverConfiguration(): ServerConfiguration {
    return this._serverConfiguration;
  }

  private createShellConfig(createShellConfig) {
    if (createShellConfig) {
      this._shellConfiguration = {
        default: {
          app: {
            languages: [],
            ui5ComponentName: this._componentId
          },
          resourcePath: {}
        }
      };
      this._serverConfiguration.shellId = "default";
    }
  }

  addResourcePath(resourcePath: ResourcePath): void {
    this._serverConfiguration.resourceMap[resourcePath.namespace] =
      resourcePath.path;
  }

  setShellLanguages(languages: string[]): object {
    if (this._shellConfiguration == undefined) {
      throw new Error(
        "No shell configuration created or loaded in constructor!"
      );
    }
    this._shellConfiguration["default"].app.languages = languages;
    this.serverConfiguration.language = languages.length ? languages[0] : null;
    return this._shellConfiguration;
  }

  start(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.errorPromise;
        const serverProperties: ServerProperties = await serverStartUp(
          this._serverConfiguration,
          this._shellConfiguration
        );
        this._stopFunction = serverProperties.stopFunction;
        return resolve(serverProperties.url);
      } catch (e) {
        return reject(e);
      }
    });
  }

  stop(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await this._stopFunction();
        return resolve();
      } catch (e) {
        return reject(e);
      }
    });
  }
}

export function createServer(params: ServerParameters): Promise<Server> {
  return new Promise(async (resolve, reject) => {
    const server: Server = new Server_Impl(params);
    try {
      await server.errorPromise;
      resolve(server);
    } catch (e) {
      reject(e);
    }
  });
}

export function setServerMock(mock) {
  serverStartUp = mock;
}

export function setFilesystemMock(mock) {
  fs = mock;
}
