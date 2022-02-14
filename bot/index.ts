// Import required packages
import * as restify from "restify";

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import { BotFrameworkAdapter, MessageFactory, TeamsActivityHandler, TeamsInfo, TurnContext } from "botbuilder";

import { TeamsFxMiddleware } from "./sdk/middleware";
import { TeamsFxBot } from "./sdk/bot";

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

const teamsfxBot = new TeamsFxBot(adapter);
adapter.use(new TeamsFxMiddleware(process.env.BOT_ID, teamsfxBot));

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
// Case 1: send notification to all the members of the subscribed team/group chat.
server.post("/api/notify/members", async (req, res) => {
  await teamsfxBot.listSubscribers(async ctx => {
    const members = await TeamsInfo.getMembers(ctx);
    for (const member of members) {
      await teamsfxBot.notifyMember(ctx, member, MessageFactory.text(`Hello ${member.name}!`));
    }
  });

  res.json({});
});

// Case 2: send notification to particular channel of the subscribed team.
server.post("/api/notify/channels", async (req, res) => {
  await teamsfxBot.listSubscribers(async ctx => {
    const channels = await TeamsInfo.getTeamChannels(ctx, ctx.activity.conversation.id);
    for (const channel of channels) {
      switch (channel.name) {
        case "Notification":
          await teamsfxBot.notifyChannel(ctx, channel, MessageFactory.text(`Hello world!`));
          break;
        default:
        // pass
      }
    }
  });

  res.json({});
});