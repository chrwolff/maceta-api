import { ODataController, Edm, odata, ODataQuery } from "odata-v4-server";
import { createQuery } from "odata-v4-mongodb";
import connect from "./connect";
import { ObjectID } from "mongodb";
import Post from "./PostsModel";

@odata.type(Post)
export class PostsController extends ODataController {
  @odata.GET
  async find(@odata.query query: ODataQuery): Promise<Post[]> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    if (typeof mongodbQuery.query._id == "string")
      mongodbQuery.query._id = new ObjectID(mongodbQuery.query._id);
    let result =
      typeof mongodbQuery.limit == "number" && mongodbQuery.limit === 0
        ? []
        : await db
            .collection("Posts")
            .find(mongodbQuery.query)
            .project(mongodbQuery.projection)
            .skip(mongodbQuery.skip || 0)
            .limit(mongodbQuery.limit || 0)
            .sort(mongodbQuery.sort)
            .toArray();
    if (mongodbQuery.inlinecount) {
      (<any>result).inlinecount = await db
        .collection("Posts")
        .find(mongodbQuery.query)
        .project(mongodbQuery.projection)
        .count(false);
    }
    result.unshift({
      _id: "newPost",
      userName: "",
      text: "",
      time: Date.now(),
      isTemplate: true
    })
    return result;
  }

  @odata.POST
  async insert(@odata.body data: any): Promise<Post> {
    const db = await connect();
    data.time = Date.now();
    return await db
      .collection("Posts")
      .insertOne(data)
      .then(result => {
        data._id = result.insertedId;
        return data;
      });
  }
}
