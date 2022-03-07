import { Activity } from "botbuilder";
import * as cron from "node-cron";
import { TeamsFxBot } from "./sdk/bot";
import { adapter } from "./adapter";
import { server } from "./server";
import { buildBotMessage, buildBotMessageWithList, CardData, CardDataWithList } from "./adaptiveCardBuilder";

/**
 * This method is customized by userd to retrirve the notification data and transform to the CardData model.
 * @returns a card data object
 */
function getCardDataWithList(): CardDataWithList {
  // This is just to mock the notification data retrieval and transform
  return {
    title: "New Event Occurred!",
    appName: "Contoso App Notification",
    description: "Detailed description of what happened so the user knows what's going on.",
    notificationUrl: "https://www.adaptivecards.io/",
    data: [
      "List Item 1",
      "List Item 2",
      "List Item 3"
    ]
  }
}

const message: Partial<Activity> = buildBotMessageWithList(getCardDataWithList);

const teamsfxBot = new TeamsFxBot(adapter);

// HTTP trigger to send notification.
server.post("/api/notify/default", async (req, res) => {
  await teamsfxBot.forEachSubscribers(async subscriber => {
    await teamsfxBot.notifySubscriber(subscriber, message);
  });

  res.json({});
});

// Time trigger to send notification.
cron.schedule('*/1 * * * *', async () => {
  // send notification every one minutes.
  await teamsfxBot.forEachSubscribers(async subscriber => {
    await teamsfxBot.notifySubscriber(subscriber, message);
  });
});
