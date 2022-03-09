import { BotFrameworkAdapter, ChannelInfo, ConversationReference, TeamsChannelAccount, TeamsInfo, TurnContext } from "botbuilder";

export type TargetType = "Channel" | "Group" | "Person";

export interface Member {
    type: "Person";
    notificationTarget: NotificationTarget;
    account: TeamsChannelAccount;
}

export interface Channel {
    type: "Channel";
    notificationTarget: NotificationTarget;
    info: ChannelInfo;
}

export class NotificationTarget {
    private readonly adapter: BotFrameworkAdapter;
    private readonly conversationReference: Partial<ConversationReference>;
    public readonly type?: TargetType;

    constructor(
        adapter: BotFrameworkAdapter,
        conversationReference: Partial<ConversationReference>,
        type?: TargetType,
    ) {
        this.adapter = adapter;
        this.conversationReference = conversationReference;
        this.type = type;
    }

    public continueConversation(logic: (context: TurnContext) => Promise<void>): Promise<void> {
        return this.adapter.continueConversation(this.conversationReference, logic);
    }

    public async members(): Promise<Member[]> {
        let teamsMembers: TeamsChannelAccount[];
        await this.continueConversation(async context => { teamsMembers = await TeamsInfo.getMembers(context); });
        const members: Member[] = [];
        for (const member of teamsMembers) {
            members.push({
                type: "Person",
                notificationTarget: this,
                account: member,
            })
        }

        return members;
    }

    public async channels(): Promise<Channel[]> {
        let teamsChannels: ChannelInfo[];
        await this.continueConversation(async context => {
            const teamId = NotificationTarget.getNotificationTargeId(context);
            if (!teamId) {
                teamsChannels = [];
            }
            teamsChannels = await TeamsInfo.getTeamChannels(context, teamId);
        });

        const channels: Channel[] = [];
        for (const channel of teamsChannels) {
            channels.push({
                type: "Channel",
                notificationTarget: this,
                info: channel,
            })
        }

        return channels;
    }

    private static getNotificationTargeId(context: TurnContext): string {
        return context.activity?.channelData?.team?.id
            ?? context.activity.conversation.id;
    }
}