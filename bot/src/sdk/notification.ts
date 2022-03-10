import { BotFrameworkAdapter, Storage } from "botbuilder";
import { LocalFileStorage } from "./fileStorage";
import { NotificationMiddleware } from "./middleware";
import { ConversationReferenceStore } from "./store";
import { TeamsBotTarget } from "./context";

export interface BotNotificationOptions {
    /**
     * If `storage` is not provided, a default LocalFileStorage will be used.
     * You could also use the `BlobsStorage` provided by botbuilder-azure-blobs
     * or `CosmosDbPartitionedStorage` provided by botbuilder-azure
     * */
    storage?: Storage,
}

export class BotNotification {
    private static readonly conversationReferenceStoreKey = "teamfx-notification-targets";
    private static conversationReferenceStore: ConversationReferenceStore;
    private static adapter: BotFrameworkAdapter;

    public static Initialize(connector: BotFrameworkAdapter, options?: BotNotificationOptions) {
        const storage = options?.storage ?? new LocalFileStorage();
        BotNotification.conversationReferenceStore = new ConversationReferenceStore(storage, BotNotification.conversationReferenceStoreKey);
        BotNotification.adapter = connector.use(new NotificationMiddleware({
            conversationReferenceStore: BotNotification.conversationReferenceStore,
        }));
    }

    public static async getTargets(): Promise<TeamsBotTarget[]> {
        if (BotNotification.conversationReferenceStore === undefined || BotNotification.adapter === undefined) {
            throw new Error("BotNotification has not been initialized.");
        }

        const references = await BotNotification.conversationReferenceStore.list();
        const targets: TeamsBotTarget[] = [];
        for (const reference of references) {
            targets.push(new TeamsBotTarget(BotNotification.adapter, reference));
        }

        return targets;
    }
}