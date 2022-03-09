import { Activity, ActivityTypes, INVOKE_RESPONSE_KEY, Middleware, TurnContext } from "botbuilder";
import { TeamsFxCommandHandler } from "./conversation";
import { ConversationReferenceStore } from "./store";

export interface NotificationMiddlewareOptions {
    conversationReferenceStore: ConversationReferenceStore;
}

enum ActivityType {
    CurrentBotAdded,
    CommandReceived,
    InvokeActionTriggered,
    Unknown
}

export class NotificationMiddleware implements Middleware {
    private readonly conversationReferenceStore: ConversationReferenceStore;

    constructor(options: NotificationMiddlewareOptions) {
        this.conversationReferenceStore = options.conversationReferenceStore;
    }

    public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        const type = this.classifyActivity(context.activity);
        switch (type) {
            case ActivityType.CurrentBotAdded:
                const reference = TurnContext.getConversationReference(context.activity);
                await this.conversationReferenceStore.add(reference);
                break;
            default:
                break;
        }

        await next();
    }

    private classifyActivity(activity: Activity): ActivityType {
        if (this.isBotAdded(activity)) {
            return ActivityType.CurrentBotAdded;
        }

        return ActivityType.Unknown;
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

export class CommandResponseMiddleware implements Middleware {
    private readonly commandHandlers: TeamsFxCommandHandler[];

    constructor(commandHandlers: TeamsFxCommandHandler[]) {
        this.commandHandlers = commandHandlers;
    }

    public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        const type = this.classifyActivity(context.activity);
        switch (type) {
            case ActivityType.CommandReceived:
                // Invoke corresponding command handler for the command response
                const commandName = this.getActivityText(context.activity);
                const handlers = this.commandHandlers.filter(handler => handler.commandName === commandName);
                if (handlers.length > 0) {
                    await handlers[0].handleCommandReceived(context);
                } 
                break;
            case ActivityType.InvokeActionTriggered:
                const invokeResponse = await this.commandHandlers[0].handleInvokeActivity(context);

                // set the response
                context.turnState.set(INVOKE_RESPONSE_KEY, { 
                    value: invokeResponse,
                    type: ActivityTypes.InvokeResponse
                });
                break
            default:
                break;
        }

        await next();
    }

    private classifyActivity(activity: Activity): ActivityType {
        if (this.isCommandReceived(activity)) {
            return ActivityType.CommandReceived;
        }

        if (this.isInvokeActivity(activity)) {
            return ActivityType.InvokeActionTriggered;
        }

        return ActivityType.Unknown;
    }

    private isCommandReceived(activity: Activity): boolean {
        if (this.commandHandlers) {
            let text = this.getActivityText(activity);
            const handlers = this.commandHandlers.filter(handler => handler.commandName === text);
            return handlers.length > 0;
        } else {
            return false;
        }
    }

    private isInvokeActivity(activity: Activity): boolean {
        return (
            activity !== undefined &&
            activity.type === ActivityTypes.Invoke &&
            activity.name === 'adaptiveCard/action');
    }

    private getActivityText(activity: Activity): string {
        let text = activity.text;
        const removedMentionText = TurnContext.removeRecipientMention(activity);
        if (removedMentionText) {
            text = removedMentionText.toLowerCase().replace(/\n|\r\n/g, "").trim();
        }

        return text;
    }
}