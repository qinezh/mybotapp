import { BotFrameworkAdapter, Storage } from "botbuilder";
import { LocalFileStorage } from "./fileStorage";
import { CommandResponseMiddleware, NotificationMiddleware } from "./middleware";
import { ConversationReferenceStore } from "./store";
import { TeamsBotInstallation } from "./context";
import { TeamsFxCommandHandler } from "./commandHandler";

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

    public static InitializeNotification(connector: BotFrameworkAdapter, options?: BotNotificationOptions) {
        const storage = options?.storage ?? new LocalFileStorage();
        BotNotification.conversationReferenceStore = new ConversationReferenceStore(storage, BotNotification.conversationReferenceStoreKey);
        BotNotification.adapter = connector.use(new NotificationMiddleware({
            conversationReferenceStore: BotNotification.conversationReferenceStore,
        }));
    }

    public static InitializeCommandResponse(connector: BotFrameworkAdapter, commandHandlers: TeamsFxCommandHandler[]) {
        this.adapter = connector.use(new CommandResponseMiddleware(commandHandlers));
    }

    public static async installations(): Promise<TeamsBotInstallation[]> {
        if (BotNotification.conversationReferenceStore === undefined || BotNotification.adapter === undefined) {
            throw new Error("BotNotification has not been initialized.");
        }

        const references = await BotNotification.conversationReferenceStore.list();
        const targets: TeamsBotInstallation[] = [];
        for (const reference of references) {
            targets.push(new TeamsBotInstallation(BotNotification.adapter, reference));
        }

        return targets;
    }
}
