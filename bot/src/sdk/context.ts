import axios from "axios";
import { BotFrameworkAdapter, CardFactory, ChannelInfo, ConversationReference, TeamsChannelAccount, TeamsInfo, TurnContext } from "botbuilder";
import { ConnectorClient } from "botframework-connector";

export type TargetType = "Channel" | "Group" | "Person";

export interface NotificationTarget {
    readonly type?: TargetType;
    notifyText(text: string): Promise<void>;
    notifyAdaptiveCard(card: any): Promise<void>;
}

export class Channel implements NotificationTarget {
    public readonly parent: TeamsBotTarget;
    public readonly info: ChannelInfo;
    public readonly type: TargetType = "Channel";

    constructor(parent: TeamsBotTarget, info: ChannelInfo) {
        this.parent = parent;
        this.info = info;
    }

    public notifyText(text: string): Promise<void> {
        return this.parent.continueConversation(async context => {
            const conversation = await this.newConversation(context);
            await this.parent.adapter.continueConversation(conversation, async (ctx: TurnContext) => {
                await ctx.sendActivity(text);
            });
        });
    }

    public async notifyAdaptiveCard(card: any): Promise<void> {
        return this.parent.continueConversation(async context => {
            const conversation = await this.newConversation(context);
            await this.parent.adapter.continueConversation(conversation, async (ctx: TurnContext) => {
                await ctx.sendActivity({
                    attachments: [
                        CardFactory.adaptiveCard(card)
                    ]
                });
            });
        });
    }

    private async newConversation(context: TurnContext): Promise<ConversationReference> {
        const reference = TurnContext.getConversationReference(context.activity);
        const channelConversation = cloneConversation(reference);
        channelConversation.conversation.id = this.info.id;

        return channelConversation;
    }
}

export class Member implements NotificationTarget {
    public readonly parent: TeamsBotTarget;
    public readonly account: TeamsChannelAccount;
    public readonly type: TargetType = "Person";

    constructor(parent: TeamsBotTarget, account: TeamsChannelAccount) {
        this.parent = parent;
        this.account = account;
    }

    public notifyText(text: string): Promise<void> {
        return this.parent.continueConversation(async context => {
            const conversation = await this.newConversation(context);
            await this.parent.adapter.continueConversation(conversation, async (ctx: TurnContext) => {
                await ctx.sendActivity(text);
            });
        });
    }

    public async notifyAdaptiveCard(card: any): Promise<void> {
        return this.parent.continueConversation(async context => {
            const conversation = await this.newConversation(context);
            await this.parent.adapter.continueConversation(conversation, async (ctx: TurnContext) => {
                await ctx.sendActivity({
                    attachments: [
                        CardFactory.adaptiveCard(card)
                    ]
                });
            });
        });
    }

    private async newConversation(context: TurnContext): Promise<ConversationReference> {
        const reference = TurnContext.getConversationReference(context.activity);
        const personalConversation = cloneConversation(reference);

        const connectorClient: ConnectorClient = context.turnState.get(this.parent.adapter.ConnectorClientKey);
        const conversation = await connectorClient.conversations.createConversation({
            isGroup: false,
            tenantId: context.activity.conversation.tenantId,
            bot: context.activity.recipient,
            members: [this.account],
            activity: undefined,
            channelData: {},
        });
        personalConversation.conversation.id = conversation.id;

        return personalConversation;
    }
}

export class TeamsBotTarget implements NotificationTarget {
    public readonly adapter: BotFrameworkAdapter;
    public readonly conversationReference: Partial<ConversationReference>;
    public readonly type?: TargetType;

    constructor(
        adapter: BotFrameworkAdapter,
        conversationReference: Partial<ConversationReference>,
    ) {
        this.adapter = adapter;
        this.conversationReference = conversationReference;
        this.type = getTargetType(conversationReference);
    }

    public notifyText(text: string): Promise<void> {
        return this.continueConversation(async context => { await context.sendActivity(text) });
    }

    public notifyAdaptiveCard(card: any): Promise<void> {
        return this.continueConversation(async context => {
            await context.sendActivity({
                attachments: [
                    CardFactory.adaptiveCard(card)
                ]
            });
        });
    }

    public async channels(): Promise<Channel[]> {
        let teamsChannels: ChannelInfo[];
        await this.continueConversation(async context => {
            const teamId = getTeamsBotTargetId(context);
            if (!teamId) {
                teamsChannels = [];
            }
            teamsChannels = await TeamsInfo.getTeamChannels(context, teamId);
        });

        const channels: Channel[] = [];
        for (const channel of teamsChannels) {
            channels.push(new Channel(this, channel));
        }

        return channels;
    }

    public async members(): Promise<Member[]> {
        let teamsMembers: TeamsChannelAccount[];
        await this.continueConversation(async context => { teamsMembers = await TeamsInfo.getMembers(context); });
        const members: Member[] = [];
        for (const member of teamsMembers) {
            members.push(new Member(this, member));
        }

        return members;
    }

    public continueConversation(logic: (context: TurnContext) => Promise<void>): Promise<void> {
        return this.adapter.continueConversation(this.conversationReference, logic);
    }
}

export class IncomingWebhookTarget implements NotificationTarget {
    public readonly type: TargetType = "Channel";
    public readonly webhook: URL;

    constructor(webhook: URL) {
        this.webhook = webhook;
    }

    public notifyText(text: string): Promise<void> {
        return axios.post(
            this.webhook.toString(),
            {
                text: text
            },
            {
                headers: { "content-type": "application/json" }
            },
        );
    }

    public notifyAdaptiveCard(card: any): Promise<void> {
        return axios.post(
            this.webhook.toString(),
            {
                type: "message",
                attachments: [
                    {
                        contentType: "application/vnd.microsoft.card.adaptive",
                        contentUrl: null,
                        content: card,
                    },
                ],
            },
            {
                headers: { "content-type": "application/json" }
            },
        );
    }
}

function cloneConversation(conversation: Partial<ConversationReference>): ConversationReference {
    return Object.assign(<ConversationReference>{}, conversation);
}

function getTargetType(conversationReference: Partial<ConversationReference>): TargetType | undefined {
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

function getTeamsBotTargetId(context: TurnContext): string {
    return context.activity?.channelData?.team?.id
        ?? context.activity.conversation.id;
}