import { ObjectID } from "mongodb";
import { Edm } from "odata-v4-server";

export default class Post {
  @Edm.Key
  @Edm.String
  @Edm.Computed
  _id: ObjectID;

  @Edm.String
  @Edm.Required
  userName;

  @Edm.String text;

  @Edm.Int16 time;
}