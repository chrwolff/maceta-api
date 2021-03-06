const fileSystem = require("fs-extra");
const directoryTree = require("directory-tree");

const odataBasePath = "/sap/opu/odata/";

module.exports = function({ app, path }) {
  if (path == undefined || !fileSystem.pathExistsSync(path)) {
    return;
  }

  const metadataFiles = directoryTree(path, {
    extensions: /\.js/
  });

  metadataFiles.children
    .filter(child => child.name === "service.js")
    .forEach(child => {
      let service = require(child.path);
      if ("Server" in service) {
        let serverArray;
        if (typeof service.Server === "array") {
          serverArray = service.Server;
        } else {
          serverArray = [service.Server];
        }
        serverArray
          .filter(
            server =>
              "create" in server &&
              typeof server.create === "function" &&
              "namespace" in server &&
              typeof server.namespace === "string"
          )
          .forEach(server => {
            // more than one schema possible in SAP definition?
            // special SAP schema?
            // namespace identical with service name?
            let namespace = server.namespace.split(".").join("/");
            let odataPath = `${odataBasePath}${namespace}`;
            app.use(odataPath, server.create());
          });
      }
    });
};
