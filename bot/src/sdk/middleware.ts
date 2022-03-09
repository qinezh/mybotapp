import { Activity, ActivityTypes, CardFactory, INVOKE_RESPONSE_KEY, Middleware, TurnContext } from "botbuilder";
import { TeamsFxBotContext } from "./context";
import { WelcomeMessage, TeamsFxBotSettingsProvider, TeamsFxCommandHandler, WelcomeMessageTrigger } from "./interfaces";
import { BotSettingsStore, ConversationReferenceStore } from "./store";
import { Utils } from "./utils";

export interface TeamsFxMiddlewareOptions {
    conversationReferenceStore: ConversationReferenceStore,
    settingsStore: BotSettingsStore;
    welcomeMessage?: WelcomeMessage,
    settingsProvider?: TeamsFxBotSettingsProvider,
    commandHandlers?: TeamsFxCommandHandler[]
}

enum ActivityType {
    CurrentBotAdded,
    NewMemberAdded,
    SettingsCardSubmitted,
    SettingCommandReceived,
    CommandReceived,
    InvokeActivity,
    Unknown
}

export class TeamsFxMiddleware implements Middleware {
    private readonly conversationReferenceStore: ConversationReferenceStore;
    private readonly settingsStore: BotSettingsStore;
    private readonly welcomeMessage: WelcomeMessage | undefined;
    private readonly settingsProvider: TeamsFxBotSettingsProvider | undefined;
    private readonly commandHandlers: TeamsFxCommandHandler[] = [];

    constructor(options: TeamsFxMiddlewareOptions) {
        this.conversationReferenceStore = options.conversationReferenceStore;
        this.settingsStore = options.settingsStore;
        if (options.welcomeMessage) {
            this.welcomeMessage = options.welcomeMessage;
            this.welcomeMessage.trigger = options.welcomeMessage?.trigger ?? WelcomeMessageTrigger.BotInstall;
        }

        if (options.settingsProvider) {
            this.settingsProvider = options.settingsProvider;
        }

        if (options.commandHandlers) {
            this.commandHandlers = options.commandHandlers;
        }
    }

    public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        const type = this.classifyActivity(context.activity);
        switch (type) {
            case ActivityType.CurrentBotAdded:
                const reference = TurnContext.getConversationReference(context.activity);
                await this.conversationReferenceStore.add(reference);

                if (this.welcomeMessage?.trigger === WelcomeMessageTrigger.BotInstall) {
                    await context.sendActivity(this.welcomeMessage.message);
                }
                break;
            case ActivityType.NewMemberAdded:
                await context.sendActivity(this.welcomeMessage.message);
                break;
            case ActivityType.SettingsCardSubmitted:
                const appInstallationId = Utils.getAppInstallationId(context);
                const settings = await this.settingsProvider.handleCardSubmit(
                    new TeamsFxBotContext(context, this.settingsStore),
                    context.activity.value
                );
                this.settingsStore.set(appInstallationId, settings);
                break;
            case ActivityType.SettingCommandReceived:
                const card = await this.settingsProvider.sendSettingsCard(new TeamsFxBotContext(context, this.settingsStore));
                await context.sendActivity({
                    attachments: [CardFactory.adaptiveCard(card)]
                });
                break;
            case ActivityType.CommandReceived:
                await this.commandHandlers[0].handleCommandReceived(new TeamsFxBotContext(context, this.settingsStore));
                break;
            case ActivityType.InvokeActivity:
                const invokeResponse = await this.commandHandlers[0].handleInvokeActivity(new TeamsFxBotContext(context, this.settingsStore));

                // set the response
                context.turnState.set(INVOKE_RESPONSE_KEY, { 
                    value: invokeResponse,
                    type: ActivityTypes.InvokeResponse
                });
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

        if (this.isMembersAdded(activity)) {
            return ActivityType.NewMemberAdded;
        }

        if (this.settingsProvider && this.isSettingsCardSubmitted(activity)) {
            return ActivityType.SettingsCardSubmitted;
        }

        if (this.settingsProvider) {
            let text = activity.text;
            const removedMentionText = TurnContext.removeRecipientMention(activity);
            if (removedMentionText) {
                text = removedMentionText.toLowerCase().replace(/\n|\r\n/g, "").trim();
            }

            if (text === this.settingsProvider.commandName) {
                return ActivityType.SettingCommandReceived
            }
        }

        if (this.commandHandlers && this.isCommandReceived(activity)) {
            return ActivityType.CommandReceived;
        }

        if (this.isInvokeActivity(activity)){
            return ActivityType.InvokeActivity;
        }

        return ActivityType.Unknown;
    }

    // current bot is excluded.
    private isMembersAdded(activity: Partial<Activity>): boolean {
        return activity.membersAdded?.length > 0 && !this.isBotAdded(activity);
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

    private isSettingsCardSubmitted(activity: Activity): boolean {
        if (!activity.value) {
            return false;
        }

        return activity.value[this.settingsProvider.submitActionKey] === this.settingsProvider.submitActionValue
    }

    private isCommandReceived(activity: Activity): boolean {
        if (this.commandHandlers) {
            let text = activity.text;
            const removedMentionText = TurnContext.removeRecipientMention(activity);
            if (removedMentionText) {
                text = removedMentionText.toLowerCase().replace(/\n|\r\n/g, "").trim();
            }

            const handlers = this.commandHandlers.filter(handler => handler.commandName === text);
            return handlers.length > 0;
        } else {
            return false;
        }
    }

    private isInvokeActivity(activity: Activity): boolean {
        return (activity !== undefined && activity.type === 'invoke' && activity.name === 'adaptiveCard/action');
    }
}