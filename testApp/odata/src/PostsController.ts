import { ODataController, Edm, odata, ODataQuery } from "odata-v4-server";
import { createQuery } from "odata-v4-mongodb";
import connect from "./connect";
import { ObjectID } from "mongodb";

class Post {
  @Edm.Key
  @Edm.String
  @Edm.Computed
  id: ObjectID;

  @Edm.String
  @Edm.Required
  userName;

  @Edm.String text;

  @Edm.String title;
}

@odata.type(Post)
export class PostsController extends ODataController {
  @odata.GET
  async find(@odata.query query: ODataQuery): Promise<Post[]> {
    const db = await connect();
    const mongodbQuery = createQuery(query);
    if (typeof mongodbQuery.query.id == "string")
      mongodbQuery.query.id = new ObjectID(mongodbQuery.query.id);
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
    return result;
  }

  @odata.POST
  async insert(@odata.body data: any): Promise<Post> {
    const db = await connect();
    return await db
      .collection("Posts")
      .insertOne(data)
      .then(result => {
        data.id = result.insertedId;
        return data;
      });
  }
}
