import { TurnContext } from "botbuilder";
import welcomeCard from "./adaptiveCards/welcome-command.json"
import { TeamsFxCommandHandler } from "./sdk/commandHandler";

export class WelcomeCommandHandler implements TeamsFxCommandHandler {
    commandName?: string = "welcome";
    commandTextPattern?: RegExp;

    async handleCommandReceived(context: TurnContext, commandText: string): Promise<any> {
        // verify the command arguments which is received from the client if needed.

        // do something to process your command and return an adaptive card or a text message.
        return welcomeCard;
    }   
}