import { Activity, InvokeResponse, TurnContext } from "botbuilder";

export interface TeamsFxCommandHandler {
    /**
     * The command nane the this handler will process.
     */
    commandName: string;

    /**
     * Handles a bot command received.
     * @param context The bot context.
     */
    handleCommandReceived(context: TurnContext): Promise<void>;

    /**
     * Handles an invoke activity.
     * @param context The bot context.
     * @returns An InvokeResponse object that bot framework will reply to user.
     */
    handleInvokeActivity(context: TurnContext): Promise<InvokeResponse>;

    /**
     * Used to identify whether the Invoke Activity should be handled by this command handler.
     * @param activity 
     */
    shouldActivityBeHandled(activity: Activity): boolean;
}

export abstract class BaseCommandHandler implements TeamsFxCommandHandler {
    public readonly commandName: string;

    constructor(commandName: string) {
        this.commandName = commandName;
    }
    
    handleCommandReceived(context: TurnContext): Promise<void> {
        throw new Error("Method not implemented.");
    }

    handleInvokeActivity(context: TurnContext): Promise<InvokeResponse<any>> {
        throw new Error("Method not implemented.");
    }

    shouldActivityBeHandled(activity: Activity): boolean {
        return false;
    }
    
}
