import { AzureFunction, Context } from "@azure/functions";
import { buildAdaptiveCard } from "./adaptiveCardBuider";
import { BotNotification } from "./sdk/notification";

// Time trigger to send notification. You can change the schedule in ../timerNotifyTrigger/function.json
const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  const timeStamp = new Date().toISOString();
  for (const target of await BotNotification.getTargets()) {
    await target.notifyAdaptiveCard(buildAdaptiveCard(() => {
      return {
        title: "New Event Occurred!",
        appName: "Contoso App Notification",
        description: `This is a sample time-triggered notification (${timeStamp}).`,
        notificationUrl: "https://www.adaptivecards.io/"
      }
    }));
  }
};

export default timerTrigger;
