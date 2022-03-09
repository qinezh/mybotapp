import { Activity, InvokeResponse, TurnContext } from "botbuilder";
import { buildAdaptiveCard, buildBotMessageWithoutData, DemoCommandCardData, getInvokeResponse } from "./adaptiveCardBuider";
import demoCommandCard from "./adaptiveCards/demo-command.json"
import demoCommandResponseCard from "./adaptiveCards/demo-command-response.json"
import { BaseCommandHandler } from "./sdk/commandHandler";

export class SampleCommandHandler  extends BaseCommandHandler {
    constructor(commandName: string) {
        super(commandName);
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

    shouldActivityBeHandled(activity: Activity): boolean {
        const action = activity.value.action;
        return action.verb === 'personalDetailsFormSubmit';
    }    
}