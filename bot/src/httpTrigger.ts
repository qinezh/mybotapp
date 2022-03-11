import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { BotNotification } from "./sdk/notification";
import { buildAdaptiveCard } from "./adaptiveCardBuider";

// HTTP trigger to send notification.
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  for (const target of await BotNotification.installations()) {
    await target.sendAdaptiveCard(buildAdaptiveCard(() => {
      return {
        title: "New Event Occurred!",
        appName: "Contoso App Notification",
        description: "This is a sample http-triggered notification",
        notificationUrl: "https://www.adaptivecards.io/"
      }
    }));
  }



  context.res = {};
};

export default httpTrigger;