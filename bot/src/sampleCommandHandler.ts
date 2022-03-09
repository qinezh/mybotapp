import { InvokeResponse } from "botbuilder";
import { buildAdaptiveCard, buildBotMessageWithoutData, DemoCommandCardData, getInvokeResponse } from "./adaptiveCardBuider";
import { BotContext, TeamsFxCommandHandler } from "./sdk/interfaces";
import demoCommandCard from "./adaptiveCards/demo-command.json"
import demoCommandResponseCard from "./adaptiveCards/demo-command-response.json"

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
        const input: DemoCommandCardData = {
            firstName: action.data.firstName,
            lastName: action.data.lastName
        }
        
        if (action.verb === 'personalDetailsFormSubmit') {
            const card = buildAdaptiveCard<DemoCommandCardData>(() => input, demoCommandResponseCard);
            return getInvokeResponse(card);
        }
    }
}