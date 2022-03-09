import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { InvokeResponse, TeamsActivityHandler, TurnContext } from "botbuilder";
import { adapter } from "./global";
import demoCommandCard from "./adaptiveCards/demo-command.json";
import { buildBotMessageWithoutData, getInvokeResponse, handleInvokeActivity } from "./adaptiveCardBuider";

class MessageHandler extends TeamsActivityHandler {
    constructor() {
        super();
        this.onMessage(async (context, next) => {
            let txt = context.activity.text;
            const removedMentionText = TurnContext.removeRecipientMention(
                context.activity
            );
            if (removedMentionText) {
                // Remove the line break
                txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
            }

            // Trigger command by IM text
            switch (txt) {
                case "demo": {
                const card = buildBotMessageWithoutData(demoCommandCard);
                await context.sendActivity(card);
                break;
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    // Invoked when an activity is received.
    // You can handler different invoke activities according to its name and verb.
    async onInvokeActivity(context: TurnContext): Promise<InvokeResponse>{
        console.log('Activity: ', context.activity.name);
        if (context.activity.name === 'adaptiveCard/action') {
        const action = context.activity.value.action;
        console.log('Verb: ', action.verb);

        const card = await handleInvokeActivity(context);
        return getInvokeResponse(card);
        }
    }
}

const handler = new MessageHandler();

//const handler = new TeamsActivityHandler();
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    await adapter.processActivity(req, context.res as any, async (context) => {
        await handler.run(context);
    });
};

export default httpTrigger;