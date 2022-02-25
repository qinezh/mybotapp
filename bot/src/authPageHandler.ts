import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import * as fs from "fs-extra";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let content = "";
    let url = new URL(req.url);
    if (url.pathname.endsWith("auth-start.html")) {
        content = await fs.readFile(`${__dirname}/public/auth-start.html`, "utf8");
    } else if (url.pathname.endsWith("auth-end.html")) {
        content = await fs.readFile(`${__dirname}/public/auth-end.html`, "utf8");
    }

    context.res = {
        status: 200,
        body: content,
        headers:{
            "Content-Type": "text/html; charset=utf-8"
        }
    };
};

export default httpTrigger;