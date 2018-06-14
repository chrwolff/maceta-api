import { MongoClient, Db } from "mongodb";
require("dotenv").config({ path: __dirname + "/../variables.env" });

export default async function(): Promise<Db> {
  const client: MongoClient = await MongoClient.connect(process.env.MONGODBURL);
  return client.db("maceta");
}
