"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const mongodb_1 = require("mongodb");
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function () {
    return __awaiter(this, void 0, Promise, function* () {
        const client = yield mongodb_1.MongoClient.connect("mongodb://lev:maceta01@ds155730.mlab.com:55730/maceta");
        return client.db("maceta");
    });
};
//# sourceMappingURL=connect.js.map