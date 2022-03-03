import { AzureFunction, Context } from "@azure/functions";
import { Activity } from "botbuilder";
import { teamsfxBot } from "./global";
import { buildBotMessage } from "./adaptiveCardBuider";

// Time trigger to send notification. You can change the schedule in ../timerNotifyTrigger/function.json
const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  const timeStamp = new Date().toISOString();
  const message: Partial<Activity> = buildBotMessage(() => {
    return {
      title: "New Event Occurred!",
      appName: "Contoso App Notification",
      description: `Detailed description of what happened so the user knows what's going on. (${timeStamp})`,
      notificationUrl: "https://www.adaptivecards.io/"
    }
  });

  await teamsfxBot.forEachAppInstallation(async appInstallation => teamsfxBot.notifyAppInstallation(appInstallation, message));
};

export default timerTrigger;
