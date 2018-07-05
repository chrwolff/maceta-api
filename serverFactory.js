let startUp = require("./modules/serverMain");

function Serverfactory() {}

Serverfactory.prototype.start = function() {};

module.exports = function(args) {
  return new Serverfactory(args);
};

module.exports.setMockServer = server => (startUp = server);
