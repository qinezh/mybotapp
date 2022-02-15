import { Activity, ConversationReference, Middleware, ResourceResponse, TurnContext } from "botbuilder";
import { ConversationReferenceStore } from "./store";

export class TeamsFxMiddleware implements Middleware {
    private readonly store: ConversationReferenceStore;

    constructor(store: ConversationReferenceStore) {
        this.store = store;
    }

    public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        if (context.activity && this.isBotAdded(context.activity)) {
            const reference = TurnContext.getConversationReference(context.activity);
            await this.store.add(reference);
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
                if (member.id === activity.recipient.id) {
                    return true;
                }
            }
        }

        return false;
    }
}