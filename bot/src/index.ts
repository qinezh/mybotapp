import { Activity } from "botbuilder";
import * as cron from "node-cron";
import { TeamsFxBot } from "./sdk/bot";
import { adapter } from "./adapter";
import { server } from "./server";
import { buildBotMessage, CardData } from "./message";

/**
 * This method is customized by userd to retrirve the notification data and transform to the CardData model.
 * @returns a card data object
 */
function getCardData(): CardData {
  // This is just to mock the notification data retrieval
  const rawData = {
    title: "New Event Occurred!", 
    description: "Detailed description of what happened so the user knows what's going on.",
    url : "https://www.adaptivecards.io/",
  };

  // A default transformer to transform the original notification data to card data model.
  return {
    title: rawData.title,
    appName: "Contoso App Notification",
    description: rawData.description,
    notificationUrl: rawData.url
  }
}

const message: Partial<Activity> = buildBotMessage(getCardData);

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
