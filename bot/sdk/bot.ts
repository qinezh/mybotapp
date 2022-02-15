import { BotFrameworkAdapter, ChannelInfo, ConversationReference, TeamsChannelAccount, TurnContext, Storage } from "botbuilder";
import { ConnectorClient } from "botframework-connector";
import { FileStorage } from "./fileStorage";
import { ConversationReferenceStore } from "./store";

export class TeamsFxBot {
    public readonly store: ConversationReferenceStore;
    private readonly adapter: BotFrameworkAdapter;
    private readonly key = "teamfx-subscribers";
    private readonly fileName = "conversationReferences.json";

    /**
     * If `storage` is not provided, FileStorage will be used by default.
     * You could also use the `BlobsStorage` provided by botbuilder-azure-blobs
     * or `CosmosDbPartitionedStorage` provided by botbuilder-azure
     * */
    constructor(adapter: BotFrameworkAdapter, storage?: Storage) {
        this.adapter = adapter;
        storage = storage ?? new FileStorage(this.fileName);
        this.store = new ConversationReferenceStore(storage, this.key);
    }

    public async listSubscribers(action: (subscriberContext: TurnContext) => Promise<void>): Promise<void> {
        const references = await this.store.list();
        for (const reference of references)
            await this.adapter.continueConversation(reference, async (context: TurnContext) => {
                await action(context);
            });
    }

    public async notify(context: TurnContext, activity: Partial<ConversationReference>): Promise<void> {
        await context.sendActivity(activity);
    }

    public async notifyMember(context: TurnContext, member: TeamsChannelAccount, activity: Partial<ConversationReference>): Promise<void> {
        const reference = TurnContext.getConversationReference(context.activity);
        const personalConversation = this.cloneConversation(reference);

        const connectorClient: ConnectorClient = context.turnState.get(this.adapter.ConnectorClientKey);
        const conversation = await connectorClient.conversations.createConversation({
            isGroup: false,
            tenantId: context.activity.conversation.tenantId,
            bot: context.activity.recipient,
            members: [member],
            activity: undefined,
            channelData: {},
        });
        personalConversation.conversation.id = conversation.id;

        await this.adapter.continueConversation(personalConversation, async (context: TurnContext) => {
            await context.sendActivity(activity);
        });
    }

    public async notifyChannel(context: TurnContext, channel: ChannelInfo, activity: Partial<ConversationReference>): Promise<void> {
        const reference = TurnContext.getConversationReference(context.activity);
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
