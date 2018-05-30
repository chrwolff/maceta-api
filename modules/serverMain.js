const http = require("http");
const path = require("path");
const fileSystem = require("fs-extra");
const fileRouter = require("./fileRouter");
const sapRouter = require("./sapRouter");

const express = require("express");
const app = express();
var apiRoutes = express.Router();

module.exports = function({ configuration, username, password }) {
  if (!configuration.basePath) {
    console.log(`No application path supplied!`);
    process.exit();
  }

  configuration.localHostname = configuration.localHostname || "localhost";
  configuration.localPort = configuration.localPort || 3000;
  configuration.resourceMap = configuration.resourceMap || {};
  configuration.shellConfig = configuration.shellConfig || "default";
  if (
    !("localLib" in configuration) ||
    typeof configuration.localLib !== "string"
  ) {
    configuration.localLib = "../lib";
  }

  if (configuration.localLib.substr(0, 1) === ".") {
    configuration.localLib = path.join(__dirname, "..", configuration.localLib);
  }

  const baseUrl = `http://${configuration.localHostname}:${
    configuration.localPort
  }/`;

  const indexUrl = `${baseUrl}index.html`;

  let shellUrl = `http://${configuration.localHostname}:${
    configuration.localPort
  }/shell?sap-ushell-config=standalone&local-ushell-config=${
    configuration.shellConfig
  }`;
  if (configuration.language) {
    shellUrl = `${shellUrl}&sap-language=${configuration.language}`;
  }
  shellUrl = `${shellUrl}#Shell-runStandaloneApp`;

  let server = http.Server(app);

  // start the server
  return new Promise(function(resolve, reject) {
    server.on("error", error => {
      console.log(`Error when starting server: ${error}`);
      reject();
    });

    server.listen(
      configuration.localPort,
      configuration.localHostname,
      async () => {
        let shellConfigPath = path.join(
          configuration.basePath,
          "shellConfig.json"
        );
        let shellConfigObject;
        try {
          shellConfigObject = await fileSystem.readJson(shellConfigPath);
        } catch (e) {
          shellConfigObject = {};
        }

        sapRouter({
          apiRoutes,
          configuration
        });

        fileRouter({
          apiRoutes,
          configuration,
          shellConfigObject
        });

        app.use("/", apiRoutes);

        function serverStopFunction() {
          if (server) {
            server.close();
            server = null;
          }
        }

        resolve({ baseUrl, indexUrl, shellUrl, serverStopFunction });
      }
    );
  });
};
