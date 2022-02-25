import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { adapter } from "./global";
import { TeamsBot } from "./teamsBot";

const bot = new TeamsBot();
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    await adapter.processActivity(req, context.res as any, async (context) => {
        await bot.run(context);
    }).catch((err) => {
        // Error message including "412" means it is waiting for user's consent, which is a normal process of SSO, sholdn't throw this error.
        if (!err.message.includes("412")) {
            throw err;
        }
    });;
};

export default httpTrigger;