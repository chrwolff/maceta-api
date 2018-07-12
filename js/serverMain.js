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
const fileRouter = require("../modules/fileRouter");
const sapRouter = require("../modules/sapRouter");
const odataRouter_1 = require("./odataRouter");
const http = require("http");
const express = require("express");
const app = express();
const apiRoutes = express.Router();
function startServer(configuration, shellConfiguration) {
    let url = `http://${configuration.hostname}:${configuration.port}/`;
    if (configuration.shellId) {
        url = `${url}shell?sap-ushell-config=standalone&local-ushell-config=${configuration.shellId}`;
        if (configuration.language) {
            url = `${url}&sap-language=${configuration.language}`;
        }
        url = `${url}#Shell-runStandaloneApp`;
    }
    let server = http.Server(app);
    // start the server
    return new Promise(function (resolve, reject) {
        server.on("error", error => {
            console.log(`Error when starting server: ${error}`);
            reject();
        });
        server.listen(configuration.port, configuration.hostname, () => __awaiter(this, void 0, void 0, function* () {
            odataRouter_1.startODataRouter({ app, path: configuration.oDataPath });
            sapRouter({
                apiRoutes,
                configuration
            });
            fileRouter({
                apiRoutes,
                configuration,
                shellConfiguration
            });
            app.use("/", apiRoutes);
            function stopFunction() {
                return new Promise((resolve, reject) => {
                    if (server) {
                        server.close();
                        server = null;
                        return resolve();
                    }
                    reject();
                });
            }
            const serverProperties = {
                url,
                stopFunction
            };
            resolve(serverProperties);
        }));
    });
}
exports.startServer = startServer;
//# sourceMappingURL=serverMain.js.map