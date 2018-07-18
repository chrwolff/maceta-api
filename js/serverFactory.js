"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fsExtra = require("fs-extra");
const path = require("path");
const serverMain_1 = require("./serverMain");
let fs = fsExtra;
let serverStartUp = serverMain_1.startServer;
var ServerErrors;
(function (ServerErrors) {
    ServerErrors["manifestNotFound"] = "manifest.json not found";
    ServerErrors["manifestContainsNoId"] = "manifest contains no id";
    ServerErrors["noShellConfiguration"] = "No shell configuration created or loaded in constructor";
    ServerErrors["shellConfigurationKeyAlreadyExists"] = "The shell configuration key already exists";
    ServerErrors["shellConfigurationKeyNotExist"] = "The shell configuration key does not exist";
    ServerErrors["pathForNamespaceNotSet"] = "Path for namespace was not set";
})(ServerErrors = exports.ServerErrors || (exports.ServerErrors = {}));
class Server_Impl {
    constructor(serverConfiguration) {
        this._stopFunction = null;
        this._shellConfiguration = null;
        this._nonSapNamespaces = [];
        this._serverConfiguration = {
            hostname: serverConfiguration.hostname || "localhost",
            port: serverConfiguration.port || 3000,
            componentPath: this.makePathAbolute(serverConfiguration.componentPath),
            localLibraryPath: this.makePathAbolute(serverConfiguration.localLibraryPath),
            oDataPath: this.makePathAbolute(serverConfiguration.oDataPath),
            shellId: null,
            resourceMap: {},
            language: null
        };
        this.errorPromise = this.prepareConfig(serverConfiguration);
    }
    get shellConfiguration() {
        return this._shellConfiguration;
    }
    get serverConfiguration() {
        return this._serverConfiguration;
    }
    createShellConfigurationKey(key) {
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
    setShellConfigurationKey(key) {
        if (this._shellConfiguration == undefined) {
            throw new Error(ServerErrors.noShellConfiguration);
        }
        if (key in this._shellConfiguration) {
            this._serverConfiguration.shellId = key;
        }
        else {
            throw new Error(ServerErrors.shellConfigurationKeyNotExist);
        }
    }
    createResourcePath({ namespace, path, shellConfigurationKey = "default", sapServer = false }) {
        if (this._shellConfiguration == undefined &&
            (shellConfigurationKey !== "default" || sapServer)) {
            throw new Error(ServerErrors.noShellConfiguration);
        }
        if (!sapServer) {
            this._serverConfiguration.resourceMap[namespace] = path;
        }
        if (namespace !== this._componentId &&
            this._shellConfiguration != undefined) {
            if (shellConfigurationKey in this._shellConfiguration) {
                let pathObject;
                if (sapServer) {
                    pathObject = {
                        path,
                        file: false
                    };
                }
                else {
                    pathObject = {
                        file: true
                    };
                }
                this._shellConfiguration[shellConfigurationKey].resourcePath[namespace] = pathObject;
            }
            else {
                throw new Error(ServerErrors.shellConfigurationKeyNotExist);
            }
        }
    }
    setShellLanguages(languages) {
        if (this._shellConfiguration == undefined) {
            throw new Error(ServerErrors.noShellConfiguration);
        }
        this._shellConfiguration.default.app.languages = languages;
        this.serverConfiguration.language = languages.length ? languages[0] : null;
        return this._shellConfiguration;
    }
    setStartLanguage(language) {
        if (this._shellConfiguration == undefined) {
            throw new Error(ServerErrors.noShellConfiguration);
        }
        if (!this._shellConfiguration["default"].app.languages.includes(language)) {
            this._shellConfiguration["default"].app.languages.push(language);
        }
        this.serverConfiguration.language = language;
    }
    start() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            yield this.errorPromise;
            if (this._shellConfiguration != undefined &&
                this._nonSapNamespaces.length) {
                const unassignedNamespaces = this._nonSapNamespaces.filter((ns) => !(ns in this._shellConfiguration.default.resourcePath));
                if (unassignedNamespaces.length) {
                    reject(ServerErrors.pathForNamespaceNotSet);
                }
            }
            const serverProperties = yield serverStartUp(this._serverConfiguration, this._shellConfiguration);
            this._stopFunction = serverProperties.stopFunction;
            return resolve(serverProperties.url);
        }));
    }
    stop() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            yield this._stopFunction();
            return resolve();
        }));
    }
    makePathAbolute(dir) {
        if (dir == undefined) {
            return null;
        }
        else if (path.isAbsolute(dir)) {
            return dir;
        }
        return path.join(process.cwd(), dir);
    }
    prepareConfig(serverParameters) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const manifestPath = path.join(this._serverConfiguration.componentPath, "manifest.json");
            try {
                let manifest = yield fs.readJson(manifestPath);
                if ("sap.app" in manifest && "id" in manifest["sap.app"]) {
                    this._componentId = manifest["sap.app"].id;
                }
                else {
                    return reject(ServerErrors.manifestContainsNoId);
                }
                if ("sap.ui5" in manifest &&
                    "dependencies" in manifest["sap.ui5"] &&
                    "libs" in manifest["sap.ui5"].dependencies) {
                    this._nonSapNamespaces = Object.keys(manifest["sap.ui5"].dependencies.libs).filter((lib) => lib.split(".")[0] !== "sap");
                }
            }
            catch (e) {
                return reject(ServerErrors.manifestNotFound);
            }
            try {
                yield this.createShellConfig(serverParameters.shellConfiguration);
            }
            catch (e) {
                return reject(e.message);
            }
            this.createResourcePath({
                namespace: this._componentId,
                path: this._serverConfiguration.componentPath
            });
            return resolve(false);
        }));
    }
    createShellConfig(shellConfiguration) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
}
function createServer(params) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            const server = new Server_Impl(params);
            yield server.errorPromise;
            resolve(server);
        }
        catch (e) {
            reject(e);
        }
    }));
}
exports.createServer = createServer;
function setServerMock(mock) {
    serverStartUp = mock;
}
exports.setServerMock = setServerMock;
function setFilesystemMock(mock) {
    fs = mock;
}
exports.setFilesystemMock = setFilesystemMock;
//# sourceMappingURL=serverFactory.js.map