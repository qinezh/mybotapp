import { TurnContext } from "botbuilder";

export class Utils {
    public static getInstallationId(context: TurnContext): string {
        return context.activity?.channelData?.team?.id
            ?? context.activity.conversation.id;
    }
}