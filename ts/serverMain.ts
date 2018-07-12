const fileRouter = require("../modules/fileRouter");
const sapRouter = require("../modules/sapRouter");
import { startODataRouter } from "./odataRouter";

const http = require("http");
const express = require("express");
const app = express();
const apiRoutes = express.Router();

export interface ServerConfiguration {
  componentPath: string;
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

export function startServer(
  configuration: ServerConfiguration,
  shellConfiguration: object
): Promise<ServerProperties> {
  let url = `http://${configuration.hostname}:${configuration.port}/`;
  if (configuration.shellId) {
    url = `${url}shell?sap-ushell-config=standalone&local-ushell-config=${
      configuration.shellId
    }`;
    if (configuration.language) {
      url = `${url}&sap-language=${configuration.language}`;
    }
    url = `${url}#Shell-runStandaloneApp`;
  }

  let server = http.Server(app);

  // start the server
  return new Promise(function(resolve, reject) {
    server.on("error", error => {
      console.log(`Error when starting server: ${error}`);
      reject();
    });

    server.listen(configuration.port, configuration.hostname, async () => {
      startODataRouter({ app, path: configuration.oDataPath });

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

      function stopFunction(): Promise<void> {
        return new Promise((resolve, reject) => {
          if (server) {
            server.close();
            server = null;
            return resolve();
          }
          reject();
        });
      }

      const serverProperties: ServerProperties = {
        url,
        stopFunction
      };
      resolve(serverProperties);
    });
  });
}
