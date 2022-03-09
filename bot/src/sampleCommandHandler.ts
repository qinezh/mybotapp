import { InvokeResponse } from "botbuilder";
import { buildBotMessageWithoutData, getInvokeResponse } from "./adaptiveCardBuider";
import { BotContext, TeamsFxCommandHandler } from "./sdk/interfaces";
import demoCommandCard from "./adaptiveCards/demo-command.json"

export class SampleCommandHandler implements TeamsFxCommandHandler {
    readonly commandName: string;

    constructor(commandName: string) {
        this.commandName = commandName;
    }

    async handleCommandReceived(context: BotContext): Promise<void> {
        const card = buildBotMessageWithoutData(demoCommandCard);
        await context.turnContext.sendActivity(card);
    }

    async handleInvokeActivity(context: BotContext): Promise<InvokeResponse> {
        const action = context.turnContext.activity.value.action;
        
        if (action.verb === 'personalDetailsFormSubmit') {
            const card = {
                $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                body: [
                    {
                        type: "TextBlock",
                        text: `Command executed sussfully! First Name: ${action.data.lastName}, Last Name: ${action.data.lastName}`,
                        wrap: true
                    },
                ]
            };

            return getInvokeResponse(card);
        }
    }
}