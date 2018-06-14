"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const odata_v4_server_1 = require("odata-v4-server");
const odata_v4_mongodb_1 = require("odata-v4-mongodb");
const connect_1 = require("./connect");
const mongodb_1 = require("mongodb");
class Post {
}
__decorate([
    odata_v4_server_1.Edm.Key,
    odata_v4_server_1.Edm.String,
    odata_v4_server_1.Edm.Computed
], Post.prototype, "id", void 0);
__decorate([
    odata_v4_server_1.Edm.String,
    odata_v4_server_1.Edm.Required
], Post.prototype, "userName", void 0);
__decorate([
    odata_v4_server_1.Edm.String
], Post.prototype, "text", void 0);
__decorate([
    odata_v4_server_1.Edm.String
], Post.prototype, "title", void 0);
let PostsController = class PostsController extends odata_v4_server_1.ODataController {
    find(query) {
        return __awaiter(this, void 0, Promise, function* () {
            const db = yield connect_1.default();
            const mongodbQuery = odata_v4_mongodb_1.createQuery(query);
            if (typeof mongodbQuery.query.id == "string")
                mongodbQuery.query.id = new mongodb_1.ObjectID(mongodbQuery.query.id);
            let result = typeof mongodbQuery.limit == "number" && mongodbQuery.limit === 0
                ? []
                : yield db
                    .collection("Posts")
                    .find(mongodbQuery.query)
                    .project(mongodbQuery.projection)
                    .skip(mongodbQuery.skip || 0)
                    .limit(mongodbQuery.limit || 0)
                    .sort(mongodbQuery.sort)
                    .toArray();
            if (mongodbQuery.inlinecount) {
                result.inlinecount = yield db
                    .collection("Posts")
                    .find(mongodbQuery.query)
                    .project(mongodbQuery.projection)
                    .count(false);
            }
            return result;
        });
    }
    insert(data) {
        return __awaiter(this, void 0, Promise, function* () {
            const db = yield connect_1.default();
            return yield db
                .collection("Posts")
                .insertOne(data)
                .then(result => {
                data.id = result.insertedId;
                return data;
            });
        });
    }
};
__decorate([
    odata_v4_server_1.odata.GET,
    __param(0, odata_v4_server_1.odata.query)
], PostsController.prototype, "find", null);
__decorate([
    odata_v4_server_1.odata.POST,
    __param(0, odata_v4_server_1.odata.body)
], PostsController.prototype, "insert", null);
PostsController = __decorate([
    odata_v4_server_1.odata.type(Post)
], PostsController);
exports.PostsController = PostsController;
//# sourceMappingURL=PostsController.js.map