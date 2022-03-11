import { Activity, Middleware, TurnContext } from "botbuilder";
import { buildBotMessageWithCard } from "./adaptiveCard";
import { TeamsFxCommandHandler } from "./commandHandler";
import { ConversationReferenceStore } from "./store";

export interface NotificationMiddlewareOptions {
    conversationReferenceStore: ConversationReferenceStore;
}

enum ActivityType {
    CurrentBotAdded,
    CommandReceived,
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
        let handlers: TeamsFxCommandHandler[] = [];
        switch (type) {
            case ActivityType.CommandReceived:
                // Invoke corresponding command handler for the command response
                const commandText = this.getActivityText(context.activity);

                handlers = this.commandHandlers.filter(handler => {
                    return handler.commandTextPattern?.test(commandText) || handler.commandName === commandText;             
                });

                if (handlers.length > 0) {
                    const reply = await handlers[0].handleCommandReceived(context, commandText);
                    if (typeof reply === 'string') {
                        await context.sendActivity(reply);
                    } else {
                        const botMessage = buildBotMessageWithCard(reply);
                        await context.sendActivity(botMessage);
                    }                  
                }
                break;
            default:
                break;
        }

        await next();
    }

    private classifyActivity(activity: Activity): ActivityType {
        if (this.isCommandReceived(activity)) {
            return ActivityType.CommandReceived;
        }

        return ActivityType.Unknown;
    }

    private isCommandReceived(activity: Activity): boolean {
        if (this.commandHandlers) {
            let commandText = this.getActivityText(activity);
            const handlers = this.commandHandlers.filter(handler => {
                return handler.commandTextPattern?.test(commandText) || handler.commandName === commandText;             
            });
            return handlers.length > 0;
        } else {
            return false;
        }
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