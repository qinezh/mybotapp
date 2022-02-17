import { Activity, CardFactory, Middleware, TurnContext } from "botbuilder";
import { TeamsFxBotContext } from "./context";
import { WelcomeMessage, TeamsFxBotSettingsProvider, WelcomeMessageTrigger } from "./interfaces";
import { BotSettingsStore, ConversationReferenceStore } from "./store";
import { Utils } from "./utils";

export interface TeamsFxMiddlewareOptions {
    conversationReferenceStore: ConversationReferenceStore,
    settingsStore: BotSettingsStore;
    welcomeMessage?: WelcomeMessage,
    settingsProvider?: TeamsFxBotSettingsProvider
}

export class TeamsFxMiddleware implements Middleware {
    private readonly conversationReferenceStore: ConversationReferenceStore;
    private readonly settingsStore: BotSettingsStore;
    private readonly welcomeMessage: WelcomeMessage | undefined;
    private readonly settingsProvider: TeamsFxBotSettingsProvider | undefined;

    constructor(options: TeamsFxMiddlewareOptions) {
        this.conversationReferenceStore = options.conversationReferenceStore;
        this.settingsStore = options.settingsStore;
        this.welcomeMessage = options.welcomeMessage;
        this.welcomeMessage.trigger = options.welcomeMessage.trigger ?? WelcomeMessageTrigger.BotInstall;
        this.settingsProvider = options.settingsProvider;
    }

    public async onTurn(context: TurnContext, next: () => Promise<void>): Promise<void> {
        if (this.isBotAdded(context.activity)) {
            // Bot is added for the first time.
            const reference = TurnContext.getConversationReference(context.activity);
            await this.conversationReferenceStore.add(reference);

            if (this.welcomeMessage?.trigger === WelcomeMessageTrigger.BotInstall) {
                await context.sendActivity(this.welcomeMessage.message);
            }
        } else if (this.isMembersAdded(context.activity) && this.welcomeMessage?.trigger === WelcomeMessageTrigger.NewMemberAdded) {
            // New members (current bot is excluded) are added. 
            await context.sendActivity(this.welcomeMessage.message);
        } else if (this.settingsProvider && this.isSettingsCardSubmitted(context.activity)) {
            // Handle adaptive card submit operation
            const subscriberId = Utils.getSubscriberId(context);
            const settings = await this.settingsProvider.handleCardSubmit(
                new TeamsFxBotContext(context, this.settingsStore),
                context.activity.value
            );
            this.settingsStore.set(subscriberId, settings);
        } else if (this.settingsProvider) {
            // Send teamsfx bot settings
            let text = context.activity.text;
            const removedMentionText = TurnContext.removeRecipientMention(context.activity);
            if (removedMentionText) {
                text = removedMentionText.toLowerCase().replace(/\n|\r\n/g, "").trim();
            }

            switch (text) {
                case this.settingsProvider.commandName: {
                    const card = await this.settingsProvider.sendSettingsCard(new TeamsFxBotContext(context, this.settingsStore));
                    await context.sendActivity({
                        attachments: [CardFactory.adaptiveCard(card)]
                    });
                }
            }
        }

        await next();
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
}