import { Activity, CardFactory } from "botbuilder";
import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import { TeamsFxBot } from "./sdk/bot";
import { adapter } from "./adapter";
import { server } from "./server";
import messageTemplate from "./message.template.json";

const teamsfxBot = new TeamsFxBot(adapter);

const message: Partial<Activity> = {
  attachments: [
    CardFactory.adaptiveCard(AdaptiveCards.declare(messageTemplate).render({
      title: "Notification Test",
      message: "This is a notification from TeamsFx bot."
    }))
  ]
};

server.post("/api/notify/default", async (req, res) => {
  await teamsfxBot.forEachSubscribers(async subscriber => {
    await teamsfxBot.notifySubscriber(subscriber, message);
  });

  res.json({});
});
