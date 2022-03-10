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
     handleExecuteAction(context: TurnContext): Promise<InvokeResponse>;

    /**
     * Used to identify whether the execute action should be handled by this command handler.
     * @param activity 
     */
    shouldHandleExecutionAction(activity: Activity): boolean;
}

export abstract class BaseCommandHandler implements TeamsFxCommandHandler {
    public readonly commandName: string;

    constructor(commandName: string) {
        this.commandName = commandName;
    }
    
    handleCommandReceived(context: TurnContext): Promise<void> {
        throw new Error("Method not implemented.");
    }

    handleExecuteAction(context: TurnContext): Promise<InvokeResponse<any>> {
        throw new Error("Method not implemented.");
    }

    shouldHandleExecutionAction(activity: Activity): boolean {
        return false;
    }
    
}
