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
let serverStartUp;
class Server_Impl {
    constructor(serverParameters) {
        this.serverParameters = serverParameters;
        this.stopFunction = null;
    }
    get configuration() {
        return this.serverParameters;
    }
    start() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                let { baseUrl, indexUrl, shellUrl, serverStopFunction } = yield serverStartUp();
                const runtimeDetails = {
                    baseUrl,
                    indexUrl,
                    shellUrl
                };
                this.stopFunction = serverStopFunction;
                return resolve(runtimeDetails);
            }
            catch (e) {
                return reject(e);
            }
        }));
    }
    stop() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.stopFunction();
                return resolve();
            }
            catch (e) {
                return reject(e);
            }
        }));
    }
}
function createServer(params) {
    return new Server_Impl(params);
}
exports.createServer = createServer;
function setServerMock(mock) {
    serverStartUp = mock;
}
exports.setServerMock = setServerMock;
//# sourceMappingURL=serverFactory.js.map