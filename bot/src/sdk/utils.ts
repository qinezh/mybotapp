import { Activity, TurnContext } from "botbuilder";

export class Utils {
    public static getAppInstallationId(context: TurnContext): string {
        return context.activity?.channelData?.team?.id
            ?? context.activity.conversation.id;
    }

    public static getActivityText(activity: Activity): string {
        let text = activity.text;
        const removedMentionText = TurnContext.removeRecipientMention(activity);
        if (removedMentionText) {
            text = removedMentionText.toLowerCase().replace(/\n|\r\n/g, "").trim();
        }

        return text;
    }
}