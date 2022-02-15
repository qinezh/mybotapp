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

    public async listSubscribers(action: (subscriber: TeamsFxBotContext) => Promise<void>): Promise<void> {
        const references = await this.store.list();
        for (const reference of references)
            await this.adapter.continueConversation(reference, async (context: TurnContext) => {
                await action(new TeamsFxBotContext(context));
            });
    }

    public async notify(context: TeamsFxBotContext, activity: Partial<ConversationReference>): Promise<void> {
        await context.turnContext.sendActivity(activity);
    }

    public async notifyMember(context: TeamsFxBotContext, member: TeamsChannelAccount, activity: Partial<ConversationReference>): Promise<void> {
        const reference = TurnContext.getConversationReference(context.turnContext.activity);
        const personalConversation = this.cloneConversation(reference);

        const connectorClient: ConnectorClient = context.turnContext.turnState.get(this.adapter.ConnectorClientKey);
        const conversation = await connectorClient.conversations.createConversation({
            isGroup: false,
            tenantId: context.turnContext.activity.conversation.tenantId,
            bot: context.turnContext.activity.recipient,
            members: [member],
            activity: undefined,
            channelData: {},
        });
        personalConversation.conversation.id = conversation.id;

        await this.adapter.continueConversation(personalConversation, async (context: TurnContext) => {
            await context.sendActivity(activity);
        });
    }

    public async notifyChannel(context: TeamsFxBotContext, channel: ChannelInfo, activity: Partial<ConversationReference>): Promise<void> {
        const reference = TurnContext.getConversationReference(context.turnContext.activity);
        const channelConversation = this.cloneConversation(reference);
        channelConversation.conversation.id = channel.id;

        await this.adapter.continueConversation(channelConversation, async (context: TurnContext) => {
            await context.sendActivity(activity);
        });
    }

    private cloneConversation(conversation: Partial<ConversationReference>): ConversationReference {
        return Object.assign(<ConversationReference>{}, conversation);
    }
}

class TeamsFxBotContext {
    public turnContext: TurnContext;

    public get members() {
        return TeamsInfo.getMembers(this.turnContext);
    }

    public get channels() {
        return TeamsInfo.getTeamChannels(this.turnContext, this.turnContext.activity.conversation.id);
    }

    constructor(turnContext: TurnContext) {
        this.turnContext = turnContext;
    }
}