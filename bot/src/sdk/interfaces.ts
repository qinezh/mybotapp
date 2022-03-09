import { Activity, ChannelInfo, InvokeResponse, TeamsChannelAccount, TurnContext } from "botbuilder";

export interface WelcomeMessage {
    message: Partial<Activity>,
    trigger?: WelcomeMessageTrigger,
}

export enum WelcomeMessageTrigger {
    BotInstall,
    NewMemberAdded
}

export interface TeamsFxBotSettingsProviderOptions {
    commandName?: string;
    submitActionKey?: string;
    submitActionValue?: string;
}

export interface TeamsFxBotSettingsProvider {
    commandName: string;
    submitActionKey: string;
    submitActionValue: string;
    handleCardSubmit(context: BotContext, data: any): Promise<TeamsFxBotSettings>;
    sendSettingsCard(context: BotContext): Promise<any>;
}

export abstract class BasicTeamsFxBotSettingsProvider implements TeamsFxBotSettingsProvider {
    readonly commandName: string;
    readonly submitActionKey: string;
    readonly submitActionValue: string;

    constructor(options: TeamsFxBotSettingsProviderOptions) {
        this.commandName = options.commandName ?? "settings";
        this.submitActionKey = options.submitActionKey ?? "submitAction";
        this.submitActionValue = options.submitActionValue ?? "updateSettings";
    }

    abstract handleCardSubmit(context: BotContext, data: any): Promise<TeamsFxBotSettings>;
    abstract sendSettingsCard(context: BotContext): Promise<any>;
}

export type TeamsFxBotSettings = { [key: string]: any };

export interface TeamsFxCommandHandler {
    /**
     * The command nane the this handler will process.
     */
    commandName: string;

    /**
     * Handles a bot command received.
     * @param context The bot context.
     */
    handleCommandReceived(context: BotContext): Promise<void>;

    /**
     * Handles an invoke activity.
     * @param context The bot context.
     * @returns An InvokeResponse object that bot framework will reply to user.
     */
    handleInvokeActivity(context: BotContext): Promise<InvokeResponse>;
}

export interface TeamsFxMember {
    appInstallation: BotContext,
    account: TeamsChannelAccount
}

export interface TeamsFxChannel {
    appInstallation: BotContext,
    info: ChannelInfo
}

export interface BotContext {
    turnContext: TurnContext;
    members: Promise<TeamsFxMember[]>;
    channels: Promise<TeamsFxChannel[]>;
    settings: Promise<TeamsFxBotSettings>
}