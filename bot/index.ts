import * as restify from "restify";
import { BotFrameworkAdapter, MessageFactory, TeamsActivityHandler, TurnContext } from "botbuilder";
import { TeamsFxBot } from "./sdk/bot";
import { BlobsStorage } from "botbuilder-azure-blobs";

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new BotFrameworkAdapter({
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

const welcomeMessage = {
  message: MessageFactory.text("Hello, this is notification bot created by TeamsFx.")
};

// use Azure Blob storage to save subscribers info.
// const teamsfxBot = new TeamsFxBot(adapter, {
//   storage: new BlobsStorage(process.env.blobConnectionString, process.env.blobContainerName),
//   welcomeMessage
// });
const teamsfxBot = new TeamsFxBot(adapter, {
  welcomeMessage
});

// Create HTTP server.
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nBot Started, ${server.name} listening to ${server.url}`);
});

// Process Teams activity with Bot Framework.
const handler = new TeamsActivityHandler();
server.post("/api/messages", async (req, res) => {
  await adapter.processActivity(req, res, async (context) => {
    await handler.run(context);
  });
});

// HTTP trigger for the notification.
// Case 1: send notification to the default place (Teams/Group Chat/Personal Chat) where the bot is installed.
server.post("/api/notify/default", async (req, res) => {
  await teamsfxBot.forEachSubscribers(async subscriber => {
    await teamsfxBot.notifySubscriber(subscriber, MessageFactory.text(`Hello world!`));
  });

  res.json({});
});

// Case 2: send notification to all the members of the subscribed team/group chat.
server.post("/api/notify/members", async (req, res) => {
  await teamsfxBot.forEachSubscribers(async subscriber => {
    for (const member of await subscriber.members) {
      await teamsfxBot.notifyMember(member, MessageFactory.text(`Hello ${member.account.name}!`));
    }
  });

  res.json({});
});

// Case 3: send notification to particular channel of the subscribed team.
server.post("/api/notify/channels", async (req, res) => {
  await teamsfxBot.forEachSubscribers(async subscriber => {
    for (const channel of await subscriber.channels) {
      switch (channel.info.name) {
        case "Test":
          await teamsfxBot.notifyChannel(channel, MessageFactory.text(`Hello world!`));
          break;
        default:
        // pass
      }
    }
  });

  res.json({});
});