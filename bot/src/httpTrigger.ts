import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { Activity } from "botbuilder";
import { teamsfxBot } from "./global";
import { buildBotMessage, NotificationCardData } from "./adaptiveCardBuider";
import notificationTemplate from "./adaptiveCards/notification-default.json";

// HTTP trigger to send notification.
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const message: Partial<Activity> = buildBotMessage<NotificationCardData>(() => {
    return {
      title: "New Event Occurred!",
      appName: "Contoso App Notification",
      description: "This is a sample http-triggered notification",
      notificationUrl: "https://www.adaptivecards.io/"
    }
  }, notificationTemplate);

  await teamsfxBot.forEachAppInstallation(async appInstallation => teamsfxBot.notifyAppInstallation(appInstallation, message));

  context.res = {};
};

export default httpTrigger;