import { MongoClient, Db } from "mongodb";

export default async function(): Promise<Db> {
  const client:MongoClient = await MongoClient.connect(
    "mongodb://lev:maceta01@ds155730.mlab.com:55730/maceta"
  );
  return client.db("maceta");
}
