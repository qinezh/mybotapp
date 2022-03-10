import { AzureFunction, Context } from "@azure/functions";
import { appConversation } from "./internal/initialize";
import { buildBotMessage, NotificationCardData } from "./adaptiveCardBuider";
import notificationTemplate from "./adaptiveCards/notification-default.json"

// Time trigger to send notification. You can change the schedule in ../timerNotifyTrigger/function.json
const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  const timeStamp = new Date().toISOString();
  await appConversation.notifyAll(buildBotMessage<NotificationCardData>(() => {
    return {
      title: "New Event Occurred!",
      appName: "Contoso App Notification",
      description: `This is a sample time-triggered notification (${timeStamp}).`,
      notificationUrl: "https://www.adaptivecards.io/"
    }
  }, notificationTemplate));
};

export default timerTrigger;
