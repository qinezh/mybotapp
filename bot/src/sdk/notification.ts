import { BotFrameworkAdapter, ConversationReference, TurnContext, Storage, Activity } from "botbuilder";
import { ConnectorClient } from "botframework-connector";
import { Channel, Member, NotificationTarget, TargetType } from "./context";
import { LocalFileStorage } from "./fileStorage";
import { NotificationMiddleware } from "./middleware";
import { ConversationReferenceStore } from "./store";

export interface AppNotificationOptions {
    /**
     * If `storage` is not provided, a default LocalFileStorage will be used.
     * You could also use the `BlobsStorage` provided by botbuilder-azure-blobs
     * or `CosmosDbPartitionedStorage` provided by botbuilder-azure
     * */
    storage?: Storage,
}

export class AppNotification {
    private readonly conversationReferenceStore: ConversationReferenceStore;
    private readonly adapter: BotFrameworkAdapter;
    private readonly conversationReferenceStoreKey = "teamfx-notification-targets";

    constructor(connector: BotFrameworkAdapter, options?: AppNotificationOptions) {
        const storage = options?.storage ?? new LocalFileStorage();
        this.conversationReferenceStore = new ConversationReferenceStore(storage, this.conversationReferenceStoreKey);
        this.adapter = connector.use(new NotificationMiddleware({
            conversationReferenceStore: this.conversationReferenceStore,
        }));
    }

    public async getNotificationTargets(): Promise<NotificationTarget[]> {
        const references = await this.conversationReferenceStore.list();
        const notificationTargets: NotificationTarget[] = [];
        for (const reference of references) {
            const targetType = this.getTargetType(reference);
            notificationTargets.push(new NotificationTarget(this.adapter, reference, targetType));
        }

        return notificationTargets;
    }

    public async notify(activityOrText: string | Partial<Activity>, target: NotificationTarget | Member | Channel): Promise<void> {
        if (target instanceof NotificationTarget) {
            await this.notifyTarget(activityOrText, target);
        } else if (target.type === "Person") {
            await this.notifyMember(activityOrText, target);
        } else if (target.type === "Channel") {
            await this.notifyChannel(activityOrText, target);
        } else {
            throw new Error("target is none of NotificationTarget|Member|Channel");
        }
    }

    public async notifyAll(activityOrText: string | Partial<Activity>, options?: { scope: "Default" | "Member" | "Channel" }): Promise<void> {
        const targets = await this.getNotificationTargets();
        for (const target of targets) {
            if (options === undefined || options.scope === "Default") {
                await this.notifyTarget(activityOrText, target);
            } else if (options.scope === "Member") {
                const members = await target.members();
                for (const member of members) {
                    await this.notifyMember(activityOrText, member);
                }
            } else if (options.scope === "Channel") {
                const channels = await target.channels();
                for (const channel of channels) {
                    await this.notifyChannel(activityOrText, channel);
                }
            }
        }
    }

    private notifyTarget(activityOrText: string | Partial<Activity>, target: NotificationTarget): Promise<void>{
        return target.continueConversation(async context => { await context.sendActivity(activityOrText) });
    }

    private notifyMember(activityOrText: string | Partial<Activity>, member: Member): Promise<void> {
        return member.notificationTarget.continueConversation(async context => {
            const reference = TurnContext.getConversationReference(context.activity);
            const personalConversation = this.cloneConversation(reference);
    
            const connectorClient: ConnectorClient = context.turnState.get(this.adapter.ConnectorClientKey);
            const conversation = await connectorClient.conversations.createConversation({
                isGroup: false,
                tenantId: context.activity.conversation.tenantId,
                bot: context.activity.recipient,
                members: [member.account],
                activity: undefined,
                channelData: {},
            });
            personalConversation.conversation.id = conversation.id;

            await context.sendActivity(activityOrText);
        });
    }

    private notifyChannel(activityOrText: string | Partial<Activity>, channel: Channel): Promise<void> {
        return channel.notificationTarget.continueConversation(async context => {
            const reference = TurnContext.getConversationReference(context.activity);
            const channelConversation = this.cloneConversation(reference);
            channelConversation.conversation.id = channel.info.id;

            await context.sendActivity(activityOrText);
        });
    }

    private cloneConversation(conversation: Partial<ConversationReference>): ConversationReference {
        return Object.assign(<ConversationReference>{}, conversation);
    }

    private getTargetType(conversationReference: Partial<ConversationReference>): TargetType | undefined {
        const conversationType = conversationReference.conversation?.conversationType;
        if (conversationType === "personal") {
            return "Person";
        } else if (conversationType === "groupChat") {
            return "Group";
        } else if (conversationType === "channel") {
            return "Channel";
        } else {
            return undefined;
        }
    }
}
