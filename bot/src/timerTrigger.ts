import { AzureFunction, Context } from "@azure/functions"
import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import { Activity, CardFactory } from "botbuilder";
import { teamsfxBot } from "./global";
import messageTemplate from "./message.template.json";

// Time trigger to send notification. You can change the schedule in ../timerNotifyTrigger/function.json
const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  const timeStamp = new Date().toISOString();
  const message: Partial<Activity> = {
    attachments: [
      CardFactory.adaptiveCard(AdaptiveCards.declare(messageTemplate).render({
        title: "Notification Test",
        message: `This is an timer notification from TeamsFx bot. (${timeStamp})`
      }))
    ]
  };

  await teamsfxBot.forEachInstallation(async installation => {
    await teamsfxBot.notifyInstallation(installation, message);
  });
};

export default timerTrigger;
