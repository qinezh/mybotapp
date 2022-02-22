import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import { BasicTeamsFxBotSettingsProvider, BotContext, TeamsFxBotSettings, TeamsFxBotSettingsProvider, TeamsFxBotSettingsProviderOptions } from "./sdk/interfaces";

// User code to implement the `TeamsFxBotSettingsProvider`
// to send adaptive card for notification settings
// and save the settings according to the adaptive data submitted.
export class AppSettingsProvider extends BasicTeamsFxBotSettingsProvider {
    constructor(options: TeamsFxBotSettingsProviderOptions) {
        super(options);
    }

    public async handleCardSubmit(context: BotContext, data: any): Promise<TeamsFxBotSettings> {
        const settings: TeamsFxBotSettings = await context.settings;
        for (const channel of await context.channels) {
            if (channel.info.id in data) {
                settings[channel.info.id] = data[channel.info.id] === 'true';
            }
        }

        return settings;
    }

    public async sendSettingsCard(context: BotContext): Promise<any> {
        let channelBlocks = [];

        const settings = await context.settings;
        for (const channel of await context.channels) {
            const channelBlock = {
                type: "Input.Toggle",
                id: channel.info.id,
                title: channel.info.name ?? "General",
                value: '' + settings[channel.info.id] ?? false,
                valueOn: "true",
                valueOff: "false"
            };
            channelBlocks.push(channelBlock);
        }

        const settingsCard = {
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.0",
            body: [
                {
                    type: "TextBlock",
                    text: "Bot Notification Settings",
                },
                {
                    type: "TextBlock",
                    text: "Channels",
                },
                ...channelBlocks
            ],
            actions: [
                {
                    type: "Action.Submit",
                    title: "Update Settings",
                    data: {
                        // Required to identity the action of updating settings instead of others actions.
                        [this.submitActionKey]: this.submitActionValue
                    },
                    associatedInputs: "Auto",
                },
            ],
        };

        return AdaptiveCards.declareWithoutData(settingsCard).render();
    }

}
