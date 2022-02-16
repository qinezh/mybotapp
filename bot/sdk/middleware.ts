import { Activity, ConversationReference, Middleware, ResourceResponse, TurnContext } from "botbuilder";
import { ConversationReferenceStore } from "./store";

export interface TeamsFxMiddlewareOptions {
    store: ConversationReferenceStore,
    welcomeMessage?: WelcomeMessage
}

export interface WelcomeMessage {
    message: Partial<Activity>,
    trigger?: WelcomeMessageTrigger
}

export enum WelcomeMessageTrigger {
    BotInstall,
    NewMemberAdded
}

export class TeamsFxMiddleware implements Middleware {
    private readonly store: ConversationReferenceStore;
    private readonly welcomeMessage: WelcomeMessage | undefined;

    constructor(options: TeamsFxMiddlewareOptions) {
        this.store = options.store;
        this.welcomeMessage = options.welcomeMessage;
        this.welcomeMessage.trigger = options.welcomeMessage.trigger ?? WelcomeMessageTrigger.BotInstall;
    }

    public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        if (this.isBotAdded(context.activity)) {
            const reference = TurnContext.getConversationReference(context.activity);
            await this.store.add(reference);

            if (this.welcomeMessage?.trigger === WelcomeMessageTrigger.BotInstall) {
                await context.sendActivity(this.welcomeMessage.message);
            }
        } else if (this.isMembersAdded(context.activity) && this.welcomeMessage?.trigger === WelcomeMessageTrigger.NewMemberAdded) {
            await context.sendActivity(this.welcomeMessage.message);
        }

        // hook up onSend pipeline
        context.onSendActivities(
            async (ctx: TurnContext, activities: Partial<Activity>[], next: () => Promise<ResourceResponse[]>) => {
                return await next();
            }
        );

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

    // current bot is excluded.
    private isMembersAdded(activity: Partial<Activity> | undefined): boolean {
        return activity?.membersAdded?.length > 0 && !this.isBotAdded(activity);
    }

    private isBotAdded(activity: Partial<Activity> | undefined): boolean {
        if (activity?.membersAdded?.length > 0) {
            for (const member of activity.membersAdded) {
                if (member.id === activity.recipient.id) {
                    return true;
                }
            }
        }

        return false;
    }
}