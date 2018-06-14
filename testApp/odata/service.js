"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const PostsController_1 = require("./PostsController");
const odata_v4_server_1 = require("odata-v4-server");
let Server = class Server extends odata_v4_server_1.ODataServer {
};
Server = __decorate([
    odata_v4_server_1.odata.namespace("eby.mydata"),
    odata_v4_server_1.odata.controller(PostsController_1.PostsController, true)
], Server);
exports.Server = Server;
//# sourceMappingURL=service.js.map