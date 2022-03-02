import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import { Activity, CardFactory } from "botbuilder";
import { teamsfxBot } from "./global";
import messageTemplate from "./message.template.json";

// HTTP trigger to send notification.
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const message: Partial<Activity> = {
    attachments: [
      CardFactory.adaptiveCard(AdaptiveCards.declare(messageTemplate).render({
        title: "Notification Test",
        message: `This is an http notification from TeamsFx bot. ${req.body?.content}`
      }))
    ]
  };

  await teamsfxBot.forEachInstallation(async installation => {
    await teamsfxBot.notifyInstallation(installation, message);
  });

  context.res = {};
};

export default httpTrigger;