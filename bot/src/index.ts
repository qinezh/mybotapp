import { MessageFactory } from "botbuilder";
import { TeamsFxBot } from "./sdk/bot";
import { adapter } from "./adapter";
import { server } from "./server";

const teamsfxBot = new TeamsFxBot(adapter);

server.post("/api/notify/default", async (req, res) => {
  await teamsfxBot.forEachSubscribers(async subscriber => {
    await teamsfxBot.notifySubscriber(subscriber, MessageFactory.text(`Hello world!`));
  });

  res.json({});
});
