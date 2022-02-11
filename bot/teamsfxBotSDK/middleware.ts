import { Activity, ConversationReference, Middleware, ResourceResponse, TurnContext } from "botbuilder";
import { TeamsFxBot } from "./bot";

export class TeamsFxMiddleware implements Middleware {
    private readonly botId: string;
    private readonly teamsfxBot: TeamsFxBot;

    constructor(botId: string, teamsfxBot: TeamsFxBot) {
        this.botId = botId;
        this.teamsfxBot = teamsfxBot;
    }

    public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        if (context.activity && this.isBotAdded(context.activity)) {
            const reference = TurnContext.getConversationReference(context.activity);
            await this.teamsfxBot.store.add(reference);
        }

        // hook up onSend pipeline
        context.onSendActivities(
            async (ctx: TurnContext, activities: Partial<Activity>[], next: () => Promise<ResourceResponse[]>) => {
                return await next();
            });

        // hook up update activity pipeline
        context.onUpdateActivity(
            async (ctx: TurnContext, activity: Partial<Activity>, next: () => Promise<void>) => {
                await next();
            }
        );

        // hook up delete activity pipeline
        context.onDeleteActivity(
            async (ctx: TurnContext, reference: Partial<ConversationReference>, next: () => Promise<void>) => {
                await next();
            }
        );

        await next();
    }

    private isBotAdded(activity: Partial<Activity>): boolean {
        if (activity.membersAdded?.length > 0) {
            for (const member of activity.membersAdded) {
                if (member.id.includes(this.botId)) {
                    return true
                }
            }
        }

        return false;
    }
}