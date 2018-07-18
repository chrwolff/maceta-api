const fileSystem = require("fs-extra");
const url = require("url");
const path = require("path");
const getMimeType = require("./mimeTypes");
const babel = require("babel-core");

module.exports = function({ apiRoutes, configuration, shellConfiguration }) {
  function resolveFile({ reqPath, res, urlPath, babelJit = false }) {
    var fullPath = reqPath;
    if (!path.isAbsolute(reqPath)) {
      fullPath = path.join(configuration.componentPath, reqPath);
    }

    fileSystem.readFile(fullPath, function(err, data) {
      if (err) {
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        var ext = path.parse(fullPath).ext;
        var mimeType = getMimeType({ extension: ext });
        var content = data;
        // if the file is found, set Content-type and send data
        res.setHeader("Content-type", mimeType);
        res.setHeader("Cache-Control", "no-store");
        if (babelJit && ext === ".js") {
          var transpileObj = babel.transform(data, {
            ast: false,
            babelrc: false,
            sourceMaps: "inline",
            comments: false,
            sourceFileName: urlPath,
            minified: true,
            presets: [path.join(__dirname, "../../babel-preset-env")],
            plugins: [
              path.join(
                __dirname,
                "../../babel-plugin-transform-object-rest-spread"
              )
            ]
          });
          content = transpileObj.code;
        }
        res.send(content);
      }
    });
  }

  // this route is used by the shell index.html
  apiRoutes.all("/shellConfig", (req, res) => {
    let mimeType = getMimeType({ extension: ".json" });
    res.setHeader("Content-type", mimeType);
    res.send(JSON.stringify(shellConfiguration));
  });

  // requests to "/shell/*" send back files from the shell folder
  apiRoutes.all("/shell*", (request, response) => {
    let urlPath = url.parse(request.url).pathname;
    if (urlPath === "/shell") {
      urlPath = "/shell/shell.html";
    }
    let filePath = path.join(__dirname, "..", urlPath);
    fileSystem.readFile(filePath, "utf8", function(err, data) {
      if (err) {
        response.statusCode = 500;
        response.end(`Error getting the file: ${err}.`);
      } else {
        var ext = path.parse(filePath).ext;
        var mimeType = getMimeType({ extension: ext });
        response.setHeader("Content-type", mimeType);
        response.send(data);
      }
    });
  });

  // mapping of resource paths to server routes and file system paths.
  // step 1: create an array of routes together with their number of seperators
  var matchers = Object.keys(configuration.resourceMap).map(matchKey => {
    var matchPath = configuration.resourceMap[matchKey];
    var splitIndex = matchKey.split(".").length + 1;
    var matchString = matchKey.replace(/\./g, "/");
    return {
      matchString,
      matchPath,
      splitIndex
    };
  });

  // step 2: sort the routes by number of seperators. more specific routes to front
  matchers.sort((a, b) => {
    if (a.splitIndex < b.splitIndex) {
      return 1;
    } else if (a.splitIndex > b.splitIndex) {
      return -1;
    }
    return 0;
  });

  // step 3: connect routes and file paths
  matchers.forEach(matcher => {
    apiRoutes.get(
      "/" + matcher.matchString + "/*",
      matchRoute(matcher.matchPath, matcher.splitIndex)
    );
  });

  function matchRoute(matchPath, splitIndex) {
    return (req, res) => {
      var urlPath = url.parse(req.url).pathname;
      var splitPath = urlPath.split("/");
      var reqPath = matchPath + "/" + splitPath.slice(splitIndex).join("/");
      resolveFile({ reqPath, res, urlPath });
    };
  }

  // every other route will be resolved as a file access relative to the applicationPath
  apiRoutes.get("/*", (req, res) => {
    const resourcePath = path.join(".", url.parse(req.url).pathname);
    resolveFile({ reqPath: resourcePath, res, urlPath: resourcePath });
  });
};
