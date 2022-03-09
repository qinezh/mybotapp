import { InvokeResponse, TurnContext } from "botbuilder";
import { buildAdaptiveCard, buildBotMessageWithoutData, DemoCommandCardData, getInvokeResponse } from "./adaptiveCardBuider";
import demoCommandCard from "./adaptiveCards/demo-command.json"
import demoCommandResponseCard from "./adaptiveCards/demo-command-response.json"
import { TeamsFxCommandHandler } from "./sdk/notification";

export class SampleCommandHandler implements TeamsFxCommandHandler {
    readonly commandName: string;

    constructor(commandName: string) {
        this.commandName = commandName;
    }

    async handleCommandReceived(context: TurnContext): Promise<void> {
        const card = buildBotMessageWithoutData(demoCommandCard);
        await context.sendActivity(card);
    }

    async handleInvokeActivity(context: TurnContext): Promise<InvokeResponse> {
        const action = context.activity.value.action;
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