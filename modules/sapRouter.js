const fileSystem = require("fs-extra");
const url = require("url");
const path = require("path");
const getMimeType = require("./mimeTypes");

const CACHE_TIME = 24 * 60 * 60;

module.exports = function({ apiRoutes, configuration }) {
  apiRoutes.all("/sap/public/bc/ui5_ui5/*", (req, res) => {
    let fullPath = url.parse(req.url).pathname;
    fullPath = path.join(
      configuration.localLib,
      fullPath
        .split("/")
        .slice(5)
        .join("/")
    );
    fileSystem.readFile(fullPath, function(err, data) {
      if (err) {
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        var extension = path.parse(fullPath).ext;
        var mimeType = getMimeType({ extension });
        // if the file is found, set Content-type and send data
        res.setHeader("Content-type", mimeType);
        res.setHeader("Cache-Control", `max-age=${CACHE_TIME};must-revalidate`);
        res.send(data);
      }
    });
  });

  apiRoutes.all("/sap/opu/odata/*", (req, res) => {
    const fullPath = url.parse(req.url).pathname;
    const serviceName = fullPath
      .split("/")
      .slice(4)
      .join("/");
    res.statusCode = 500;
    res.send();
  });

  apiRoutes.all("/sap/bc/ui2/start_up", (req, res) => {
    const config = {
      version: "1.2.01",
      dateFormat: "1",
      tislcal: [],
      email: "Christian.Wolff@readsoft.com",
      firstName: "Christian",
      fullName: "Christian Wolff",
      id: "WOLFF",
      language: "EN",
      languageBcp47: "en",
      lastName: "Wolff",
      menu: null,
      numberFormat: "",
      rtl: false,
      theme: "sap_belize_plus",
      timeFormat: "0",
      timeZone: "CET",
      welcomeMessage: "",
      isJamActive: false,
      isEmbReportingActive: false,
      initialTarget: []
    };
    res.send(JSON.stringify(config));
  });
};
