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

class Server_Impl implements Server {
  private _stopFunction = null;
  private _componentId: string;
  private _shellConfiguration = null;
  private _serverConfiguration: ServerConfiguration;
  private _nonSapNamespaces: string[] = [];
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

  get shellConfiguration(): object {
    return this._shellConfiguration;
  }

  get serverConfiguration(): ServerConfiguration {
    return this._serverConfiguration;
  }

  createShellConfigurationKey(key: string): void {
    if (this._shellConfiguration == undefined) {
      throw new Error(ServerErrors.noShellConfiguration);
    }
    if (key in this._shellConfiguration) {
      throw new Error(ServerErrors.shellConfigurationKeyAlreadyExists);
    }
    this._shellConfiguration[key] = {
      resourcePath: {}
    };
  }

  setShellConfigurationKey(key: string): void {
    if (this._shellConfiguration == undefined) {
      throw new Error(ServerErrors.noShellConfiguration);
    }
    if (key in this._shellConfiguration) {
      this._serverConfiguration.shellId = key;
    } else {
      throw new Error(ServerErrors.shellConfigurationKeyNotExist);
    }
  }

  createResourcePath({
    namespace,
    path,
    shellConfigurationKey = "default",
    sapServer = false
  }: ResourcePath): void {
    if (
      this._shellConfiguration == undefined &&
      (shellConfigurationKey !== "default" || sapServer)
    ) {
      throw new Error(ServerErrors.noShellConfiguration);
    }

    if (!sapServer) {
      this._serverConfiguration.resourceMap[namespace] = path;
    }

    if (
      namespace !== this._componentId &&
      this._shellConfiguration != undefined
    ) {
      if (shellConfigurationKey in this._shellConfiguration) {
        let pathObject;
        if (sapServer) {
          pathObject = {
            path,
            file: false
          };
        } else {
          pathObject = {
            file: true
          };
        }

        this._shellConfiguration[shellConfigurationKey].resourcePath[
          namespace
        ] = pathObject;
      } else {
        throw new Error(ServerErrors.shellConfigurationKeyNotExist);
      }
    }
  }

  setShellLanguages(languages: string[]): object {
    if (this._shellConfiguration == undefined) {
      throw new Error(ServerErrors.noShellConfiguration);
    }
    this._shellConfiguration.default.app.languages = languages;
    this.serverConfiguration.language = languages.length ? languages[0] : null;
    return this._shellConfiguration;
  }

  setStartLanguage(language: string): void {
    if (this._shellConfiguration == undefined) {
      throw new Error(ServerErrors.noShellConfiguration);
    }
    if (!this._shellConfiguration["default"].app.languages.includes(language)) {
      this._shellConfiguration["default"].app.languages.push(language);
    }
    this.serverConfiguration.language = language;
  }

  start(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      await this.errorPromise;
      if (
        this._shellConfiguration != undefined &&
        this._nonSapNamespaces.length
      ) {
        const unassignedNamespaces = this._nonSapNamespaces.filter(
          (ns: string) => !(ns in this._shellConfiguration.default.resourcePath)
        );
        if (unassignedNamespaces.length) {
          reject(ServerErrors.pathForNamespaceNotSet);
        }
      }
      const serverProperties: ServerProperties = await serverStartUp(
        this._serverConfiguration,
        this._shellConfiguration
      );
      this._stopFunction = serverProperties.stopFunction;
      return resolve(serverProperties.url);
    });
  }

  stop(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      await this._stopFunction();
      return resolve();
    });
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
        if (
          "sap.ui5" in manifest &&
          "dependencies" in manifest["sap.ui5"] &&
          "libs" in manifest["sap.ui5"].dependencies
        ) {
          this._nonSapNamespaces = Object.keys(
            manifest["sap.ui5"].dependencies.libs
          ).filter((lib: string) => lib.split(".")[0] !== "sap");
        }
      } catch (e) {
        return reject(ServerErrors.manifestNotFound);
      }

      try {
        await this.createShellConfig(serverParameters.shellConfiguration);
      } catch (e) {
        return reject(e.message);
      }

      this.createResourcePath({
        namespace: this._componentId,
        path: this._serverConfiguration.componentPath
      });

      return resolve(false);
    });
  }

  private async createShellConfig(shellConfiguration) {
    if (!shellConfiguration) {
      return;
    }

    this._serverConfiguration.shellId = "default";
    this._shellConfiguration = {
      default: {
        app: {
          languages: [],
          ui5ComponentName: this._componentId
        },
        resourcePath: {}
      }
    };
  }
}

export function createServer(params: ServerParameters): Promise<Server> {
  return new Promise(async (resolve, reject) => {
    try {
      const server: Server = new Server_Impl(params);
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
