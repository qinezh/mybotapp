import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { appNotification } from "./internal/initialize";
import { buildBotMessage, NotificationCardData } from "./adaptiveCardBuider";
import notificationTemplate from "./adaptiveCards/notification-default.json"

// HTTP trigger to send notification.
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  await appNotification.notifyAll(buildBotMessage<NotificationCardData>(() => {
    return {
      title: "New Event Occurred!",
      appName: "Contoso App Notification",
      description: "This is a sample http-triggered notification",
      notificationUrl: "https://www.adaptivecards.io/"
    }
  }, notificationTemplate));

  context.res = {};
};

export default httpTrigger;