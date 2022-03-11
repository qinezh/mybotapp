// try better naming to hide for user

import { BotFrameworkAdapter, TurnContext } from "botbuilder";
import { BotNotification } from "../sdk/notification";
import { WelcomeCommandHandler } from "../welcomeCommandHandler";

// See https://aka.ms/about-bot-adapter to learn more about adapters.
export const adapter = new BotFrameworkAdapter({
  appId: process.env.BOT_ID,
  appPassword: process.env.BOT_PASSWORD,
});

// Catch-all for errors.
// Set the onTurnError for the singleton BotFrameworkAdapter.
adapter.onTurnError = async (context: TurnContext, error: Error) => {
  // This check writes out errors to console log .vs. app insights.
  // NOTE: In production environment, you should consider logging this to Azure
  //       application insights.
  console.error(`\n [onTurnError] unhandled error: ${error}`);

  // Send a trace activity, which will be displayed in Bot Framework Emulator
  await context.sendTraceActivity(
      "OnTurnError Trace",
      `${error}`,
      "https://www.botframework.com/schemas/error",
      "TurnError"
  );

  // Send a message to the user
  await context.sendActivity(`The bot encountered unhandled error:\n ${error.message}`);
  await context.sendActivity("To continue to run this bot, please fix the bot source code.");
};

BotNotification.InitializeNotification(adapter);
BotNotification.InitializeCommandResponse(adapter, [ new WelcomeCommandHandler() ])
