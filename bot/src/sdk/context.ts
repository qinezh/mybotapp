import { TurnContext, TeamsInfo } from "botbuilder";
import { BotContext, TeamsFxMember, TeamsFxChannel, TeamsFxBotSettings } from "./interfaces";
import { BotSettingsStore } from "./store";
import { Utils } from "./utils";

export class TeamsFxBotContext implements BotContext {
    public turnContext: TurnContext;
    private settingsStore: BotSettingsStore;

    constructor(
        turnContext: TurnContext,
        settingsStore: BotSettingsStore
    ) {
        this.turnContext = turnContext;
        this.settingsStore = settingsStore;
    }

    public get members(): Promise<TeamsFxMember[]> {
        return (async () => {
            const teamsMembers = await TeamsInfo.getMembers(this.turnContext);
            const teamsfxMembers: TeamsFxMember[] = [];
            for (const member of teamsMembers) {
                teamsfxMembers.push({
                    installation: this,
                    account: member
                })
            }

            return teamsfxMembers;
        })();
    }

    public get channels(): Promise<TeamsFxChannel[]> {
        return (async () => {
            const teamsfxChannels: TeamsFxChannel[] = [];
            const teamId = Utils.getInstallationId(this.turnContext);
            if (!teamId) {
                return teamsfxChannels;
            }

            const teamsChannels = await TeamsInfo.getTeamChannels(this.turnContext, teamId);
            for (const channel of teamsChannels) {
                teamsfxChannels.push({
                    installation: this,
                    info: channel
                })
            }

            return teamsfxChannels;
        })();
    }

    public get settings(): Promise<TeamsFxBotSettings> {
        const installationId = Utils.getInstallationId(this.turnContext);
        return (async () => {
            return await this.settingsStore.get(installationId);
        })();
    }
}