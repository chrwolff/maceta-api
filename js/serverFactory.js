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
})(ServerErrors = exports.ServerErrors || (exports.ServerErrors = {}));
class Server_Impl {
    constructor(serverConfiguration) {
        this._stopFunction = null;
        this._shellConfiguration = null;
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
                yield this.createShellConfig(serverParameters.createShellConfig);
                this.addResourcePath({
                    namespace: this._componentId,
                    path: this._serverConfiguration.componentPath
                });
            }
            catch (e) {
                return reject(ServerErrors.manifestNotFound);
            }
            return resolve(false);
        }));
    }
    get shellConfiguration() {
        return this._shellConfiguration;
    }
    get serverConfiguration() {
        return this._serverConfiguration;
    }
    createShellConfig(createShellConfig) {
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
    addResourcePath(resourcePath) {
        this._serverConfiguration.resourceMap[resourcePath.namespace] =
            resourcePath.path;
    }
    setShellLanguages(languages) {
        if (this._shellConfiguration == undefined) {
            throw new Error("No shell configuration created or loaded in constructor!");
        }
        this._shellConfiguration["default"].app.languages = languages;
        this.serverConfiguration.language = languages.length ? languages[0] : null;
        return this._shellConfiguration;
    }
    start() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.errorPromise;
                const serverProperties = yield serverStartUp(this._serverConfiguration, this._shellConfiguration);
                this._stopFunction = serverProperties.stopFunction;
                return resolve(serverProperties.url);
            }
            catch (e) {
                return reject(e);
            }
        }));
    }
    stop() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._stopFunction();
                return resolve();
            }
            catch (e) {
                return reject(e);
            }
        }));
    }
}
function createServer(params) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        const server = new Server_Impl(params);
        try {
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