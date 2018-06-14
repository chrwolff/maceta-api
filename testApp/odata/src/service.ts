import { PostsController } from "./PostsController";
import { ODataServer, odata } from "odata-v4-server";

@odata.namespace("eby.mydata")
@odata.controller(PostsController, true)
export class Server extends ODataServer {}
