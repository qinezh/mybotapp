import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { Activity } from "botbuilder";
import { teamsfxBot } from "./global";
import { buildBotMessage } from "./message";

// HTTP trigger to send notification.
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const message: Partial<Activity> = buildBotMessage(() => {
    return {
      title: "New Event Occurred!",
      appName: "Contoso App Notification",
      description: "Detailed description of what happened so the user knows what's going on.",
      notificationUrl: "https://www.adaptivecards.io/"
    }
  });

  await teamsfxBot.forEachInstallation(async installation => {
    await teamsfxBot.notifyInstallation(installation, message);
  });

  context.res = {};
};

export default httpTrigger;