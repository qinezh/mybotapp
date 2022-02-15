import { BotFrameworkAdapter, ChannelInfo, ConversationReference, TeamsChannelAccount, TurnContext, Storage, TeamsInfo } from "botbuilder";
import { ConnectorClient } from "botframework-connector";
import { FileStorage } from "./fileStorage";
import { TeamsFxMiddleware } from "./middleware";
import { ConversationReferenceStore } from "./store";

export interface TeamsFxBotOptions {
    /**
     * If `storage` is not provided, FileStorage will be used by default.
     * You could also use the `BlobsStorage` provided by botbuilder-azure-blobs
     * or `CosmosDbPartitionedStorage` provided by botbuilder-azure
     * */
    storage?: Storage
}

export class TeamsFxBot {
    public readonly store: ConversationReferenceStore;
    private readonly adapter: BotFrameworkAdapter;
    private readonly key = "teamfx-subscribers";
    private readonly fileName = "conversationReferences.json";

    constructor(adapter: BotFrameworkAdapter, options?: TeamsFxBotOptions) {
        const storage = options?.storage ?? new FileStorage(this.fileName);
        this.store = new ConversationReferenceStore(storage, this.key);
        this.adapter = adapter.use(new TeamsFxMiddleware(this.store));
    }

    public async forEachSubscribers(action: (subscriber: TeamsFxBotContext) => Promise<void>): Promise<void> {
        const references = await this.store.list();
        for (const reference of references)
            await this.adapter.continueConversation(reference, async (context: TurnContext) => {
                await action(new TeamsFxBotContext(context));
            });
    }

    public async notifySubscriber(subscriber: TeamsFxBotContext, activity: Partial<ConversationReference>): Promise<void> {
        await subscriber.turnContext.sendActivity(activity);
    }

    public async notifyMember(member: TeamsFxMember, activity: Partial<ConversationReference>): Promise<void> {
        const reference = TurnContext.getConversationReference(member.subscriber.turnContext.activity);
        const personalConversation = this.cloneConversation(reference);

        const connectorClient: ConnectorClient = member.subscriber.turnContext.turnState.get(this.adapter.ConnectorClientKey);
        const conversation = await connectorClient.conversations.createConversation({
            isGroup: false,
            tenantId: member.subscriber.turnContext.activity.conversation.tenantId,
            bot: member.subscriber.turnContext.activity.recipient,
            members: [member.account],
            activity: undefined,
            channelData: {},
        });
        personalConversation.conversation.id = conversation.id;

        await this.adapter.continueConversation(personalConversation, async (context: TurnContext) => {
            await context.sendActivity(activity);
        });
    }

    public async notifyChannel(channel: TeamsFxChannel, activity: Partial<ConversationReference>): Promise<void> {
        const reference = TurnContext.getConversationReference(channel.subscriber.turnContext.activity);
        const channelConversation = this.cloneConversation(reference);
        channelConversation.conversation.id = channel.info.id;

        await this.adapter.continueConversation(channelConversation, async (context: TurnContext) => {
            await context.sendActivity(activity);
        });
    }

    private cloneConversation(conversation: Partial<ConversationReference>): ConversationReference {
        return Object.assign(<ConversationReference>{}, conversation);
    }
}

interface TeamsFxMember {
    subscriber: TeamsFxBotContext,
    account: TeamsChannelAccount
}

interface TeamsFxChannel {
    subscriber: TeamsFxBotContext,
    info: ChannelInfo
}

class TeamsFxBotContext {
    public turnContext: TurnContext;

    public get members() {
        return (async () => {
            const teamsMembers = await TeamsInfo.getMembers(this.turnContext);
            const teamsfxMembers: TeamsFxMember[] = [];
            for (const member of teamsMembers) {
                teamsfxMembers.push({
                    subscriber: this,
                    account: member
                })
            }

            return teamsfxMembers;
        })();
    }

    public get channels() {
        return (async () => {
            const teamsChannels = await TeamsInfo.getTeamChannels(this.turnContext, this.turnContext.activity.conversation.id);
            const teamsfxChannels: TeamsFxChannel[] = [];
            for (const channel of teamsChannels) {
                teamsfxChannels.push({
                    subscriber: this,
                    info: channel
                })
            }

            return teamsfxChannels;
        })();
    }

    constructor(turnContext: TurnContext) {
        this.turnContext = turnContext;
    }
}